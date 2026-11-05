"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteEvent } from "../actions";

export function DeleteEventButton({
  id,
  title,
  orders,
}: {
  id: string;
  title: string;
  orders: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Sign-ups keep their history, so the database refuses the delete.
  if (orders > 0)
    return (
      <p className="text-muted text-sm">
        This event has {orders === 1 ? "1 sign-up" : `${orders} sign-ups`}, so
        it can&apos;t be deleted. Unpublish it instead.
      </p>
    );

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError("");
      }}
      trigger={
        <Button variant="danger" size="sm">
          Delete event
        </Button>
      }
      title={`Delete "${title}"?`}
      description="The event, its highlights, agenda and speakers are removed from the site. This can't be undone."
      confirmLabel="Delete"
      pendingLabel="Deleting..."
      pending={pending}
      error={error}
      onConfirm={() =>
        startTransition(async () => {
          // On success the action redirects to the list.
          const result = await deleteEvent(id);
          if (result) setError(result.error);
        })
      }
    />
  );
}
