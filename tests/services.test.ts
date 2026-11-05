import { describe, expect, it } from "vitest";
import { planChildChanges } from "@/lib/children";
import {
  newServiceSchema,
  serviceSchema,
} from "@/app/(admin)/services/service.schema";

const service = "00000000-0000-4000-8000-000000000001";
const a = "00000000-0000-4000-8000-00000000000a";
const b = "00000000-0000-4000-8000-00000000000b";
const foreign = "00000000-0000-4000-8000-00000000000f";

describe("planChildChanges", () => {
  it("updates kept cards, inserts new ones and removes the rest, in form order", () => {
    const plan = planChildChanges(
      { column: "service_id", id: service },
      [a, b],
      [
        { title: "New", description: "First" },
        { id: b, title: "B", description: "Second" },
      ],
    );
    expect(plan.updates).toEqual([
      {
        id: b,
        service_id: service,
        title: "B",
        description: "Second",
        sort_order: 2,
      },
    ]);
    expect(plan.inserts).toEqual([
      {
        service_id: service,
        title: "New",
        description: "First",
        sort_order: 1,
      },
    ]);
    expect(plan.removals).toEqual([a]);
  });

  it("treats an id from another service as a new card", () => {
    const plan = planChildChanges(
      { column: "service_id", id: service },
      [a],
      [{ id: foreign, title: "X", description: "Y" }],
    );
    expect(plan.updates).toEqual([]);
    expect(plan.inserts).toHaveLength(1);
    expect(plan.removals).toEqual([a]);
  });
});

describe("service validation", () => {
  it("accepts only URL-safe slugs", () => {
    const base = { title: "T", card_description: "D" };
    expect(
      newServiceSchema.safeParse({ ...base, slug: "manual-testing" }).success,
    ).toBe(true);
    for (const slug of ["Manual", "a--b", "-a", "a b", "a/b"])
      expect(newServiceSchema.safeParse({ ...base, slug }).success).toBe(false);
  });

  it("explains that slashes aren't part of the slug", () => {
    const result = newServiceSchema.safeParse({
      title: "T",
      card_description: "D",
      slug: "/something",
    });
    expect(result.error?.issues[0]?.message).toBe(
      "Leave out the slashes: the first part of the address is added for you.",
    );
  });

  it("trims text and requires card titles", () => {
    const valid = {
      title: "  Manual Testing  ",
      slug: "manual-testing",
      card_description: "D",
      introduction: "",
      scope_title: "S",
      use_cases_title: "U",
      deliverables_title: "D",
      seo_title: "",
      seo_description: "",
      is_published: true,
      scope: [],
      use_cases: [],
      deliverables: [],
    };
    expect(serviceSchema.parse(valid).title).toBe("Manual Testing");
    expect(
      serviceSchema.safeParse({
        ...valid,
        scope: [{ title: " ", description: "x" }],
      }).success,
    ).toBe(false);
  });
});
