import { describe, expect, it } from "vitest";
import {
  enrollmentStatus,
  pricingSchema,
  toCents,
  toDollars,
  type PricingInput,
} from "@/app/(admin)/courses/course.schema";
import {
  courseSections,
  sectionSchema,
} from "@/app/(admin)/courses/course.sections";
import {
  emptyLecturer,
  lecturerSchema,
  lecturerSlugs,
} from "@/app/(admin)/courses/course.lecturers";

const window = {
  enrollment_opens_on: "2026-11-01",
  enrollment_closes_on: "2026-11-30",
};

describe("enrollmentStatus (same rules as the site)", () => {
  it.each([
    ["2026-10-31", true, "upcoming"],
    ["2026-11-01", true, "open"],
    ["2026-11-30", true, "open"],
    ["2026-12-01", true, "closed"],
    ["2026-11-15", false, "paused"],
    ["2026-12-01", false, "inactive"],
  ] as const)("%s, switched on: %s → %s", (today, open, expected) => {
    expect(enrollmentStatus({ ...window, enrollment_open: open }, today)).toBe(
      expected,
    );
  });

  it("is inactive without both dates, even when switched on", () => {
    expect(
      enrollmentStatus(
        {
          enrollment_open: true,
          enrollment_opens_on: "2026-11-01",
          enrollment_closes_on: "",
        },
        "2026-11-15",
      ),
    ).toBe("inactive");
  });
});

const valid: PricingInput = {
  starts_on: "",
  enrollment_open: true,
  ...window,
  amount: 900,
  manual_payments_enabled: true,
  minimum_payment: 100,
  plan_title: "Full Payment",
  plan_description: "",
  features: [{ value: "Certificate" }],
};
const issuePaths = (input: PricingInput) =>
  pricingSchema.safeParse(input).error?.issues.map((issue) => issue.path[0]) ??
  [];

describe("pricing rules", () => {
  it("accepts a normal price and window", () => {
    expect(issuePaths(valid)).toEqual([]);
  });
  it("rejects a closing date before the opening date", () => {
    expect(
      issuePaths({ ...valid, enrollment_closes_on: "2026-10-01" }),
    ).toEqual(["enrollment_closes_on"]);
  });
  it("needs both dates while enrollment is on", () => {
    expect(
      issuePaths({
        ...valid,
        enrollment_opens_on: "",
        enrollment_closes_on: "",
      }),
    ).toEqual(["enrollment_opens_on", "enrollment_closes_on"]);
    expect(
      issuePaths({
        ...valid,
        enrollment_open: false,
        enrollment_opens_on: "",
        enrollment_closes_on: "",
      }),
    ).toEqual([]);
  });
  it("keeps the minimum payment within the tuition", () => {
    expect(issuePaths({ ...valid, minimum_payment: 1000 })).toEqual([
      "minimum_payment",
    ]);
    expect(
      issuePaths({
        ...valid,
        manual_payments_enabled: false,
        minimum_payment: 1000,
      }),
    ).toEqual([]);
  });
  it("rejects zero, empty and sub-cent amounts", () => {
    expect(issuePaths({ ...valid, amount: 0 })).toContain("amount");
    expect(issuePaths({ ...valid, amount: Number.NaN })).toContain("amount");
    expect(issuePaths({ ...valid, amount: 9.999 })).toContain("amount");
  });
});

describe("dollars and cents", () => {
  it("converts without floating-point drift", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(900)).toBe(90000);
    expect(toDollars(1999)).toBe(19.99);
  });
});

describe("course content sections", () => {
  it("use the site's columns and tables", () => {
    expect(courseSections.curriculum).toMatchObject({
      heading: "curriculum_title",
      body: "curriculum_body",
      tools: true,
      table: "course_modules",
    });
    expect(courseSections.capstone.heading).toBe("capstone_title");
    expect(courseSections.outcomes.body).toBeNull();
  });

  it("rejects empty cards and empty tools", () => {
    const base = { heading: "", body: "", tools: [], items: [] };
    expect(sectionSchema.safeParse(base).success).toBe(true);
    expect(
      sectionSchema.safeParse({
        ...base,
        items: [{ title: "", description: "x" }],
      }).success,
    ).toBe(false);
    expect(
      sectionSchema.safeParse({ ...base, tools: [{ value: " " }] }).success,
    ).toBe(false);
  });
});

describe("lecturers", () => {
  const a = "00000000-0000-4000-8000-00000000000a";
  const b = "00000000-0000-4000-8000-00000000000b";

  it("gives new lecturers unique slugs from their names", () => {
    expect(
      lecturerSlugs(
        [
          { name: "Nino Beridze" },
          { name: "Nino Beridze" },
          { name: "ნინო" },
          { id: a, name: "Renamed" },
        ],
        new Map([[a, "nino-beridze"]]),
      ),
    ).toEqual(["nino-beridze-2", "nino-beridze-3", "lecturer", "nino-beridze"]);
  });

  it("keeps saved slugs, so swapping two names can't collide", () => {
    const existing = new Map([
      [a, "ana"],
      [b, "nino"],
    ]);
    expect(
      lecturerSlugs(
        [
          { id: a, name: "Nino" },
          { id: b, name: "Ana" },
        ],
        existing,
      ),
    ).toEqual(["ana", "nino"]);
  });

  it("accepts no LinkedIn or only LinkedIn profile links", () => {
    const base = { ...emptyLecturer, name: "A", role: "B" };
    for (const linkedin_url of [
      "",
      "https://www.linkedin.com/in/name",
      "https://linkedin.com/in/name",
    ])
      expect(lecturerSchema.safeParse({ ...base, linkedin_url }).success).toBe(
        true,
      );
    for (const linkedin_url of [
      "http://linkedin.com/in/name",
      "https://linkedin.com.evil.example/in/name",
      "www.linkedin.com/in/name",
    ])
      expect(lecturerSchema.safeParse({ ...base, linkedin_url }).success).toBe(
        false,
      );
  });
});
