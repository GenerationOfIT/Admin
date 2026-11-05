"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteTestimonial } from "../actions";

export function DeleteTestimonialButton({
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
          Delete testimonial
        </Button>
      }
      title={`Delete ${name}'s testimonial?`}
      description="It's removed from every page. This can't be undone."
      confirmLabel="Delete"
      pendingLabel="Deleting..."
      pending={pending}
      // On success the action redirects to the list.
      onConfirm={() => startTransition(() => deleteTestimonial(id))}
    />
  );
}
