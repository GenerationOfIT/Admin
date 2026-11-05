import { describe, expect, it } from "vitest";
import {
  pagesOf,
  parseTestimonialPage,
} from "@/app/(admin)/testimonials/testimonial.pages";

const course = "00000000-0000-4000-8000-000000000001";

describe("testimonial pages", () => {
  it("maps each page to its order column", () => {
    expect(parseTestimonialPage("home")?.column).toBe("home_sort_order");
    expect(parseTestimonialPage("academy")?.column).toBe("academy_sort_order");
    expect(parseTestimonialPage("service:manual-testing")).toEqual({
      key: "service:manual-testing",
      column: "sort_order",
      serviceSlug: "manual-testing",
    });
    expect(parseTestimonialPage(`course:${course}`)?.column).toBe("sort_order");
  });

  it("rejects unknown or malformed pages", () => {
    for (const value of [
      undefined,
      "",
      "homes",
      "service:",
      "service:A B",
      "course:not-a-uuid",
      "events",
    ])
      expect(parseTestimonialPage(value)).toBeNull();
  });

  it("lists the pages a testimonial is placed on", () => {
    expect(
      pagesOf({
        show_on_home: true,
        show_on_academy: false,
        service_slug: null,
        course_id: course,
      }).map((page) => page.key),
    ).toEqual(["home", `course:${course}`]);
  });
});
