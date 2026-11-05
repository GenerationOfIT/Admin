"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteCourse } from "../actions";

export function DeleteCourseButton({
  id,
  title,
  links,
}: {
  id: string;
  title: string;
  links: { orders: number; testimonials: number };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Orders keep purchase history, so the database refuses the delete.
  if (links.orders > 0)
    return (
      <p className="text-muted text-sm">
        This course has{" "}
        {links.orders === 1 ? "1 order" : `${links.orders} orders`}, so it
        can&apos;t be deleted. Unpublish it instead.
      </p>
    );

  const unlinked =
    links.testimonials === 0
      ? ""
      : ` ${links.testimonials === 1 ? "1 linked testimonial is" : `${links.testimonials} linked testimonials are`} unpublished and unlinked; you can attach them to another course later.`;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError("");
      }}
      trigger={
        <Button variant="danger" size="sm">
          Delete course
        </Button>
      }
      title={`Delete "${title}"?`}
      description={`The course, its price and all its content are removed from the site. This can't be undone.${unlinked}`}
      confirmLabel="Delete"
      pendingLabel="Deleting..."
      pending={pending}
      error={error}
      onConfirm={() =>
        startTransition(async () => {
          // On success the action redirects to the list.
          const result = await deleteCourse(id);
          if (result) setError(result.error);
        })
      }
    />
  );
}
