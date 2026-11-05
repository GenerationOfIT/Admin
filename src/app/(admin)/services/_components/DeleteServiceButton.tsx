"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteService } from "../actions";

export function DeleteServiceButton({
  id,
  title,
  linkedTestimonials,
}: {
  id: string;
  title: string;
  linkedTestimonials: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError("");
      }}
      trigger={
        <Button variant="danger" size="sm">
          Delete service
        </Button>
      }
      title={`Delete "${title}"?`}
      description={`The service and all its cards are removed from the site. This can't be undone.${
        linkedTestimonials
          ? ` ${linkedTestimonials === 1 ? "1 linked testimonial is" : `${linkedTestimonials} linked testimonials are`} unpublished and unlinked; you can attach them to another service later.`
          : ""
      }`}
      confirmLabel="Delete"
      pendingLabel="Deleting..."
      pending={pending}
      error={error}
      onConfirm={() =>
        startTransition(async () => {
          // On success the action redirects to the list.
          const result = await deleteService(id);
          if (result) setError(result.error);
        })
      }
    />
  );
}
