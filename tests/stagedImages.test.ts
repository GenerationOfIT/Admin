import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/media-actions", () => ({ discardUploads: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));
import { findStagedImages } from "@/components/forms/stagedImages";

const file = new File(["x"], "alex.png", { type: "image/png" });

describe("findStagedImages", () => {
  it("finds staged files next to their URL fields, including inside lists", () => {
    const state = {
      avatar_url: "",
      avatar_url_file: { file, folder: "testimonials" },
      lecturers: [
        { name: "A", image_url: "", image_url_file: null },
        {
          name: "B",
          image_url: "",
          image_url_file: { file, folder: "lecturers" },
        },
      ],
    };
    expect(findStagedImages(state)).toEqual([
      { path: "avatar_url", image: { file, folder: "testimonials" } },
      { path: "lecturers.1.image_url", image: { file, folder: "lecturers" } },
    ]);
  });

  it("ignores cleared staging slots", () => {
    expect(findStagedImages({ avatar_url_file: null, name: "x" })).toEqual([]);
  });
});

describe("uploadStagedImages", () => {
  it("returns values without staging slots when nothing is staged", async () => {
    const { uploadStagedImages } =
      await import("@/components/forms/stagedImages");
    const result = await uploadStagedImages([], {
      name: "A",
      image_url: "/images/a.png",
      image_url_file: null,
      lecturers: [{ image_url: "", image_url_file: null }],
    });
    expect(result).toEqual({
      values: {
        name: "A",
        image_url: "/images/a.png",
        lecturers: [{ image_url: "" }],
      },
      uploaded: [],
    });
  });
});
