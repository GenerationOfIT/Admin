import { describe, expect, it } from "vitest";
import {
  isValidTimeZone,
  zonedParts,
  zonedToIso,
  zonedToday,
} from "@/lib/zoned-time";

describe("venue times", () => {
  it("turns a Tbilisi evening into UTC (UTC+4, no daylight saving)", () => {
    expect(zonedToIso("2026-11-20", "18:30", "Asia/Tbilisi")).toBe(
      "2026-11-20T14:30:00.000Z",
    );
  });

  it("follows daylight saving: New York is UTC-4 in July, UTC-5 in December", () => {
    expect(zonedToIso("2026-07-01", "09:00", "America/New_York")).toBe(
      "2026-07-01T13:00:00.000Z",
    );
    expect(zonedToIso("2026-12-01", "09:00", "America/New_York")).toBe(
      "2026-12-01T14:00:00.000Z",
    );
  });

  it("reads a stored moment back as the venue's date and time", () => {
    expect(zonedParts("2026-11-20T21:30:00Z", "Asia/Tbilisi")).toEqual({
      date: "2026-11-21",
      time: "01:30",
    });
  });

  it("round-trips", () => {
    const iso = zonedToIso("2026-03-29", "10:15", "Europe/London");
    expect(zonedParts(iso, "Europe/London")).toEqual({
      date: "2026-03-29",
      time: "10:15",
    });
  });

  it("gives today's date at the venue", () => {
    // 22:00 UTC is already the next day in Tbilisi.
    expect(zonedToday("Asia/Tbilisi", Date.parse("2026-11-20T22:00:00Z"))).toBe(
      "2026-11-21",
    );
  });

  it("checks time zone names", () => {
    expect(isValidTimeZone("Asia/Tbilisi")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});
