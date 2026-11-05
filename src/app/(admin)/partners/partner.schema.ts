import { z } from "zod";
import { imageUrlSchema, required } from "@/lib/schema";

export const partnerSchema = z
  .object({
    name: required(120),
    logo_url: imageUrlSchema,
    // A logo picked in the form but not uploaded yet (see stagedImages); it
    // counts as having a logo. Never sent to the server.
    logo_url_file: z.unknown().optional(),
    is_published: z.boolean(),
  })
  .superRefine((values, context) => {
    // The home page strip shows only logos (database check
    // partners_published_have_logo).
    if (values.is_published && !values.logo_url && !values.logo_url_file)
      context.addIssue({
        code: "custom",
        path: ["logo_url"],
        message: "Add a logo before publishing.",
      });
  });
export type PartnerInput = z.infer<typeof partnerSchema>;

export const emptyPartner: PartnerInput = {
  name: "",
  logo_url: "",
  is_published: false,
};
