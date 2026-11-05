"use server";

import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { listMediaFiles, removeIfUnused, type MediaFile } from "@/lib/media";

/**
 * Every uploaded image, newest first, for the "Choose existing" picker. One
 * request per bucket folder; the picker filters this list in the browser.
 */
export async function listMediaLibrary(): Promise<MediaFile[]> {
  const db = await requireAdmin();
  const files = await listMediaFiles(db);
  return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Deletes images uploaded for a save that then failed. Each file is removed
 * only if no row uses it, so this can't touch an image that's in use.
 */
export async function discardUploads(urls: unknown) {
  const db = await requireAdmin();
  for (const url of z.array(z.string()).max(20).parse(urls))
    await removeIfUnused(db, url);
}
