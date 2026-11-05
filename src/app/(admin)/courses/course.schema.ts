import { z } from "zod";
import { required, slugSchema, text } from "@/lib/schema";

export const newCourseSchema = z.object({
  title: required(120),
  slug: slugSchema,
  card_description: required(300),
});
export type NewCourseInput = z.infer<typeof newCourseSchema>;

export const basicsSchema = newCourseSchema.extend({
  introduction: text(2000),
  summary: text(500),
  audience_summary: text(500),
  benefits: text(500),
  is_published: z.boolean(),
  is_popular: z.boolean(),
  is_curriculum_course: z.boolean(),
});
export type BasicsInput = z.infer<typeof basicsSchema>;

const day = z.union([
  z.literal(""),
  z.iso.date({ message: "Use a date like 2026-11-01." }),
]);
// Dollars in the form, cents in the database (course_plans.amount).
const dollars = z
  .number({ message: "Enter an amount in dollars." })
  .positive("Must be more than $0.")
  .max(100000, "At most $100,000.")
  .multipleOf(0.01, "At most two decimals.");

export const pricingSchema = z
  .object({
    starts_on: day,
    enrollment_open: z.boolean(),
    enrollment_opens_on: day,
    enrollment_closes_on: day,
    amount: dollars,
    manual_payments_enabled: z.boolean(),
    minimum_payment: dollars,
    plan_title: required(120),
    plan_description: text(300),
    features: z.array(z.object({ value: required(200) })).max(20),
  })
  .superRefine((values, context) => {
    if (
      values.enrollment_opens_on &&
      values.enrollment_closes_on &&
      values.enrollment_closes_on < values.enrollment_opens_on
    )
      context.addIssue({
        code: "custom",
        path: ["enrollment_closes_on"],
        message: "Must be on or after the opening date.",
      });
    // Checkout refuses without both dates, so switching it on alone does nothing.
    if (values.enrollment_open)
      for (const key of [
        "enrollment_opens_on",
        "enrollment_closes_on",
      ] as const)
        if (!values[key])
          context.addIssue({
            code: "custom",
            path: [key],
            message: "Required while enrollment is on.",
          });
    if (
      values.manual_payments_enabled &&
      values.minimum_payment > values.amount
    )
      context.addIssue({
        code: "custom",
        path: ["minimum_payment"],
        message: "Can't be more than the tuition.",
      });
  });
export type PricingInput = z.infer<typeof pricingSchema>;

export const toCents = (dollarsValue: number) => Math.round(dollarsValue * 100);
export const toDollars = (cents: number) => cents / 100;

export type EnrollmentStatus =
  "open" | "upcoming" | "paused" | "closed" | "inactive";

/** Same rules as the site's toEnrollment (GenOfIT src/data/courses.ts). */
export function enrollmentStatus(
  values: {
    enrollment_open: boolean;
    enrollment_opens_on: string;
    enrollment_closes_on: string;
  },
  today: string,
): EnrollmentStatus {
  const opens = values.enrollment_opens_on;
  const closes = values.enrollment_closes_on;
  // ISO dates compare correctly as strings.
  const inWindow = !!opens && !!closes && opens <= today && today <= closes;
  if (!values.enrollment_open) return inWindow ? "paused" : "inactive";
  if (!opens || !closes) return "inactive";
  if (today < opens) return "upcoming";
  if (today > closes) return "closed";
  return "open";
}

/** Enrollment days are Tbilisi calendar days, like the site and checkout. */
export function tbilisiToday(now = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tbilisi" }).format(
    now,
  );
}
