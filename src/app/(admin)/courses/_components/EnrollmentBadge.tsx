import { cn } from "@/lib/cn";
import type { EnrollmentStatus } from "../course.schema";

export const enrollmentText: Record<
  EnrollmentStatus,
  { label: string; detail: string }
> = {
  open: { label: "Enrolling", detail: "Students can enroll and pay now." },
  upcoming: {
    label: "Upcoming",
    detail: "Enrollment opens on the opening date.",
  },
  paused: {
    label: "Paused",
    detail: "Within the dates, but enrollment is switched off.",
  },
  closed: { label: "Closed", detail: "The closing date has passed." },
  inactive: {
    label: "Not open",
    detail: "Enrollment is off or the dates are missing.",
  },
};

export function EnrollmentBadge({ status }: { status: EnrollmentStatus }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs",
        status === "open"
          ? "border-accent text-accent"
          : "border-border text-muted",
      )}
    >
      {enrollmentText[status].label}
    </span>
  );
}
