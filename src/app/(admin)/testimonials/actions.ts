"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ORDER_CHANGED, orderChanges, orderIdsSchema } from "@/lib/order";
import { nullIfEmpty } from "@/lib/schema";
import { endPositions, testimonialsOnPage } from "./testimonial.order";
import { parseTestimonialPage } from "./testimonial.pages";
import {
  placementFor,
  testimonialSchema,
  type TestimonialInput,
} from "./testimonial.schema";

export type SaveResult = { ok: true } | { ok: false; error: string };

function toRow(values: TestimonialInput) {
  return {
    type: values.type,
    name: values.name,
    job_title: nullIfEmpty(values.job_title),
    company: nullIfEmpty(values.company),
    context_label: nullIfEmpty(values.context_label),
    quote: values.quote,
    avatar_url: nullIfEmpty(values.avatar_url),
    is_published: values.is_published,
    ...placementFor(values),
  };
}

// 23503: the chosen service or course was deleted meanwhile.
// 23514: a database check the form doesn't know about.
function saveError(code: string | undefined): SaveResult | null {
  if (code === "23503")
    return {
      ok: false,
      error: "The linked service or course no longer exists. Reload the page.",
    };
  if (code === "23514")
    return {
      ok: false,
      error: "The database rejected this combination of type and placement.",
    };
  return null;
}

export async function createTestimonial(input: unknown): Promise<SaveResult> {
  const db = await requireAdmin();
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const row = toRow(parsed.data);
  // Last on every page it's placed on.
  const { error } = await db
    .from("testimonials")
    .insert({ ...row, ...(await endPositions(db, row)) });
  const known = saveError(error?.code);
  if (known) return known;
  if (error) throw error;
  revalidatePath("/testimonials");
  redirect(`/testimonials?type=${parsed.data.type}`);
}

export async function saveTestimonial(
  id: string,
  input: unknown,
): Promise<SaveResult> {
  const db = await requireAdmin();
  const testimonialId = z.uuid().parse(id);
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const row = toRow(parsed.data);
  const { data: before, error: readError } = await db
    .from("testimonials")
    .select("show_on_home, show_on_academy, service_slug, course_id")
    .eq("id", testimonialId)
    .maybeSingle();
  if (readError) throw readError;
  // Newly placed on a page (or moved to another service or course): last
  // there. Pages it was already on keep its position.
  const { error } = await db
    .from("testimonials")
    .update({ ...row, ...(await endPositions(db, row, before ?? undefined)) })
    .eq("id", testimonialId);
  const known = saveError(error?.code);
  if (known) return known;
  if (error) throw error;
  revalidatePath("/testimonials");
  revalidatePath(`/testimonials/${testimonialId}`);
  return { ok: true };
}

export async function deleteTestimonial(id: string) {
  const db = await requireAdmin();
  const { data, error } = await db
    .from("testimonials")
    .delete()
    .eq("id", z.uuid().parse(id))
    .select("type")
    .maybeSingle();
  if (error) throw error;
  // Its photo stays in the library for reuse; the Unused images page lists it.
  revalidatePath("/testimonials");
  redirect(`/testimonials?type=${data?.type ?? "client"}`);
}

const positionUpdate = (
  column: "sort_order" | "home_sort_order" | "academy_sort_order",
  value: number,
): Partial<Record<typeof column, number>> => ({ [column]: value });

/** Saves the order of one page's testimonials; other pages keep theirs. */
export async function saveTestimonialOrder(
  pageKey: string,
  ids: unknown,
): Promise<{ error: string } | undefined> {
  const db = await requireAdmin();
  const page = parseTestimonialPage(pageKey);
  if (!page) throw new Error("Unknown page.");
  const rows = await testimonialsOnPage(db, page);
  const changes = orderChanges(
    rows.map((row) => ({ id: row.id, sort_order: row.position })),
    orderIdsSchema.parse(ids),
  );
  if (!changes) return { error: ORDER_CHANGED };
  const results = await Promise.all(
    changes.map((change) =>
      db
        .from("testimonials")
        .update(positionUpdate(page.column, change.sort_order))
        .eq("id", change.id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
  revalidatePath("/testimonials/order");
}
