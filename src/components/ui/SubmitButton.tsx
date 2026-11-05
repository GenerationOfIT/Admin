"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./Button";

/**
 * A submit button for a plain server-action form. While the action runs,
 * including the page refresh it triggers, it is disabled and shows
 * pendingLabel.
 */
export function SubmitButton({
  pendingLabel,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
