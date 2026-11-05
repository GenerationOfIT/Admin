import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "media";
export const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];

// The bucket's own limit (migration 20261028130000_media_bucket_limits);
// checked here first so the admin sees a clear message.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Files are uploaded exactly as chosen: no resizing or re-encoding. The site's
 * next/image makes the sized copies visitors download.
 */
export function checkImage(file: File) {
  if (!acceptedImageTypes.includes(file.type))
    throw new Error("Use a JPEG, PNG or WebP image.");
  if (file.size > MAX_UPLOAD_BYTES)
    throw new Error("The image is over 5 MB. Use a smaller file.");
  return file;
}

/**
 * The original file name made safe for a URL: "Alex Rivera (1).JPG" becomes
 * "alex-rivera-1". The extension is dropped; the upload adds the one for
 * its actual format.
 */
export function fileStem(fileName: string) {
  const stem = fileName
    .replace(/\.[^.]*$/, "")
    .normalize("NFKD")
    // NFKD splits "é" into "e" plus a combining accent; drop the accents.
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/, "");
  return stem || "image";
}

/**
 * Keeps the original name, plus a short random suffix so two "photo.jpg"
 * uploads never overwrite each other and a replaced image never serves a
 * stale cached copy. Returns the public URL.
 */
export async function uploadImage(
  supabase: SupabaseClient,
  folder: string,
  image: Blob,
  originalName: string,
) {
  const extension = extensions[image.type] ?? "jpg";
  const suffix = crypto.randomUUID().slice(0, 6);
  const path = `${folder}/${fileStem(originalName)}-${suffix}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, image, {
    contentType: image.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
