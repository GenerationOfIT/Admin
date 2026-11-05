import { z } from "zod";
import { imageUrlSchema, required, slugSchema, text } from "@/lib/schema";
import { isValidTimeZone } from "@/lib/zoned-time";

const day = z.iso.date({ message: "Use a date like 2026-11-20." });
const optionalDay = z.union([z.literal(""), day]);
const clock = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 18:30.");
const optionalClock = z.union([z.literal(""), clock]);
const timeZone = z
  .string()
  .refine(isValidTimeZone, "Choose a time zone from the list.");

// Dollars in the form, cents in the database (events.price). 0 = free.
const dollars = z
  .number({ message: "Enter an amount in dollars, 0 for free." })
  .min(0, "Can't be negative.")
  .max(100000, "At most $100,000.")
  .multipleOf(0.01, "At most two decimals.");

export const newEventSchema = z.object({
  title: required(120),
  slug: slugSchema,
  card_description: required(300),
  start_date: day,
  start_time: clock,
  timezone: timeZone,
});
export type NewEventInput = z.infer<typeof newEventSchema>;

export const basicsSchema = z
  .object({
    title: required(120),
    slug: slugSchema,
    card_description: required(300),
    introduction: text(2000),
    image_url: imageUrlSchema,
    // A photo picked in the form but not uploaded yet (see stagedImages).
    image_url_file: z.unknown().optional(),
    price: dollars,
    is_published: z.boolean(),
  })
  .superRefine((values, context) => {
    // The home page card and the event page both show the photo.
    if (values.is_published && !values.image_url && !values.image_url_file)
      context.addIssue({
        code: "custom",
        path: ["image_url"],
        message: "Add a photo before publishing.",
      });
  });
export type BasicsInput = z.infer<typeof basicsSchema>;

/**
 * Date, place and registration in one form, because the registration rules
 * depend on the event's day and time zone. Mirrors the database checks
 * (events_registration_window_valid, events_published_need_registration,
 * events_timezone_valid, ends_at > starts_at).
 */
export const scheduleSchema = z
  .object({
    start_date: day,
    start_time: clock,
    end_date: optionalDay,
    end_time: optionalClock,
    timezone: timeZone,
    location: required(200),
    street_address: text(200),
    address_locality: text(120),
    address_country: text(120),
    registration_open: z.boolean(),
    registration_opens_on: optionalDay,
    registration_closes_on: optionalDay,
    // Not edited here; tells the rules whether dates are required.
    is_published: z.boolean(),
  })
  .superRefine((values, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: "custom", path: [path], message });
    if (Boolean(values.end_date) !== Boolean(values.end_time))
      issue(
        values.end_date ? "end_time" : "end_date",
        "Give both the end date and time, or neither.",
      );
    else if (
      values.end_date &&
      `${values.end_date}T${values.end_time}` <=
        `${values.start_date}T${values.start_time}`
    )
      issue("end_time", "Must be after the start.");

    const opens = values.registration_opens_on;
    const closes = values.registration_closes_on;
    if (Boolean(opens) !== Boolean(closes))
      issue(
        opens ? "registration_closes_on" : "registration_opens_on",
        "Give both registration dates, or neither.",
      );
    if (opens && closes && closes < opens)
      issue("registration_closes_on", "Must be on or after the opening date.");
    if (closes && closes > values.start_date)
      issue("registration_closes_on", "Can't be after the event's own day.");
    if (values.is_published && !opens)
      for (const key of [
        "registration_opens_on",
        "registration_closes_on",
      ] as const)
        issue(key, "Required while the event is published.");
  });
export type ScheduleInput = z.infer<typeof scheduleSchema>;

/** Matches EventIconName and the icon check on event_highlights. */
export const highlightIcons = [
  { value: "speakers", label: "Speakers" },
  { value: "workshops", label: "Workshops" },
  { value: "attendees", label: "Attendees" },
  { value: "demos", label: "Demos" },
  { value: "careers", label: "Careers" },
  { value: "networking", label: "Networking" },
] as const;

export const highlightsSchema = z.object({
  highlights: z
    .array(
      z.object({
        id: z.uuid().optional(),
        icon: z.enum(highlightIcons.map(({ value }) => value)),
        label: required(80),
      }),
    )
    .max(12),
});
export type HighlightsInput = z.infer<typeof highlightsSchema>;

export const agendaSchema = z.object({
  agenda_title: required(120),
  items: z
    .array(
      z.object({
        id: z.uuid().optional(),
        time: clock,
        title: required(160),
        description: text(500),
      }),
    )
    .max(40),
});
export type AgendaInput = z.infer<typeof agendaSchema>;

export const speakersSchema = z.object({
  speakers: z
    .array(
      z.object({
        id: z.uuid().optional(),
        name: required(120),
        job_title: text(120),
        company: text(120),
        photo_url: imageUrlSchema,
        photo_url_file: z.unknown().optional(),
      }),
    )
    .max(30),
});
export type SpeakersInput = z.infer<typeof speakersSchema>;

export const toCents = (value: number) => Math.round(value * 100);
export const toDollars = (cents: number) => cents / 100;

export type RegistrationStatus =
  "open" | "upcoming" | "paused" | "closed" | "inactive" | "none";

/**
 * Same rules as the site's toRegistration (GenOfIT src/data/events.ts):
 * registration always closes once the event starts, and days count in the
 * event's time zone. "none" is a draft without dates.
 */
export function registrationStatus(
  values: {
    starts_at: string;
    registration_open: boolean;
    registration_opens_on: string;
    registration_closes_on: string;
  },
  today: string,
  now = Date.now(),
): RegistrationStatus {
  const opens = values.registration_opens_on;
  const closes = values.registration_closes_on;
  if (!opens || !closes) return "none";
  if (Date.parse(values.starts_at) <= now || today > closes) return "closed";
  if (!values.registration_open) return today >= opens ? "paused" : "inactive";
  return today < opens ? "upcoming" : "open";
}

/** Shown in the time zone picker; a saved zone not listed here is kept. */
export const commonTimeZones = [
  "Asia/Tbilisi",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Istanbul",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "UTC",
];
