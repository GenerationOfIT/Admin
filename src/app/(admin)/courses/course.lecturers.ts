import { z } from "zod";
import { fileStem } from "@/lib/images";
import { imageUrlSchema, required, text } from "@/lib/schema";

export const lecturerSchema = z.object({
  // Missing on lecturers added in the form and not saved yet.
  id: z.uuid().optional(),
  name: required(120),
  role: required(160),
  // Optional; same rule as the database check on course_lecturers.linkedin_url.
  linkedin_url: text(300).refine(
    (value) => !value || /^https:\/\/(www\.)?linkedin\.com(\/|$)/.test(value),
    "Use a LinkedIn address, e.g. https://www.linkedin.com/in/name.",
  ),
  image_url: imageUrlSchema,
  image_alt: text(200),
  is_published: z.boolean(),
});
export type LecturerInput = z.infer<typeof lecturerSchema>;

export const lecturersSchema = z.object({
  lecturers: z.array(lecturerSchema).max(30),
});
export type LecturersInput = z.infer<typeof lecturersSchema>;

export const emptyLecturer: LecturerInput = {
  name: "",
  role: "",
  linkedin_url: "",
  image_url: "",
  image_alt: "",
  is_published: true,
};

/**
 * course_lecturers.slug is required and unique per course, but the site never
 * shows it. Saved lecturers keep theirs, even when renamed, so swapping two
 * names can't collide. New ones get one from the name: "Nino Beridze" →
 * "nino-beridze", or "nino-beridze-2" if that's taken.
 */
export function lecturerSlugs(
  lecturers: readonly { id?: string; name: string }[],
  existing: ReadonlyMap<string, string>,
) {
  const taken = new Set(
    lecturers.flatMap(({ id }) => {
      const slug = id && existing.get(id);
      return slug ? [slug] : [];
    }),
  );
  return lecturers.map(({ id, name }) => {
    const kept = id && existing.get(id);
    if (kept) return kept;
    const stem = fileStem(name);
    const base = stem === "image" ? "lecturer" : stem;
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    taken.add(slug);
    return slug;
  });
}
