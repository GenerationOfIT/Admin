"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { syncChildren } from "@/lib/children";
import { ORDER_CHANGED, orderChanges, orderIdsSchema } from "@/lib/order";
import { loadService } from "./service.data";
import { nullIfEmpty } from "@/lib/schema";
import {
  cardLists,
  newServiceSchema,
  serviceSchema,
  type ServiceInput,
} from "./service.schema";

export type SaveResult =
  | { ok: true; service: ServiceInput }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const SLUG_TAKEN = {
  ok: false as const,
  error: "Another service already uses this slug.",
  fieldErrors: { slug: "Already used by another service." },
};

export async function createService(input: unknown): Promise<SaveResult> {
  const db = await requireAdmin();
  const parsed = newServiceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const { data: last } = await db
    .from("services")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await db
    .from("services")
    .insert({
      ...parsed.data,
      // New services stay hidden until they're filled in and published.
      is_published: false,
      sort_order: (last?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();
  if (error?.code === "23505") return SLUG_TAKEN;
  if (error) throw error;
  revalidatePath("/services");
  redirect(`/services/${data.id}`);
}

export async function saveService(
  id: string,
  input: unknown,
): Promise<SaveResult> {
  const db = await requireAdmin();
  const serviceId = z.uuid().parse(id);
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const values = parsed.data;

  const { error } = await db
    .from("services")
    .update({
      title: values.title,
      slug: values.slug,
      card_description: values.card_description,
      introduction: nullIfEmpty(values.introduction),
      scope_title: values.scope_title,
      use_cases_title: values.use_cases_title,
      deliverables_title: values.deliverables_title,
      seo_title: nullIfEmpty(values.seo_title),
      seo_description: nullIfEmpty(values.seo_description),
      is_published: values.is_published,
    })
    .eq("id", serviceId);
  if (error?.code === "23505") return SLUG_TAKEN;
  if (error) throw error;

  for (const list of cardLists)
    await syncChildren(
      db,
      list.table,
      { column: "service_id", id: serviceId },
      values[list.key],
    );

  revalidatePath("/services");
  revalidatePath(`/services/${serviceId}`);
  // Fresh rows give new cards their ids, so the next save updates them.
  const service = await loadService(db, serviceId);
  if (!service) return { ok: false, error: "This service no longer exists." };
  return { ok: true, service };
}

export async function deleteService(
  id: string,
): Promise<{ error: string } | undefined> {
  const db = await requireAdmin();
  const { error } = await db
    .from("services")
    .delete()
    .eq("id", z.uuid().parse(id));
  // Only before GenOfIT migration 20261027150000 is applied: since then a
  // trigger unlinks and unpublishes the service's testimonials instead.
  if (error?.code === "23503")
    return {
      error:
        "Testimonials are linked to this service, so the database refused the delete.",
    };
  if (error) throw error;
  revalidatePath("/services");
  redirect("/services");
}

const toggleSchema = z.object({
  id: z.uuid(),
  published: z.enum(["true", "false"]),
});

export async function setPublished(formData: FormData) {
  const db = await requireAdmin();
  const { id, published } = toggleSchema.parse(Object.fromEntries(formData));
  const { error } = await db
    .from("services")
    .update({ is_published: published === "true" })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/services");
}

/** Saves the list's order, as set in its "Edit order" mode, in one go. */
export async function saveServiceOrder(
  ids: unknown,
): Promise<{ error: string } | undefined> {
  const db = await requireAdmin();
  const { data: rows, error } = await db
    .from("services")
    .select("id, sort_order");
  if (error) throw error;
  const changes = orderChanges(rows, orderIdsSchema.parse(ids));
  if (!changes) return { error: ORDER_CHANGED };
  const results = await Promise.all(
    changes.map((change) =>
      db
        .from("services")
        .update({ sort_order: change.sort_order })
        .eq("id", change.id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
  revalidatePath("/services");
}
