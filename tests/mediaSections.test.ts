import { describe, expect, it } from "vitest";
import { folderOf, formatSize, tabsFor } from "@/lib/media-sections";

const use = (section: "team" | "graduates") => ({
  label: "x",
  href: null,
  section,
});

describe("Images page tabs", () => {
  it("reads the upload folder from the path", () => {
    expect(folderOf("graduates/ana-1a2b3c.jpg")).toBe("graduates");
    expect(folderOf("loose.jpg")).toBe("");
  });

  it("keeps a fresh upload in the tab it was dropped in, and in Unused", () => {
    expect(tabsFor({ path: "graduates/new.jpg", usages: [] })).toEqual([
      "graduates",
      "unused",
    ]);
  });

  it("puts files from folders outside the sections in Other, used or not", () => {
    expect(tabsFor({ path: "speakers/old.jpg", usages: [] })).toEqual([
      "unused",
      "other",
    ]);
    expect(tabsFor({ path: "misc/elena.jpg", usages: [use("team")] })).toEqual([
      "team",
      "other",
    ]);
    expect(tabsFor({ path: "loose.jpg", usages: [] })).toEqual([
      "unused",
      "other",
    ]);
  });

  it("shows a shared image in every section that uses it", () => {
    expect(
      tabsFor({
        path: "team/elena.jpg",
        usages: [use("team"), use("graduates"), use("team")],
      }),
    ).toEqual(["team", "graduates"]);
  });

  it("moves a used image out of its upload tab when only others use it", () => {
    expect(
      tabsFor({ path: "team/elena.jpg", usages: [use("graduates")] }),
    ).toEqual(["graduates"]);
  });

  it("formats sizes", () => {
    expect(formatSize(2048)).toBe("2 KB");
    expect(formatSize(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
