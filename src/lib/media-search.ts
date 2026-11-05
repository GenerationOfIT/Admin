import type { LibraryItem } from "@/lib/media-sections";

/**
 * Whether an image matches the Images page search: every word must appear in
 * its file path or in one of its "Used by" labels, ignoring case. So "elena"
 * finds team/elena-3f9a1c.jpg, and "Name LastName" finds that graduate's
 * photo whatever the file is called.
 */
export function matchesSearch(
  item: Pick<LibraryItem, "path" | "usages">,
  query: string,
) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = [item.path, ...item.usages.map((usage) => usage.label)]
    .join(" ")
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}
