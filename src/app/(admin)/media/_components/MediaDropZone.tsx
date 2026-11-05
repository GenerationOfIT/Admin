"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Upload, XCircle } from "lucide-react";
import { acceptedImageTypes, checkImage, uploadImage } from "@/lib/images";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  name: string;
  state: "uploading" | "done" | "failed";
  message?: string;
};

// A few at a time: quick for a batch, without opening dozens of uploads at once.
const PARALLEL = 3;

/**
 * Uploads dropped or chosen images into one bucket folder, with the same
 * type, size and naming rules as the forms. Each file reports on its own, so
 * one rejected file doesn't stop the rest.
 */
export function MediaDropZone({
  folder,
  label,
  recommended,
}: {
  folder: string;
  label: string;
  recommended: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const busy = jobs.some((job) => job.state === "uploading");

  const update = (id: string, change: Partial<Job>) =>
    setJobs((current) =>
      current.map((job) => (job.id === id ? { ...job, ...change } : job)),
    );

  async function upload(files: File[]) {
    if (files.length === 0) return;
    const batch = files.map((file) => ({
      file,
      job: {
        id: crypto.randomUUID(),
        name: file.name,
        state: "uploading" as const,
      },
    }));
    setJobs((current) => [...batch.map(({ job }) => job), ...current]);
    const supabase = createClient();
    const queue = [...batch];
    await Promise.all(
      Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          try {
            await uploadImage(
              supabase,
              folder,
              checkImage(next.file),
              next.file.name,
            );
            update(next.job.id, { state: "done" });
          } catch (cause) {
            update(next.job.id, {
              state: "failed",
              message:
                cause instanceof Error ? cause.message : "Upload failed.",
            });
          }
        }
      }),
    );
    // The grid is rendered on the server; show the new images in it.
    router.refresh();
  }

  return (
    <div className="mb-8 flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload images to ${label}`}
        onClick={() => input.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            input.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload([...event.dataTransfer.files]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center",
          dragging
            ? "border-accent bg-surface"
            : "border-border hover:border-primary",
        )}
      >
        <Upload size={24} className="text-muted" aria-hidden="true" />
        <p className="font-bold">Drop images here, or click to choose them</p>
        <p className="text-muted text-sm">
          Uploads to {label}. Recommended: {recommended}. JPEG, PNG or WebP, up
          to 5 MB each; uploaded as is.
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept={acceptedImageTypes.join(",")}
          className="hidden"
          onChange={(event) => {
            void upload([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
      </div>
      {jobs.length > 0 && (
        <div className="flex flex-col gap-1">
          <ul aria-live="polite" className="flex flex-col gap-1 text-sm">
            {jobs.map((job) => (
              <li key={job.id} className="flex items-center gap-2">
                {job.state === "uploading" ? (
                  <LoaderCircle
                    size={14}
                    className="text-muted animate-spin"
                    aria-hidden="true"
                  />
                ) : job.state === "done" ? (
                  <CheckCircle2
                    size={14}
                    className="text-accent"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    size={14}
                    className="text-danger"
                    aria-hidden="true"
                  />
                )}
                <span className="truncate">{job.name}</span>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    job.state === "failed" ? "text-danger" : "text-muted",
                  )}
                >
                  {job.state === "uploading"
                    ? "Uploading..."
                    : job.state === "done"
                      ? "Uploaded"
                      : job.message}
                </span>
              </li>
            ))}
          </ul>
          {!busy && (
            <button
              type="button"
              onClick={() => setJobs([])}
              className="text-muted hover:text-foreground cursor-pointer self-start text-xs underline"
            >
              Clear this list
            </button>
          )}
        </div>
      )}
    </div>
  );
}
