import { z } from "zod";

/**
 * New sort_order values (1..n) that put rows in the given id order. Returns
 * only rows whose value changes; renumbering also repairs duplicates. Null
 * when ids aren't exactly the current rows, e.g. one was added or deleted
 * since the list was opened, so a stale order is never saved.
 */
export function orderChanges(
  rows: readonly { id: string; sort_order: number }[],
  ids: readonly string[],
) {
  const current = new Map(rows.map((row) => [row.id, row.sort_order]));
  if (
    ids.length !== rows.length ||
    new Set(ids).size !== ids.length ||
    !ids.every((id) => current.has(id))
  )
    return null;
  return ids
    .map((id, index) => ({ id, sort_order: index + 1 }))
    .filter(({ id, sort_order }) => current.get(id) !== sort_order);
}

/** The ids a list's "Save order" sends, top to bottom. */
export const orderIdsSchema = z.array(z.uuid()).max(500);

export const ORDER_CHANGED =
  "The list changed since you opened it. Reload the page and try again.";
