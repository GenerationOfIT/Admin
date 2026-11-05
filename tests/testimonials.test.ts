import { describe, expect, it } from "vitest";
import { orderChanges } from "@/lib/order";
import {
  emptyTestimonial,
  placementFor,
  roleLine,
  testimonialSchema,
} from "@/app/(admin)/testimonials/testimonial.schema";

const course = "00000000-0000-4000-8000-000000000001";
const base = { ...emptyTestimonial, name: "Alex", quote: "Great." };

describe("testimonial rules", () => {
  it("requires a placement before publishing", () => {
    const result = testimonialSchema.safeParse({ ...base, is_published: true });
    expect(result.error?.issues[0]?.path).toEqual(["is_published"]);
    expect(
      testimonialSchema.safeParse({
        ...base,
        is_published: true,
        show_on_home: true,
      }).success,
    ).toBe(true);
  });

  it("keeps only the placements that fit the type", () => {
    const leftovers = {
      ...base,
      show_on_academy: true,
      service_slug: "manual-testing",
      course_id: course,
    };
    expect(placementFor({ ...leftovers, type: "client" })).toEqual({
      show_on_home: false,
      show_on_academy: false,
      service_slug: "manual-testing",
      course_id: null,
    });
    expect(placementFor({ ...leftovers, type: "graduate" })).toEqual({
      show_on_home: false,
      show_on_academy: true,
      service_slug: null,
      course_id: course,
    });
  });

  it("doesn't count a placement the type can't use", () => {
    // A client with only the academy box ticked shows nowhere.
    const result = testimonialSchema.safeParse({
      ...base,
      is_published: true,
      show_on_academy: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts only image paths from the site", () => {
    for (const avatar_url of ["", "/images/figma/5f3ec.png"])
      expect(testimonialSchema.safeParse({ ...base, avatar_url }).success).toBe(
        true,
      );
    for (const avatar_url of ["https://example.com/a.png", "images/a.png"])
      expect(testimonialSchema.safeParse({ ...base, avatar_url }).success).toBe(
        false,
      );
  });

  it("builds the card's role line like the site", () => {
    expect(
      roleLine({
        job_title: "CTO",
        company: "CloudStack",
        context_label: "QA",
      }),
    ).toBe("CTO at CloudStack · QA");
    expect(roleLine({ job_title: "", company: "", context_label: "QA" })).toBe(
      "QA",
    );
  });
});

describe("orderChanges", () => {
  const rows = [
    { id: "a", sort_order: 1 },
    { id: "b", sort_order: 2 },
    { id: "c", sort_order: 2 },
  ];
  it("renumbers to the new order and repairs duplicate positions", () => {
    expect(orderChanges(rows, ["c", "a", "b"])).toEqual([
      { id: "c", sort_order: 1 },
      { id: "a", sort_order: 2 },
      { id: "b", sort_order: 3 },
    ]);
  });
  it("returns only the rows that change", () => {
    expect(orderChanges(rows, ["a", "b", "c"])).toEqual([
      { id: "c", sort_order: 3 },
    ]);
  });
  it("refuses an order that doesn't match the current rows", () => {
    expect(orderChanges(rows, ["a", "b"])).toBeNull();
    expect(orderChanges(rows, ["a", "b", "x"])).toBeNull();
    expect(orderChanges(rows, ["a", "a", "b"])).toBeNull();
  });
});
