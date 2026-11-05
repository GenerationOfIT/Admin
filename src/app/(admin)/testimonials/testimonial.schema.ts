import { z } from "zod";
import { imageUrlSchema, required, text } from "@/lib/schema";

export const testimonialTypes = ["client", "graduate"] as const;
export type TestimonialType = (typeof testimonialTypes)[number];

const fields = z.object({
  type: z.enum(testimonialTypes),
  name: required(120),
  job_title: text(120),
  company: text(120),
  context_label: text(120),
  quote: required(2000),
  avatar_url: imageUrlSchema,
  show_on_home: z.boolean(),
  show_on_academy: z.boolean(),
  // "" means not linked.
  service_slug: z.string(),
  course_id: z.union([z.literal(""), z.uuid()]),
  is_published: z.boolean(),
});

/**
 * The columns that apply to the chosen type. Placements of the other type are
 * dropped rather than rejected, so switching type in the form just works.
 * Mirrors testimonials_course_is_graduate, _service_is_client and
 * _academy_is_graduate in the database.
 */
export function placementFor(values: z.infer<typeof fields>) {
  const graduate = values.type === "graduate";
  return {
    show_on_home: values.show_on_home,
    show_on_academy: graduate && values.show_on_academy,
    service_slug: graduate ? null : values.service_slug || null,
    course_id: graduate ? values.course_id || null : null,
  };
}

export const testimonialSchema = fields.superRefine((values, context) => {
  const placement = placementFor(values);
  // testimonials_published_have_placement: a published quote must show somewhere.
  if (
    values.is_published &&
    !placement.show_on_home &&
    !placement.show_on_academy &&
    !placement.service_slug &&
    !placement.course_id
  )
    context.addIssue({
      code: "custom",
      path: ["is_published"],
      message: "Choose at least one place to show it, or leave it unpublished.",
    });
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export const emptyTestimonial: TestimonialInput = {
  type: "client",
  name: "",
  job_title: "",
  company: "",
  context_label: "",
  quote: "",
  avatar_url: "",
  show_on_home: false,
  show_on_academy: false,
  service_slug: "",
  course_id: "",
  is_published: false,
};

/** The card's second line on the site: "CTO at CloudStack · Context". */
export function roleLine(values: {
  job_title: string;
  company: string;
  context_label: string;
}) {
  return [
    [values.job_title, values.company].filter(Boolean).join(" at "),
    values.context_label,
  ]
    .filter(Boolean)
    .join(" · ");
}
