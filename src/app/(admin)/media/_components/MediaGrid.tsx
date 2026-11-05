"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  folderOf,
  formatSize,
  MEDIA_PAGE,
  sectionLabel,
  type LibraryItem,
  type MediaTab,
} from "@/lib/media-sections";

const badge = "rounded-full border px-2 py-0.5 text-xs";

/**
 * Images in one section tab (or Other): where each came from and every
 * place that uses it. Deleting happens on the Unused tab.
 */
export function MediaGrid({
  items,
  tab,
  emptyText = "No images here yet. Drop some above, or upload one from a form.",
}: {
  items: LibraryItem[];
  tab: MediaTab;
  /** Shown instead of the grid when there are no images, e.g. no search matches. */
  emptyText?: string;
}) {
  const [shown, setShown] = useState(MEDIA_PAGE);
  if (items.length === 0) return <p className="text-muted">{emptyText}</p>;
  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, shown).map((item) => {
          const folder = folderOf(item.path);
          return (
            <li
              key={item.path}
              className="bg-surface border-border flex flex-col gap-2 rounded-xl border p-3 text-xs"
            >
              <a href={item.url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- preview of a bucket file */}
                <img
                  src={item.url}
                  alt=""
                  loading="lazy"
                  className="bg-background aspect-square w-full rounded-lg object-contain"
                />
              </a>
              <span className="truncate font-bold" title={item.path}>
                {item.path.slice(folder ? folder.length + 1 : 0)}
              </span>
              <span className="text-muted">
                {formatSize(item.size)}
                {item.createdAt &&
                  ` · Uploaded ${new Date(item.createdAt).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    },
                  )}`}
              </span>
              <span className="flex flex-wrap gap-1.5">
                {tab !== "other" && folder !== tab && (
                  <span className={`${badge} border-primary text-primary`}>
                    From {sectionLabel(folder) || "elsewhere"}
                  </span>
                )}
                {item.usages.length === 0 && (
                  <span className={`${badge} border-border text-muted`}>
                    Not used yet
                  </span>
                )}
              </span>
              {item.usages.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                  {item.usages.map((usage) => (
                    <li key={`${usage.label}-${usage.href}`}>
                      {usage.href ? (
                        <Link href={usage.href} className="hover:underline">
                          {usage.label}
                        </Link>
                      ) : (
                        <span className="text-muted">{usage.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      {items.length > shown && (
        <Button
          variant="ghost"
          size="md"
          className="mt-4 ml-auto flex"
          onClick={() => setShown((count) => count + MEDIA_PAGE)}
        >
          Show more ({items.length - shown} left)
        </Button>
      )}
    </>
  );
}
