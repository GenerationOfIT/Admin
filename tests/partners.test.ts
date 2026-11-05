import { describe, expect, it } from "vitest";
import {
  emptyPartner,
  partnerSchema,
} from "@/app/(admin)/partners/partner.schema";

const base = { ...emptyPartner, name: "Octarinox" };
const file = new File(["x"], "octarinox.png", { type: "image/png" });

describe("partner rules", () => {
  it("lets drafts go without a logo", () => {
    expect(partnerSchema.safeParse(base).success).toBe(true);
  });

  it("needs a logo to publish, saved or just picked", () => {
    const published = { ...base, is_published: true };
    expect(partnerSchema.safeParse(published).error?.issues[0]?.path).toEqual([
      "logo_url",
    ]);
    expect(
      partnerSchema.safeParse({ ...published, logo_url_file: file }).success,
    ).toBe(true);
    expect(
      partnerSchema.safeParse({ ...published, logo_url: "/images/logo.png" })
        .success,
    ).toBe(true);
  });

  it("requires a name", () => {
    expect(partnerSchema.safeParse({ ...base, name: "  " }).success).toBe(
      false,
    );
  });
});
