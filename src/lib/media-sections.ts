/**
 * The Images page's sections. Each is also the bucket folder its uploads go
 * to (ImageField's `folder`), and its recommended size matches the form's.
 */
export const mediaSections = [
  {
    key: "testimonials",
    label: "Testimonials",
    recommended: "400 × 400 px, square",
  },
  { key: "team", label: "Team", recommended: "800 × 800 px, square" },
  { key: "lecturers", label: "Lecturers", recommended: "400 × 400 px, square" },
  {
    key: "partners",
    label: "Partners",
    recommended: "480 × 120 px, PNG or WebP with a transparent background",
  },
  {
    key: "graduates",
    label: "Graduates",
    recommended: "600 × 780 px, portrait",
  },
  {
    key: "events",
    label: "Events",
    recommended:
      "event images 1920 × 1080 px, landscape; speaker photos 600 × 600 px, square",
  },
] as const;
export type MediaSectionKey = (typeof mediaSections)[number]["key"];

/** One place that shows an image, e.g. "Graduate: Name LastName". */
export type MediaUsage = {
  label: string;
  /** The admin page that edits it; null where the admin has no editor. */
  href: string | null;
  section: MediaSectionKey;
};

export type LibraryItem = {
  path: string;
  url: string;
  size: number;
  createdAt: string;
  usages: MediaUsage[];
};

export type MediaTab = MediaSectionKey | "unused" | "other";

/** The folder a file was uploaded to: the first part of its bucket path. */
export function folderOf(path: string) {
  return path.includes("/") ? path.slice(0, path.indexOf("/")) : "";
}

export function sectionLabel(folder: string) {
  return (
    mediaSections.find((section) => section.key === folder)?.label ?? folder
  );
}

/**
 * The tabs an image appears in. A used image shows in every section that
 * uses it, wherever it was uploaded; an unused one shows in Unused and in the
 * section it was uploaded to, so fresh bulk uploads stay where they were
 * dropped. Other collects files in any folder that isn't a section (e.g. put
 * straight into storage), used or not.
 */
export function tabsFor(item: Pick<LibraryItem, "path" | "usages">) {
  const folder = folderOf(item.path);
  const inSection = mediaSections.some((section) => section.key === folder);
  const tabs = new Set<MediaTab>();
  if (item.usages.length === 0) {
    if (inSection) tabs.add(folder as MediaSectionKey);
    tabs.add("unused");
  } else {
    for (const usage of item.usages) tabs.add(usage.section);
  }
  if (!inSection) tabs.add("other");
  return [...tabs];
}

export const formatSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * Image cards shown at once on the Images page and in the picker; "Show more"
 * reveals the next batch from the list already loaded, and only cards on
 * screen download their image.
 */
export const MEDIA_PAGE = 48;
