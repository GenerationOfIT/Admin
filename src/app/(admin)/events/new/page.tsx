import { BackLink } from "@/components/ui/BackLink";
import { requireAdmin } from "@/lib/auth";
import { NewEventForm } from "../_components/NewEventForm";

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl">
      <BackLink href="/events">Events</BackLink>
      <h1 className="mt-2 mb-2 text-2xl font-bold">New event</h1>
      <p className="text-muted mb-6 text-sm">
        It starts as a draft with registration off. Fill in its details, place,
        registration dates and photo on the next screens, then publish it.
      </p>
      <NewEventForm />
    </div>
  );
}
