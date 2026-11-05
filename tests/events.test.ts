import { describe, expect, it } from "vitest";
import {
  basicsSchema,
  registrationStatus,
  scheduleSchema,
} from "@/app/(admin)/events/event.schema";

const schedule = {
  start_date: "2026-11-20",
  start_time: "18:00",
  end_date: "",
  end_time: "",
  timezone: "Asia/Tbilisi",
  location: "Tbilisi, Tech Park",
  street_address: "",
  address_locality: "",
  address_country: "",
  registration_open: true,
  registration_opens_on: "2026-11-01",
  registration_closes_on: "2026-11-20",
  is_published: true,
};
const pathsOf = (input: unknown) =>
  scheduleSchema.safeParse(input).error?.issues.map((i) => i.path[0]) ?? [];

describe("event schedule rules", () => {
  it("accepts a valid schedule", () => {
    expect(pathsOf(schedule)).toEqual([]);
  });
  it("needs the end after the start, and both end fields or neither", () => {
    expect(
      pathsOf({ ...schedule, end_date: "2026-11-20", end_time: "17:00" }),
    ).toEqual(["end_time"]);
    expect(pathsOf({ ...schedule, end_date: "2026-11-20" })).toEqual([
      "end_time",
    ]);
  });
  it("keeps registration inside the event's day", () => {
    expect(
      pathsOf({ ...schedule, registration_closes_on: "2026-11-21" }),
    ).toEqual(["registration_closes_on"]);
    expect(
      pathsOf({ ...schedule, registration_closes_on: "2026-10-31" }),
    ).toEqual(["registration_closes_on"]);
  });
  it("needs registration dates while published", () => {
    const noDates = {
      ...schedule,
      registration_opens_on: "",
      registration_closes_on: "",
    };
    expect(pathsOf(noDates)).toEqual([
      "registration_opens_on",
      "registration_closes_on",
    ]);
    expect(pathsOf({ ...noDates, is_published: false })).toEqual([]);
  });
  it("rejects unknown time zones", () => {
    expect(pathsOf({ ...schedule, timezone: "Mars/Olympus" })).toEqual([
      "timezone",
    ]);
  });
});

describe("event basics", () => {
  it("needs a photo to publish and allows free events", () => {
    const base = {
      title: "QA Meetup",
      slug: "qa-meetup",
      card_description: "Talks and networking.",
      introduction: "",
      image_url: "",
      price: 0,
      is_published: true,
    };
    expect(basicsSchema.safeParse(base).error?.issues[0]?.path).toEqual([
      "image_url",
    ]);
    expect(
      basicsSchema.safeParse({ ...base, image_url: "/images/e.png" }).success,
    ).toBe(true);
  });
});

describe("registration status, like the site", () => {
  const values = {
    starts_at: "2026-11-20T14:00:00Z",
    registration_open: true,
    registration_opens_on: "2026-11-01",
    registration_closes_on: "2026-11-20",
  };
  const before = Date.parse("2026-10-01T00:00:00Z");
  it("goes upcoming, open, closed", () => {
    expect(registrationStatus(values, "2026-10-01", before)).toBe("upcoming");
    expect(registrationStatus(values, "2026-11-05", before)).toBe("open");
    expect(registrationStatus(values, "2026-11-21", before)).toBe("closed");
  });
  it("closes once the event starts, whatever the dates say", () => {
    expect(
      registrationStatus(values, "2026-11-20", Date.parse(values.starts_at)),
    ).toBe("closed");
  });
  it("is paused when switched off inside the dates, none without dates", () => {
    const off = { ...values, registration_open: false };
    expect(registrationStatus(off, "2026-11-05", before)).toBe("paused");
    expect(registrationStatus(off, "2026-10-01", before)).toBe("inactive");
    expect(
      registrationStatus(
        { ...values, registration_opens_on: "", registration_closes_on: "" },
        "2026-11-05",
        before,
      ),
    ).toBe("none");
  });
});
