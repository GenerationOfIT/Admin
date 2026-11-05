import { afterEach, describe, expect, it, vi } from "vitest";
import { checkImage, fileStem } from "@/lib/images";
import { mediaPath } from "@/lib/media";
import { imageUrlSchema } from "@/lib/schema";

const base = "https://abc.supabase.co";
afterEach(() => vi.unstubAllEnvs());

describe("image URLs", () => {
  it("accepts site image paths and media bucket uploads", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", base);
    for (const value of [
      "",
      "/images/figma/5f3ec.png",
      `${base}/storage/v1/object/public/media/testimonials/0b3c-4d.webp`,
    ])
      expect(imageUrlSchema.safeParse(value).success, value).toBe(true);
  });

  it("rejects other hosts, other buckets and odd paths", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", base);
    for (const value of [
      "https://example.com/a.png",
      `${base}/storage/v1/object/public/other/a.webp`,
      `${base}/storage/v1/object/public/media/../secret.webp`,
      `${base}/storage/v1/object/public/media/a.svg`,
      "images/a.png",
    ])
      expect(imageUrlSchema.safeParse(value).success, value).toBe(false);
  });
});

describe("fileStem", () => {
  it("keeps the original name in a URL-safe form", () => {
    expect(fileStem("Alex Rivera (1).JPG")).toBe("alex-rivera-1");
    expect(fileStem("Café_Team photo.final.png")).toBe("cafe-team-photo-final");
    expect(fileStem("ნინო.jpg")).toBe("image");
    expect(fileStem(".png")).toBe("image");
    expect(fileStem(`${"a".repeat(60)}.jpg`)).toHaveLength(50);
  });
});

describe("checkImage", () => {
  const file = (type: string, bytes: number) =>
    new File([new Uint8Array(bytes)], "x", { type });
  it("passes JPEG, PNG and WebP through unchanged", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      const original = file(type, 10);
      expect(checkImage(original)).toBe(original);
    }
  });
  it("rejects other types and files over 5 MB", () => {
    expect(() => checkImage(file("image/gif", 10))).toThrow(
      "JPEG, PNG or WebP",
    );
    expect(() => checkImage(file("image/png", 5 * 1024 * 1024 + 1))).toThrow(
      "over 5 MB",
    );
  });
});

describe("mediaPath", () => {
  it("returns the bucket path only for media bucket uploads", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", base);
    const prefix = `${base}/storage/v1/object/public/media/`;
    expect(mediaPath(`${prefix}testimonials/alex-1a2b3c.png`)).toBe(
      "testimonials/alex-1a2b3c.png",
    );
    for (const url of [
      null,
      "",
      "/images/figma/5f3ec.png",
      `${base}/storage/v1/object/public/other/a.png`,
      `${prefix}../secret.png`,
    ])
      expect(mediaPath(url)).toBeNull();
  });
});
