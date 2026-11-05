import { describe, expect, it } from "vitest";
import {
  emptyGraduate,
  graduateSchema,
} from "@/app/(admin)/graduates/graduate.schema";

const base = { ...emptyGraduate, name: "Name LastName", title: "API Testing" };
const file = new File(["x"], "graduate.png", { type: "image/png" });

describe("graduate rules", () => {
  it("lets drafts go without a photo", () => {
    expect(graduateSchema.safeParse(base).success).toBe(true);
  });

  it("needs a photo to publish, saved or just picked", () => {
    const published = { ...base, is_published: true };
    expect(graduateSchema.safeParse(published).error?.issues[0]?.path).toEqual([
      "image_url",
    ]);
    expect(
      graduateSchema.safeParse({ ...published, image_url_file: file }).success,
    ).toBe(true);
    expect(
      graduateSchema.safeParse({
        ...published,
        image_url: "/images/graduate.png",
      }).success,
    ).toBe(true);
  });

  it("requires a name", () => {
    expect(graduateSchema.safeParse({ ...base, name: "  " }).success).toBe(
      false,
    );
  });
});

describe("graduate title line", () => {
  it("is required", () => {
    expect(
      graduateSchema.safeParse({ ...emptyGraduate, name: "A", title: "" })
        .success,
    ).toBe(false);
  });
});
