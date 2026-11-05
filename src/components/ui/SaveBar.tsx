"use client";

import Link from "next/link";
import { useLeaveWarning } from "@/components/forms/useLeaveWarning";
import { Button, buttonVariants } from "./Button";
import { DiscardButton } from "./DiscardButton";

export type SaveStatus = { ok: boolean; text: string } | null;

/**
 * Sticky footer of an edit form: Save, its result, unsaved changes, and a way
 * back: "Discard changes" on edit forms, a Cancel link on create forms.
 */
export function SaveBar({
  pending,
  dirty,
  status,
  label = "Save",
  allowClean = false,
  onDiscard,
  cancelHref,
}: {
  pending: boolean;
  dirty: boolean;
  status: SaveStatus;
  label?: string;
  /** Create forms can submit before anything is typed. */
  allowClean?: boolean;
  /** Edit forms: puts the form back to its last saved values. */
  onDiscard?: () => void;
  /** Create forms: where Cancel goes, usually the list. */
  cancelHref?: string;
}) {
  // Every form with a SaveBar warns before its unsaved changes are lost.
  useLeaveWarning(dirty);
  return (
    <div className="bg-background border-border sticky bottom-0 z-10 flex items-center gap-4 border-t py-4">
      <Button type="submit" disabled={pending || (!allowClean && !dirty)}>
        {pending ? "Saving..." : label}
      </Button>
      {cancelHref && !pending && (
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "ghost" })}
        >
          Cancel
        </Link>
      )}
      {onDiscard && dirty && !pending && (
        <DiscardButton onDiscard={onDiscard} />
      )}
      {status && (
        <p
          role="status"
          className={status.ok ? "text-accent text-sm" : "text-danger text-sm"}
        >
          {status.text}
        </p>
      )}
      {!allowClean && dirty && !pending && (
        <p className="text-muted text-sm">Unsaved changes</p>
      )}
    </div>
  );
}
