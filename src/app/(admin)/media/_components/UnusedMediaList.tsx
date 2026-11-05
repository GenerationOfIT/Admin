"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { MediaFile } from "@/lib/media";
import { cn } from "@/lib/cn";
import { formatSize, MEDIA_PAGE } from "@/lib/media-sections";
import { deleteUnusedMedia } from "../actions";

export function UnusedMediaList({
  files,
  emptyText = "No unused images. Nothing to clean up.",
}: {
  files: MediaFile[];
  /** Shown when the list is empty, e.g. no search matches. */
  emptyText?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [shown, setShown] = useState(MEDIA_PAGE);

  if (files.length === 0) return <p className="text-muted">{emptyText}</p>;

  const allSelected = selected.size === files.length;
  function toggle(path: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() =>
              setSelected(
                allSelected ? new Set() : new Set(files.map((f) => f.path)),
              )
            }
          />
          Select all ({files.length})
        </label>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          trigger={
            <Button variant="danger" size="sm" disabled={selected.size === 0}>
              Delete selected ({selected.size})
            </Button>
          }
          title={`Delete ${selected.size} image${selected.size === 1 ? "" : "s"}?`}
          description="They're removed from storage for good. Images that are back in use by now are skipped."
          confirmLabel="Delete"
          pendingLabel="Deleting..."
          pending={pending}
          onConfirm={() =>
            startTransition(async () => {
              const result = await deleteUnusedMedia([...selected]);
              setOpen(false);
              setSelected(new Set());
              setMessage(
                "error" in result
                  ? result.error
                  : `Deleted ${result.deleted} image${result.deleted === 1 ? "" : "s"}.`,
              );
            })
          }
        />
        {message && (
          <p role="status" className="text-muted text-sm">
            {message}
          </p>
        )}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {files.slice(0, shown).map((file) => (
          <li key={file.path}>
            <label
              className={cn(
                "bg-surface flex cursor-pointer flex-col gap-2 rounded-xl border p-3 text-xs",
                selected.has(file.path) ? "border-danger" : "border-border",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- preview of a bucket file */}
              <img
                src={file.url}
                alt=""
                loading="lazy"
                className="bg-background aspect-square w-full rounded-lg object-contain"
              />
              <span className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(file.path)}
                  onChange={() => toggle(file.path)}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="block truncate font-bold">{file.path}</span>
                  <span className="text-muted">
                    {formatSize(file.size)} ·{" "}
                    {file.createdAt
                      ? `Uploaded ${new Date(file.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                      : "Upload date unknown"}
                  </span>
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {files.length > shown && (
        <Button
          variant="ghost"
          size="md"
          className="self-end"
          onClick={() => setShown((count) => count + MEDIA_PAGE)}
        >
          Show more ({files.length - shown} left)
        </Button>
      )}
    </div>
  );
}
