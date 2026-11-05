"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ORDER_CHANGED, orderChanges, orderIdsSchema } from "@/lib/order";
import { nullIfEmpty } from "@/lib/schema";
import { partnerSchema, type PartnerInput } from "./partner.schema";

export type SaveResult = { ok: true } | { ok: false; error: string };

function toRow(values: PartnerInput) {
  return {
    name: values.name,
    logo_url: nullIfEmpty(values.logo_url),
    is_published: values.is_published,
  };
}

export async function createPartner(input: unknown): Promise<SaveResult> {
  const db = await requireAdmin();
  const parsed = partnerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const { data: last } = await db
    .from("partners")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await db
    .from("partners")
    .insert({ ...toRow(parsed.data), sort_order: (last?.sort_order ?? 0) + 1 });
  if (error) throw error;
  revalidatePath("/partners");
  redirect("/partners");
}

export async function savePartner(
  id: string,
  input: unknown,
): Promise<SaveResult> {
  const db = await requireAdmin();
  const partnerId = z.uuid().parse(id);
  const parsed = partnerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const { error } = await db
    .from("partners")
    .update(toRow(parsed.data))
    .eq("id", partnerId);
  if (error) throw error;
  revalidatePath("/partners");
  revalidatePath(`/partners/${partnerId}`);
  return { ok: true };
}

export async function deletePartner(id: string) {
  const db = await requireAdmin();
  const { error } = await db
    .from("partners")
    .delete()
    .eq("id", z.uuid().parse(id));
  if (error) throw error;
  // The logo stays in the library for reuse; Unused images lists it.
  revalidatePath("/partners");
  redirect("/partners");
}

const toggleSchema = z.object({
  id: z.uuid(),
  published: z.enum(["true", "false"]),
});

export async function setPartnerPublished(formData: FormData) {
  const db = await requireAdmin();
  const { id, published } = toggleSchema.parse(Object.fromEntries(formData));
  const { error } = await db
    .from("partners")
    .update({ is_published: published === "true" })
    .eq("id", id);
  // partners_published_have_logo refuses publishing without a logo; the list
  // only offers Publish when there is one.
  if (error) throw error;
  revalidatePath("/partners");
}

/** Saves the list's order, as set in its "Edit order" mode, in one go. */
export async function savePartnerOrder(
  ids: unknown,
): Promise<{ error: string } | undefined> {
  const db = await requireAdmin();
  const { data: rows, error } = await db
    .from("partners")
    .select("id, sort_order");
  if (error) throw error;
  const changes = orderChanges(rows, orderIdsSchema.parse(ids));
  if (!changes) return { error: ORDER_CHANGED };
  const results = await Promise.all(
    changes.map((change) =>
      db
        .from("partners")
        .update({ sort_order: change.sort_order })
        .eq("id", change.id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
  revalidatePath("/partners");
}
