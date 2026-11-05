import { cn } from "@/lib/cn";
import type { RegistrationStatus } from "../event.schema";

export const registrationText: Record<
  RegistrationStatus,
  { label: string; detail: string }
> = {
  open: { label: "Registering", detail: "People can register now." },
  upcoming: {
    label: "Upcoming",
    detail: "Registration opens on the opening date.",
  },
  paused: {
    label: "Paused",
    detail: "Within the dates, but registration is switched off.",
  },
  closed: {
    label: "Closed",
    detail: "The closing date has passed or the event has started.",
  },
  inactive: {
    label: "Not open",
    detail: "Registration is switched off and the opening date hasn't come.",
  },
  none: { label: "No dates", detail: "Registration dates aren't set yet." },
};

export function RegistrationBadge({ status }: { status: RegistrationStatus }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs",
        status === "open"
          ? "border-accent text-accent"
          : "border-border text-muted",
      )}
    >
      {registrationText[status].label}
    </span>
  );
}
