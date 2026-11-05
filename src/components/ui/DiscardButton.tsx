"use client";

import { useState } from "react";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * Puts an edit form back to its last saved values, after a confirmation so a
 * misclick can't throw away typing.
 */
export function DiscardButton({ onDiscard }: { onDiscard: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      trigger={<Button variant="secondary">Discard changes</Button>}
      title="Discard your changes?"
      description="Everything you changed since the last save goes back to how it was, including images you picked but haven't saved. This can't be undone."
      confirmLabel="Discard"
      cancelLabel="Keep editing"
      pendingLabel="Discarding..."
      pending={false}
      onConfirm={() => {
        onDiscard();
        setOpen(false);
      }}
    />
  );
}
