import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { requireAdmin } from "@/lib/auth";

type Db = Awaited<ReturnType<typeof requireAdmin>>;

/** Child lists edited as one ordered list in a form (cards, parts, items). */
export type ChildTable =
  | "service_scope_items"
  | "service_use_cases"
  | "service_deliverables"
  | "course_overview_items"
  | "course_modules"
  | "course_outcomes"
  | "course_capstone_items"
  | "course_lecturers"
  | "event_highlights"
  | "event_speakers"
  | "event_agenda_items";

// Lists the site orders by another column (the agenda by starts_at) have no
// sort_order to write.
const unordered = new Set<ChildTable>(["event_agenda_items"]);

type Item = { id?: string } & Record<string, unknown>;

/**
 * Turns an edited list into database changes. Form order becomes sort_order.
 * An id that isn't among the parent's current rows is treated as new, so a
 * stale or forged id can't move another parent's row.
 */
export function planChildChanges(
  parent: { column: string; id: string },
  existingIds: readonly string[],
  items: readonly Item[],
  ordered = true,
) {
  const existing = new Set(existingIds);
  const updates: Record<string, unknown>[] = [];
  const inserts: Record<string, unknown>[] = [];
  items.forEach(({ id, ...fields }, index) => {
    const row = {
      ...fields,
      [parent.column]: parent.id,
      ...(ordered && { sort_order: index + 1 }),
    };
    if (id && existing.has(id)) updates.push({ id, ...row });
    else inserts.push(row);
  });
  const kept = new Set(updates.map((row) => row.id));
  const removals = existingIds.filter((id) => !kept.has(id));
  return { updates, inserts, removals };
}

/**
 * Saves one list. supabase-js has no transactions, so removals run first: a
 * failure part-way can drop changes but never leaves duplicate rows.
 */
export async function syncChildren(
  db: Db,
  table: ChildTable,
  parent: { column: string; id: string },
  items: readonly Item[],
) {
  // Each table has its own row type; the plan above already shapes the rows.
  const loose = db as unknown as SupabaseClient;
  const { data, error } = await loose
    .from(table)
    .select("id")
    .eq(parent.column, parent.id);
  if (error) throw error;
  const plan = planChildChanges(
    parent,
    (data as { id: string }[]).map((row) => row.id),
    items,
    !unordered.has(table),
  );
  if (plan.removals.length) {
    const { error: e } = await loose
      .from(table)
      .delete()
      .eq(parent.column, parent.id)
      .in("id", plan.removals);
    if (e) throw e;
  }
  if (plan.updates.length) {
    const { error: e } = await loose.from(table).upsert(plan.updates);
    if (e) throw e;
  }
  if (plan.inserts.length) {
    const { error: e } = await loose.from(table).insert(plan.inserts);
    if (e) throw e;
  }
}
