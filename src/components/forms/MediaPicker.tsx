"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Images, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import type { MediaFile } from "@/lib/media";
import { listMediaLibrary } from "@/lib/media-actions";
import { folderOf, MEDIA_PAGE, mediaSections } from "@/lib/media-sections";
import { cn } from "@/lib/cn";
import { StableLabel } from "@/components/ui/StableLabel";

const PAGE = MEDIA_PAGE;

/**
 * Picks an already uploaded image instead of uploading a copy. The list loads
 * once per opening; searching filters it in the browser, so typing sends no
 * requests and needs no debounce.
 */
export function MediaPicker({
  onPick,
  disabled,
  folder,
}: {
  onPick: (url: string) => void;
  disabled?: boolean;
  /** The form's upload folder; the picker opens on it, e.g. "graduates". */
  folder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [section, setSection] = useState(folder ?? "all");

  async function load() {
    setFiles(null);
    setError("");
    try {
      setFiles(await listMediaLibrary());
    } catch {
      setError("The image library couldn't be loaded. Try again.");
    }
  }

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (files ?? []).filter(
    (file) =>
      (section === "all" || folderOf(file.path) === section) &&
      terms.every((term) => file.path.toLowerCase().includes(term)),
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery("");
          setShown(PAGE);
          setSection(folder ?? "all");
          void load();
        }
      }}
    >
      <Dialog.Trigger asChild>
        <Button variant="secondary" size="sm" disabled={disabled}>
          <Images size={14} /> Choose existing
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        {/* A fixed height, so switching sections or searching doesn't resize
            the dialog; only the image list scrolls. */}
        <Dialog.Content className="bg-surface border-border fixed top-1/2 left-1/2 z-50 flex h-[min(85vh,44rem)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-2xl border p-6">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-xl font-bold">
              Choose an uploaded image
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="text-muted hover:text-foreground"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Search uploaded images by file name and pick one to reuse.
          </Dialog.Description>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShown(PAGE);
            }}
            placeholder="Search by file name, e.g. alex"
            aria-label="Search images"
            autoFocus
            className={inputClass}
          />
          <div
            role="group"
            aria-label="Image sections"
            className="flex flex-wrap gap-1.5"
          >
            {[{ key: "all", label: "All" }, ...mediaSections].map(
              ({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={section === key}
                  onClick={() => {
                    setSection(key);
                    setShown(PAGE);
                  }}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-xs",
                    section === key
                      ? "border-accent text-accent font-bold"
                      : "border-border text-muted hover:text-foreground",
                  )}
                >
                  <StableLabel>{label}</StableLabel>
                </button>
              ),
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {error ? (
              <p role="alert" className="text-danger text-sm">
                {error}
              </p>
            ) : files === null ? (
              <p className="text-muted text-sm">Loading images...</p>
            ) : matches.length === 0 ? (
              <p className="text-muted text-sm">
                {files.length === 0
                  ? "No images uploaded yet."
                  : "No images match. Try another section or All."}
              </p>
            ) : (
              <>
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {matches.slice(0, shown).map((file) => (
                    <li key={file.path}>
                      <button
                        type="button"
                        onClick={() => {
                          onPick(file.url);
                          setOpen(false);
                        }}
                        className="border-border hover:border-accent flex w-full flex-col gap-1.5 rounded-lg border p-2 text-left text-xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- preview of a bucket file */}
                        <img
                          src={file.url}
                          alt=""
                          loading="lazy"
                          className="bg-background aspect-square w-full rounded object-contain"
                        />
                        <span className="truncate" title={file.path}>
                          {file.path}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {matches.length > shown && (
                  <Button
                    variant="ghost"
                    size="md"
                    className="mt-3 ml-auto flex"
                    onClick={() => setShown((count) => count + PAGE)}
                  >
                    Show more ({matches.length - shown} left)
                  </Button>
                )}
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
