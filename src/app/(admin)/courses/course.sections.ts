import { z } from "zod";
import { cardSchema, required, text } from "@/lib/schema";

/**
 * The course page's content tabs and where each is stored. `shownWhen` follows
 * the site's rules in GenOfIT src/app/courses/[slug]/page.tsx.
 */
export const courseSections = {
  overview: {
    label: "Overview",
    heading: "overview_title",
    body: "overview_body",
    tools: false,
    table: "course_overview_items",
    noun: "card",
    shownWhen: "It has a heading or at least one card.",
  },
  curriculum: {
    label: "Curriculum",
    heading: "curriculum_title",
    body: "curriculum_body",
    tools: true,
    table: "course_modules",
    noun: "part",
    shownWhen: "It has at least one part.",
  },
  capstone: {
    label: "Capstone",
    heading: "capstone_title",
    body: "capstone_body",
    tools: false,
    table: "course_capstone_items",
    noun: "card",
    shownWhen: "It has text. Cards alone don't show it.",
  },
  outcomes: {
    label: "Outcomes",
    heading: "outcomes_title",
    body: null,
    tools: false,
    table: "course_outcomes",
    noun: "card",
    shownWhen: "It has at least one card.",
  },
} as const;

export type CourseSectionKey = keyof typeof courseSections;
export const courseSectionKeys = Object.keys(
  courseSections,
) as CourseSectionKey[];

// One shape for every section; fields a section doesn't use stay empty.
export const sectionSchema = z.object({
  heading: text(200),
  body: text(5000),
  tools: z.array(z.object({ value: required(60) })).max(30),
  items: z.array(cardSchema).max(50),
});
export type SectionInput = z.infer<typeof sectionSchema>;

const statLabels = ["Duration", "Lectures", "Hours", "Format"] as const;

/** The only stat labels the site reads (courseStat in GenOfIT). */
export const courseStats = [
  {
    label: statLabels[0],
    placeholder: "3 months",
    hint: "Course page facts and the pricing tab.",
  },
  {
    label: statLabels[1],
    placeholder: "24",
    hint: 'Shown as "24 (48 hours)" with Hours.',
  },
  { label: statLabels[2], placeholder: "48", hint: "Total teaching hours." },
  {
    label: statLabels[3],
    placeholder: "Online via Zoom",
    hint: "Also used in confirmation emails.",
  },
] as const;

export const statsSchema = z.object({
  Duration: text(60),
  Lectures: text(60),
  Hours: text(60),
  Format: text(60),
});
export type StatsInput = z.infer<typeof statsSchema>;

export const seoSchema = z.object({
  seo_title: text(120),
  seo_description: text(320),
});
export type SeoInput = z.infer<typeof seoSchema>;
