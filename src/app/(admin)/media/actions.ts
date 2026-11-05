"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { listUnusedMedia } from "@/lib/media";

export async function deleteUnusedMedia(
  input: unknown,
): Promise<{ deleted: number } | { error: string }> {
  const db = await requireAdmin();
  const paths = z.array(z.string()).max(500).parse(input);
  // Checked again now: the page may be stale, and a file chosen there could
  // have been put back into use since.
  const unused = new Set((await listUnusedMedia(db)).map(({ path }) => path));
  const deletable = paths.filter((path) => unused.has(path));
  if (deletable.length === 0) return { deleted: 0 };
  const { data, error } = await db.storage.from("media").remove(deletable);
  if (error) return { error: `Delete failed: ${error.message}` };
  revalidatePath("/media");
  return { deleted: data.length };
}
