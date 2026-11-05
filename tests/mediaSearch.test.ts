import { describe, expect, it } from "vitest";
import { matchesSearch } from "@/lib/media-search";

const photo = {
  path: "graduates/nessi-mosiashvili-24262a.jpg",
  usages: [
    {
      label: "Graduate: Name LastName",
      href: "/graduates/1",
      section: "graduates" as const,
    },
  ],
};

describe("Images page search", () => {
  it("matches everything when empty", () => {
    expect(matchesSearch(photo, "  ")).toBe(true);
  });

  it("finds a file by its name, ignoring case", () => {
    expect(matchesSearch(photo, "NESSI")).toBe(true);
  });

  it("finds a file by who uses it, whatever it's called", () => {
    expect(matchesSearch(photo, "name lastname")).toBe(true);
  });

  it("needs every word to match somewhere", () => {
    expect(matchesSearch(photo, "nessi elena")).toBe(false);
  });
});
