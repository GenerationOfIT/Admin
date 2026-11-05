"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  mediaSections,
  tabsFor,
  type LibraryItem,
  type MediaTab,
} from "@/lib/media-sections";
import { matchesSearch } from "@/lib/media-search";
import { cn } from "@/lib/cn";
import { inputClass } from "@/components/ui/Field";
import { StableLabel } from "@/components/ui/StableLabel";
import { MediaDropZone } from "./MediaDropZone";
import { MediaGrid } from "./MediaGrid";
import { UnusedMediaList } from "./UnusedMediaList";

/**
 * The page loads every image once, so switching tabs and searching happen
 * here in the browser: instant, with no new request. The address still
 * follows both (replaceState), so a reload or a shared link opens the same
 * view. Uploads and deletes refresh the server data.
 */
export function MediaLibrary({
  items,
  initialTab,
  initialQuery,
}: {
  items: LibraryItem[];
  initialTab: string | undefined;
  initialQuery: string | undefined;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const group = (list: LibraryItem[]) => {
    const byTab = new Map<MediaTab, LibraryItem[]>();
    for (const item of list)
      for (const tab of tabsFor(item))
        byTab.set(tab, [...(byTab.get(tab) ?? []), item]);
    return byTab;
  };
  // The tabs are fixed, so a search never hides one; the counts and grids
  // show only the matches.
  const byTab = group(items.filter((item) => matchesSearch(item, query)));
  const tabs: { key: MediaTab; label: string }[] = [
    ...mediaSections.map(({ key, label }) => ({ key, label })),
    { key: "unused", label: "Unused" },
    // Always shown, so files put straight into storage are never out of sight.
    { key: "other", label: "Other" },
  ];
  const [tab, setTab] = useState<MediaTab>(
    tabs.find(({ key }) => key === initialTab)?.key ?? "testimonials",
  );
  const section = mediaSections.find(({ key }) => key === tab);
  const shown = byTab.get(tab) ?? [];
  const searching = query.trim() !== "";

  const syncAddress = (nextTab: MediaTab, nextQuery: string) => {
    const params = new URLSearchParams({ tab: nextTab });
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    window.history.replaceState(null, "", `/media?${params}`);
  };

  return (
    <>
      <label className="relative mb-4 block max-w-sm">
        <span className="sr-only">Search images</span>
        <Search
          size={16}
          aria-hidden="true"
          className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            syncAddress(tab, event.target.value);
          }}
          placeholder="Search by file name or who uses it"
          className={cn(inputClass, "pl-9")}
        />
      </label>
      <nav
        aria-label="Image sections"
        className="mb-6 flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-border)]"
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-current={key === tab ? "page" : undefined}
            onClick={() => {
              setTab(key);
              syncAddress(key, query);
            }}
            className={cn(
              "shrink-0 cursor-pointer border-b-2 px-3 py-2 text-sm",
              key === tab
                ? "border-accent font-bold"
                : "text-muted hover:text-foreground border-transparent",
            )}
          >
            <StableLabel>{label}</StableLabel>{" "}
            <span className="text-muted font-normal">
              {byTab.get(key)?.length ?? 0}
            </span>
          </button>
        ))}
      </nav>
      {section && (
        <MediaDropZone
          key={`upload-${section.key}`}
          folder={section.key}
          label={section.label}
          recommended={section.recommended}
        />
      )}
      {/* Keyed by the search too, so paging and Unused's selection start
          over for each search; nothing hidden by a search stays selected. */}
      {tab === "unused" ? (
        <>
          <p className="text-muted mb-4 text-sm">
            Images nothing uses right now, newest first. Nothing is deleted
            automatically, so replaced photos stay here for reuse. Delete the
            ones you won&apos;t need again.
          </p>
          <UnusedMediaList
            key={`list-${tab}-${query}`}
            files={shown}
            emptyText={
              searching ? "No unused images match your search." : undefined
            }
          />
        </>
      ) : (
        <>
          {tab === "other" && (
            <p className="text-muted mb-4 text-sm">
              Images no section tab covers: files in folders other than the
              sections&apos;, for example put straight into storage by a
              developer.
            </p>
          )}
          <MediaGrid
            key={`grid-${tab}-${query}`}
            items={shown}
            tab={tab}
            emptyText={
              searching
                ? "No images here match your search."
                : tab === "other"
                  ? "Nothing here: every image belongs to a section."
                  : undefined
            }
          />
        </>
      )}
    </>
  );
}
