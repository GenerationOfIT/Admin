"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "./Button";

/**
 * Confirmation for destructive actions. Controlled, so the caller can keep it
 * open while the action runs and show an error inside it.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  confirmLabel,
  pendingLabel,
  pending,
  error,
  onConfirm,
  cancelLabel = "Cancel",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  error?: string;
  onConfirm: () => void;
  cancelLabel?: string;
}) {
  return (
    <Dialog.Root
      open={open}
      // Don't let Escape or an outside click close it mid-action.
      onOpenChange={(next) => !pending && onOpenChange(next)}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="bg-surface border-border fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6">
          <Dialog.Title className="mb-2 text-xl font-bold">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-muted text-sm">
            {description}
          </Dialog.Description>
          {error && (
            <p role="alert" className="text-danger mt-4 text-sm">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="secondary" disabled={pending}>
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button variant="danger" disabled={pending} onClick={onConfirm}>
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
