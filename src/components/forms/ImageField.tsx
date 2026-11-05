"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageIcon, Upload } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { acceptedImageTypes, checkImage } from "@/lib/images";
import { cn } from "@/lib/cn";
import { imagePreviewUrl } from "@/lib/imagePreview";
import { errorAt } from "./errorAt";
import { MediaPicker } from "./MediaPicker";
import { stagedKey, type StagedImage } from "./stagedImages";

/**
 * Pick, reuse or remove one image. A picked file is only staged in the form
 * with a local preview; the form uploads it when it's saved (stagedImages).
 * Removing only clears the field; the file stays in the library for reuse.
 */
export function ImageField({
  name,
  label,
  folder,
  recommended,
  round = false,
  hint,
}: {
  name: string;
  label: string;
  /** Bucket folder, e.g. "testimonials". */
  folder: string;
  /** One exact suggested size, e.g. "400 × 400 px, square". Not enforced. */
  recommended: string;
  /** Preview as a circle, like avatars on the site. */
  round?: boolean;
  hint?: string;
}) {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext();
  const stagedName = stagedKey(name);
  const value: string = useWatch({ control, name }) ?? "";
  const pending = useWatch({ control, name: stagedName }) as
    StagedImage | null | undefined;
  const [fileError, setFileError] = useState("");

  // A local preview of the staged file, released when it changes.
  const localPreview = useMemo(
    () => (pending ? URL.createObjectURL(pending.file) : null),
    [pending],
  );
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );
  const preview = localPreview ?? imagePreviewUrl(value);
  const error = fileError || errorAt(errors, name);

  function stage(file: File | undefined) {
    if (!file) return;
    try {
      setValue(
        stagedName,
        { file: checkImage(file), folder },
        { shouldDirty: true },
      );
      setFileError("");
    } catch (cause) {
      setFileError(
        cause instanceof Error ? cause.message : "Can't use this file.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-bold">{label}</span>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "bg-background border-border flex shrink-0 items-center justify-center overflow-hidden border",
            round ? "size-16 rounded-full" : "h-20 w-32 rounded-lg",
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local or remote preview
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon size={20} className="text-muted" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="border-border hover:border-primary inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold">
            <Upload size={14} />
            {value || pending ? "Replace" : "Upload image"}
            <input
              type="file"
              accept={acceptedImageTypes.join(",")}
              className="sr-only"
              onChange={(event) => {
                stage(event.target.files?.[0]);
                // Lets the same file be picked again after an error.
                event.target.value = "";
              }}
            />
          </label>
          <MediaPicker
            folder={folder}
            onPick={(url) => {
              setValue(stagedName, null, { shouldDirty: true });
              setFileError("");
              setValue(name, url, { shouldDirty: true, shouldValidate: true });
            }}
          />
          {(value || pending) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setValue(stagedName, null, { shouldDirty: true });
                setValue(name, "", { shouldDirty: true, shouldValidate: true });
              }}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
      {pending && (
        <span className="text-accent text-xs">
          {pending.file.name} is uploaded when you save.
        </span>
      )}
      {!pending && value && !preview && (
        <span className="text-muted text-xs">Current image: {value}</span>
      )}
      <span className="text-muted text-xs">
        Recommended: {recommended}. JPEG, PNG or WebP, up to 5 MB; uploaded as
        is.
      </span>
      {hint && <span className="text-muted text-xs">{hint}</span>}
      {error && (
        <span role="alert" className="text-danger text-xs">
          {error}
        </span>
      )}
    </div>
  );
}
