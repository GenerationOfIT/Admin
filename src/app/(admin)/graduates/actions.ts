"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ORDER_CHANGED, orderChanges, orderIdsSchema } from "@/lib/order";
import { nullIfEmpty } from "@/lib/schema";
import { graduateSchema, type GraduateInput } from "./graduate.schema";

export type SaveResult = { ok: true } | { ok: false; error: string };

function toRow(values: GraduateInput) {
  return {
    name: values.name,
    title: values.title,
    image_url: nullIfEmpty(values.image_url),
    is_published: values.is_published,
  };
}

export async function createGraduate(input: unknown): Promise<SaveResult> {
  const db = await requireAdmin();
  const parsed = graduateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const { data: last } = await db
    .from("graduates")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await db
    .from("graduates")
    .insert({ ...toRow(parsed.data), sort_order: (last?.sort_order ?? 0) + 1 });
  if (error) throw error;
  revalidatePath("/graduates");
  redirect("/graduates");
}

export async function saveGraduate(
  id: string,
  input: unknown,
): Promise<SaveResult> {
  const db = await requireAdmin();
  const graduateId = z.uuid().parse(id);
  const parsed = graduateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const { error } = await db
    .from("graduates")
    .update(toRow(parsed.data))
    .eq("id", graduateId);
  if (error) throw error;
  revalidatePath("/graduates");
  revalidatePath(`/graduates/${graduateId}`);
  return { ok: true };
}

export async function deleteGraduate(id: string) {
  const db = await requireAdmin();
  const { error } = await db
    .from("graduates")
    .delete()
    .eq("id", z.uuid().parse(id));
  if (error) throw error;
  // The photo stays in the library for reuse; Unused images lists it.
  revalidatePath("/graduates");
  redirect("/graduates");
}

const toggleSchema = z.object({
  id: z.uuid(),
  published: z.enum(["true", "false"]),
});

export async function setGraduatePublished(formData: FormData) {
  const db = await requireAdmin();
  const { id, published } = toggleSchema.parse(Object.fromEntries(formData));
  const { error } = await db
    .from("graduates")
    .update({ is_published: published === "true" })
    .eq("id", id);
  // graduates_published_have_photo refuses publishing without a photo; the list
  // only offers Publish when there is one.
  if (error) throw error;
  revalidatePath("/graduates");
}

/** Saves the list's order, as set in its "Edit order" mode, in one go. */
export async function saveGraduateOrder(
  ids: unknown,
): Promise<{ error: string } | undefined> {
  const db = await requireAdmin();
  const { data: rows, error } = await db
    .from("graduates")
    .select("id, sort_order");
  if (error) throw error;
  const changes = orderChanges(rows, orderIdsSchema.parse(ids));
  if (!changes) return { error: ORDER_CHANGED };
  const results = await Promise.all(
    changes.map((change) =>
      db
        .from("graduates")
        .update({ sort_order: change.sort_order })
        .eq("id", change.id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
  revalidatePath("/graduates");
}
