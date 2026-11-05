"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deletePartner } from "../actions";

export function DeletePartnerButton({
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
          Delete partner
        </Button>
      }
      title={`Delete ${name}?`}
      description="Their logo is removed from the home page. This can't be undone."
      confirmLabel="Delete"
      pendingLabel="Deleting..."
      pending={pending}
      // On success the action redirects to the list.
      onConfirm={() => startTransition(() => deletePartner(id))}
    />
  );
}
