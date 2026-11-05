import "server-only";
import type { requireAdmin } from "@/lib/auth";
import { pagesOf, type TestimonialPage } from "./testimonial.pages";

type Db = Awaited<ReturnType<typeof requireAdmin>>;
type Placement = Parameters<typeof pagesOf>[0];

/** Testimonials on one page, in that page's order (drafts included). */
export async function testimonialsOnPage(db: Db, page: TestimonialPage) {
  let query = db
    .from("testimonials")
    .select(
      "id, name, company, type, quote, is_published, sort_order, home_sort_order, academy_sort_order",
    );
  if (page.key === "home") query = query.eq("show_on_home", true);
  else if (page.key === "academy") query = query.eq("show_on_academy", true);
  else if ("serviceSlug" in page)
    query = query.eq("service_slug", page.serviceSlug);
  else query = query.eq("course_id", page.courseId);
  const { data, error } = await query.order(page.column).order("created_at");
  if (error) throw error;
  return data.map((row) => ({ ...row, position: row[page.column] }));
}

/**
 * Positions that put a testimonial at the end of every page it's newly on.
 * Pages it was already on keep its place.
 */
export async function endPositions(db: Db, now: Placement, before?: Placement) {
  const already = new Set(
    before ? pagesOf(before).map((page) => page.key) : [],
  );
  const positions: Partial<
    Record<"sort_order" | "home_sort_order" | "academy_sort_order", number>
  > = {};
  for (const page of pagesOf(now)) {
    if (already.has(page.key)) continue;
    const rows = await testimonialsOnPage(db, page);
    positions[page.column] =
      Math.max(0, ...rows.map((row) => row.position)) + 1;
  }
  return positions;
}
