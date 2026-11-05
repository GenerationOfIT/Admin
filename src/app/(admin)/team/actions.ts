"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ORDER_CHANGED, orderChanges, orderIdsSchema } from "@/lib/order";
import { nullIfEmpty } from "@/lib/schema";
import { teamMemberSchema, type TeamMemberInput } from "./team.schema";

export type SaveResult = { ok: true } | { ok: false; error: string };

function toRow(values: TeamMemberInput) {
  return {
    name: values.name,
    role: values.role,
    organization: nullIfEmpty(values.organization),
    image_url: nullIfEmpty(values.image_url),
    is_published: values.is_published,
  };
}

export async function createTeamMember(input: unknown): Promise<SaveResult> {
  const db = await requireAdmin();
  const parsed = teamMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const { data: last } = await db
    .from("team_members")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await db
    .from("team_members")
    .insert({ ...toRow(parsed.data), sort_order: (last?.sort_order ?? 0) + 1 });
  if (error) throw error;
  revalidatePath("/team");
  redirect("/team");
}

export async function saveTeamMember(
  id: string,
  input: unknown,
): Promise<SaveResult> {
  const db = await requireAdmin();
  const memberId = z.uuid().parse(id);
  const parsed = teamMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const { error } = await db
    .from("team_members")
    .update(toRow(parsed.data))
    .eq("id", memberId);
  if (error) throw error;
  revalidatePath("/team");
  revalidatePath(`/team/${memberId}`);
  return { ok: true };
}

export async function deleteTeamMember(id: string) {
  const db = await requireAdmin();
  const { error } = await db
    .from("team_members")
    .delete()
    .eq("id", z.uuid().parse(id));
  if (error) throw error;
  // The photo stays in the library for reuse; Unused images lists it.
  revalidatePath("/team");
  redirect("/team");
}

const toggleSchema = z.object({
  id: z.uuid(),
  published: z.enum(["true", "false"]),
});

export async function setTeamMemberPublished(formData: FormData) {
  const db = await requireAdmin();
  const { id, published } = toggleSchema.parse(Object.fromEntries(formData));
  if (published === "true") {
    // Same rule as the form: the About page breaks without a photo.
    const { data } = await db
      .from("team_members")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();
    if (!data?.image_url) throw new Error("Add a photo before publishing.");
  }
  const { error } = await db
    .from("team_members")
    .update({ is_published: published === "true" })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/team");
}

/** Saves the list's order, as set in its "Edit order" mode, in one go. */
export async function saveTeamOrder(
  ids: unknown,
): Promise<{ error: string } | undefined> {
  const db = await requireAdmin();
  const { data: rows, error } = await db
    .from("team_members")
    .select("id, sort_order");
  if (error) throw error;
  const changes = orderChanges(rows, orderIdsSchema.parse(ids));
  if (!changes) return { error: ORDER_CHANGED };
  const results = await Promise.all(
    changes.map((change) =>
      db
        .from("team_members")
        .update({ sort_order: change.sort_order })
        .eq("id", change.id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
  revalidatePath("/team");
}
