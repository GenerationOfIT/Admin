import { z } from "zod";

/**
 * The site pages that show testimonials, and the column each one sorts by.
 * Home and academy have their own columns; a testimonial's own service or
 * course page uses sort_order, since it belongs to at most one of them.
 * Must match getTestimonials in the GenOfIT site (src/data/marketing.ts).
 */
export type TestimonialPage =
  | { key: "home"; column: "home_sort_order" }
  | { key: "academy"; column: "academy_sort_order" }
  | { key: `service:${string}`; column: "sort_order"; serviceSlug: string }
  | { key: `course:${string}`; column: "sort_order"; courseId: string };

/** Reads a page key from the URL or a form, e.g. "service:manual-testing". */
export function parseTestimonialPage(
  value: string | undefined,
): TestimonialPage | null {
  if (value === "home") return { key: "home", column: "home_sort_order" };
  if (value === "academy")
    return { key: "academy", column: "academy_sort_order" };
  const separator = (value ?? "").indexOf(":");
  const kind = value?.slice(0, separator);
  const id = value?.slice(separator + 1) ?? "";
  if (kind === "service" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    return { key: `service:${id}`, column: "sort_order", serviceSlug: id };
  if (kind === "course" && z.uuid().safeParse(id).success)
    return { key: `course:${id}`, column: "sort_order", courseId: id };
  return null;
}

type Placement = {
  show_on_home: boolean;
  show_on_academy: boolean;
  service_slug: string | null;
  course_id: string | null;
};

/** The pages a testimonial appears on (whether or not it's published). */
export function pagesOf(row: Placement): TestimonialPage[] {
  return [
    row.show_on_home && parseTestimonialPage("home"),
    row.show_on_academy && parseTestimonialPage("academy"),
    row.service_slug && parseTestimonialPage(`service:${row.service_slug}`),
    row.course_id && parseTestimonialPage(`course:${row.course_id}`),
  ].filter((page): page is TestimonialPage => !!page);
}
