import { describe, expect, it } from "vitest";
import {
  emptyTeamMember,
  teamMemberSchema,
} from "@/app/(admin)/team/team.schema";

const base = { ...emptyTeamMember, name: "Elena", role: "VP" };
const file = new File(["x"], "elena.png", { type: "image/png" });

describe("team member rules", () => {
  it("lets drafts go without a photo", () => {
    expect(teamMemberSchema.safeParse(base).success).toBe(true);
  });

  it("needs a photo to publish, saved or just picked", () => {
    const published = { ...base, is_published: true };
    expect(
      teamMemberSchema.safeParse(published).error?.issues[0]?.path,
    ).toEqual(["image_url"]);
    expect(
      teamMemberSchema.safeParse({
        ...published,
        image_url: "/images/figma/about-us/elena-rostova.png",
      }).success,
    ).toBe(true);
    expect(
      teamMemberSchema.safeParse({
        ...published,
        image_url_file: { file, folder: "team" },
      }).success,
    ).toBe(true);
  });
});
