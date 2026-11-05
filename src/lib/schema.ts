import { z } from "zod";

export const text = (max: number) =>
  z.string().trim().max(max, `At most ${max} characters.`);
export const required = (max: number) => text(max).min(1, "Required.");

// The last part of a page address, e.g. /services/{slug} or /courses/{slug}.
export const slugSchema = required(100)
  // Checked first so this clearer message is the one shown.
  .refine(
    (value) => !value.includes("/"),
    "Leave out the slashes: the first part of the address is added for you.",
  )
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Lowercase letters, numbers and single hyphens, e.g. manual-testing.",
  );

/** Empty optional text is stored as null, so the site's fallbacks apply. */
export const nullIfEmpty = (value: string) => (value === "" ? null : value);

/** A title + description card in an ordered list (CardListEditor). */
export const cardSchema = z.object({
  // Missing on cards added in the form and not saved yet.
  id: z.uuid().optional(),
  title: required(120),
  description: required(1000),
});
export type CardInput = z.infer<typeof cardSchema>;

/**
 * An image the site can show with next/image: a file in its public/images
 * folder, or an upload in the media bucket (allowed in its next.config).
 * Anything else would break the page, so it's rejected.
 */
export const imageUrlSchema = text(500).refine(
  (value) =>
    value === "" || /^\/images\/[\w./-]+$/.test(value) || isMediaUrl(value),
  "Upload an image, or use a path from the site's images folder.",
);

function isMediaUrl(value: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prefix = base && `${base}/storage/v1/object/public/media/`;
  return (
    !!prefix &&
    value.startsWith(prefix) &&
    /^[\w/-]+\.(webp|jpg|jpeg|png)$/.test(value.slice(prefix.length))
  );
}
