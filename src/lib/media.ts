import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { requireAdmin } from "@/lib/auth";
import type {
  LibraryItem,
  MediaSectionKey,
  MediaUsage,
} from "@/lib/media-sections";

type Db = Awaited<ReturnType<typeof requireAdmin>>;

const BUCKET = "media";

type Row = Record<string, string>;

/**
 * Every column that can hold a media bucket URL, and how to name and link a
 * row that uses one on the Images page. Add new image columns here.
 */
export const mediaColumns: readonly {
  table: string;
  column: string;
  /** Columns read for the label and link, besides id and the URL column. */
  fields: string;
  label: (row: Row) => string;
  href: ((row: Row) => string) | null;
  section: MediaSectionKey;
}[] = [
  {
    table: "testimonials",
    column: "avatar_url",
    fields: "name",
    label: (row) => `Testimonial: ${row.name}`,
    href: (row) => `/testimonials/${row.id}`,
    section: "testimonials",
  },
  {
    table: "course_lecturers",
    column: "image_url",
    fields: "name, course_id",
    label: (row) => `Lecturer: ${row.name}`,
    href: (row) => `/courses/${row.course_id}/lecturers`,
    section: "lecturers",
  },
  {
    table: "team_members",
    column: "image_url",
    fields: "name",
    label: (row) => `Team: ${row.name}`,
    href: (row) => `/team/${row.id}`,
    section: "team",
  },
  {
    table: "partners",
    column: "logo_url",
    fields: "name",
    label: (row) => `Partner: ${row.name}`,
    href: (row) => `/partners/${row.id}`,
    section: "partners",
  },
  {
    table: "graduates",
    column: "image_url",
    fields: "name",
    label: (row) => `Graduate: ${row.name}`,
    href: (row) => `/graduates/${row.id}`,
    section: "graduates",
  },
  {
    table: "events",
    column: "image_url",
    fields: "title",
    label: (row) => `Event: ${row.title}`,
    href: (row) => `/events/${row.id}`,
    section: "events",
  },
  {
    table: "event_speakers",
    column: "photo_url",
    fields: "name, event_id",
    label: (row) => `Event speaker: ${row.name}`,
    href: (row) => `/events/${row.event_id}/speakers`,
    section: "events",
  },
];

function mediaPrefix() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/${BUCKET}/` : null;
}

/** The file's path in the bucket, or null for site paths and anything else. */
export function mediaPath(url: string | null | undefined) {
  const prefix = mediaPrefix();
  if (!url || !prefix || !url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length);
  return /^[\w/-]+\.(webp|jpg|jpeg|png)$/.test(path) ? path : null;
}

export function mediaUrl(path: string) {
  return `${mediaPrefix()}${path}`;
}

// Each table has its own row type; only the URL column matters here.
const loose = (db: Db) => db as unknown as SupabaseClient;

/** Where each bucket file is used, keyed by its path. One query per column. */
export async function mediaUsages(db: Db) {
  const prefix = mediaPrefix();
  const usages = new Map<string, MediaUsage[]>();
  if (!prefix) return usages;
  const results = await Promise.all(
    mediaColumns.map(async (source) => {
      const { data, error } = await loose(db)
        .from(source.table)
        .select(`id, ${source.column}, ${source.fields}`)
        .like(source.column, `${prefix}%`);
      if (error) throw error;
      return { source, rows: data as unknown as Row[] };
    }),
  );
  for (const { source, rows } of results)
    for (const row of rows) {
      const path = mediaPath(row[source.column]);
      if (!path) continue;
      const list = usages.get(path) ?? [];
      list.push({
        label: source.label(row),
        href: source.href?.(row) ?? null,
        section: source.section,
      });
      usages.set(path, list);
    }
  return usages;
}

/** Every uploaded file with the places that use it, newest first. */
export async function listMediaLibraryItems(db: Db): Promise<LibraryItem[]> {
  const [files, usages] = await Promise.all([
    listMediaFiles(db),
    mediaUsages(db),
  ]);
  return files
    .map((file) => ({ ...file, usages: usages.get(file.path) ?? [] }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Paths of all bucket files that some row still uses. */
export async function usedMediaPaths(db: Db) {
  return new Set((await mediaUsages(db)).keys());
}

async function isUsed(db: Db, url: string) {
  for (const { table, column } of mediaColumns) {
    const { count, error } = await loose(db)
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(column, url);
    if (error) throw error;
    if (count) return true;
  }
  return false;
}

/**
 * Deletes an upload once no row uses it. Only used to undo uploads for a save
 * that failed; replaced or removed images stay in the library for reuse.
 * Best effort: a failure is logged and the file shows up on the Unused images
 * page instead.
 */
export async function removeIfUnused(db: Db, url: string | null | undefined) {
  const path = mediaPath(url);
  if (!path) return;
  try {
    if (await isUsed(db, url!)) return;
    const { error } = await db.storage.from(BUCKET).remove([path]);
    if (error) throw error;
  } catch (cause) {
    console.error("Image cleanup failed", path, cause);
  }
}

export type MediaFile = {
  path: string;
  url: string;
  size: number;
  createdAt: string;
};

/** All files in the bucket (one folder level deep, as the admin uploads). */
export async function listMediaFiles(db: Db) {
  const files: MediaFile[] = [];
  async function walk(folder: string) {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.storage.from(BUCKET).list(folder, {
        limit: 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw error;
      for (const item of data) {
        const path = folder ? `${folder}/${item.name}` : item.name;
        // Folders come back without an id.
        if (!item.id) {
          if (!folder) await walk(path);
          continue;
        }
        files.push({
          path,
          url: mediaUrl(path),
          size: Number(item.metadata?.size ?? 0),
          createdAt: item.created_at ?? "",
        });
      }
      if (data.length < 1000) break;
    }
  }
  await walk("");
  return files;
}

/**
 * Uploaded files no row uses, newest first. Uploads happen when a form is
 * saved, so a fresh upload is in use moments later and needs no grace period.
 */
export async function listUnusedMedia(db: Db) {
  const [files, used] = await Promise.all([
    listMediaFiles(db),
    usedMediaPaths(db),
  ]);
  return files
    .filter((file) => !used.has(file.path))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
