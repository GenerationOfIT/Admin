"use client";

import { uploadImage } from "@/lib/images";
import { discardUploads } from "@/lib/media-actions";
import { createClient } from "@/lib/supabase/client";

/**
 * A picked image waits in the form next to its URL field, under this key
 * ("avatar_url" → "avatar_url_file"). Living inside the form values, it moves
 * with its row when a list is reordered, and it makes the form dirty.
 */
export const stagedKey = (name: string) => `${name}_file`;
const SUFFIX = "_file";

export type StagedImage = { file: File; folder: string };

function isStaged(value: unknown): value is StagedImage {
  return (
    !!value &&
    typeof value === "object" &&
    (value as StagedImage).file instanceof File
  );
}

/** Every staged image in the form state, with its URL field's path. */
export function findStagedImages(
  values: unknown,
  path = "",
): { path: string; image: StagedImage }[] {
  if (!values || typeof values !== "object" || values instanceof File)
    return [];
  return Object.entries(values).flatMap(([key, value]) => {
    const here = path ? `${path}.${key}` : key;
    if (key.endsWith(SUFFIX))
      return isStaged(value)
        ? [{ path: here.slice(0, -SUFFIX.length), image: value }]
        : [];
    return findStagedImages(value, here);
  });
}

function setPath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
) {
  const keys = path.split(".");
  let node = target;
  for (const key of keys.slice(0, -1))
    node = node[key] as Record<string, unknown>;
  node[keys.at(-1)!] = value;
}

/** Drops staging slots, so files are never sent along with a save. */
function withoutStaged(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutStaged);
  if (!value || typeof value !== "object" || value instanceof File)
    return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !key.endsWith(SUFFIX))
      .map(([key, item]) => [key, withoutStaged(item)]),
  );
}

/**
 * Uploads the staged images and writes their URLs into a copy of `values`,
 * without any staging slots. If one upload fails, the ones already done are
 * removed again.
 */
export async function uploadStagedImages<T extends object>(
  staged: { path: string; image: StagedImage }[],
  values: T,
) {
  const copy = withoutStaged(values) as Record<string, unknown>;
  const uploaded: string[] = [];
  const supabase = createClient();
  try {
    for (const { path, image } of staged) {
      const url = await uploadImage(
        supabase,
        image.folder,
        image.file,
        image.file.name,
      );
      uploaded.push(url);
      setPath(copy, path, url);
    }
  } catch (cause) {
    if (uploaded.length) await discardUploads(uploaded);
    throw cause;
  }
  return { values: copy as T, uploaded };
}

/** After a failed save: removes the images uploaded for it. */
export async function discardStagedUploads(uploaded: string[]) {
  if (uploaded.length) await discardUploads(uploaded);
}
