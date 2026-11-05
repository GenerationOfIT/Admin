const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

/**
 * Where the admin can load an image from: uploads are full URLs, older images
 * are paths on the public site. Null when there's nothing to show.
 */
export function imagePreviewUrl(value: string | null | undefined) {
  if (!value) return null;
  if (value.startsWith("http")) return value;
  return siteUrl ? `${siteUrl}${value}` : null;
}
