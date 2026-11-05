import { z } from "zod";
import { imageUrlSchema, required, text } from "@/lib/schema";

// Only what the About page shows. The table's bio, linkedin_url and image_alt
// columns aren't used by the site, so they're not edited here.
export const teamMemberSchema = z
  .object({
    name: required(120),
    role: required(160),
    organization: text(160),
    image_url: imageUrlSchema,
    // A photo picked in the form but not uploaded yet (see stagedImages); it
    // counts as having a photo. Never sent to the server.
    image_url_file: z.unknown().optional(),
    is_published: z.boolean(),
  })
  .superRefine((values, context) => {
    // The About page card always renders the photo; without one it breaks.
    if (values.is_published && !values.image_url && !values.image_url_file)
      context.addIssue({
        code: "custom",
        path: ["image_url"],
        message: "Add a photo before publishing.",
      });
  });
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;

export const emptyTeamMember: TeamMemberInput = {
  name: "",
  role: "",
  organization: "",
  image_url: "",
  is_published: false,
};
