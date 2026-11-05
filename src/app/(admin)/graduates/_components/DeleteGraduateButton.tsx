"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteGraduate } from "../actions";

export function DeleteGraduateButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="danger" size="sm">
          Delete graduate
        </Button>
      }
      title={`Delete ${name}?`}
      description="They're removed from the Graduates and About pages. This can't be undone."
      confirmLabel="Delete"
      pendingLabel="Deleting..."
      pending={pending}
      // On success the action redirects to the list.
      onConfirm={() => startTransition(() => deleteGraduate(id))}
    />
  );
}
