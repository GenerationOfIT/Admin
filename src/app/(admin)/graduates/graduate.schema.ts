import { z } from "zod";
import { imageUrlSchema, required } from "@/lib/schema";

export const graduateSchema = z
  .object({
    name: required(120),
    title: required(120),
    image_url: imageUrlSchema,
    // A photo picked in the form but not uploaded yet (see stagedImages); it
    // counts as having a photo. Never sent to the server.
    image_url_file: z.unknown().optional(),
    is_published: z.boolean(),
  })
  .superRefine((values, context) => {
    // Every carousel card is a photo (database check
    // graduates_published_have_photo).
    if (values.is_published && !values.image_url && !values.image_url_file)
      context.addIssue({
        code: "custom",
        path: ["image_url"],
        message: "Add a photo before publishing.",
      });
  });
export type GraduateInput = z.infer<typeof graduateSchema>;

export const emptyGraduate: GraduateInput = {
  name: "",
  title: "",
  image_url: "",
  is_published: false,
};
