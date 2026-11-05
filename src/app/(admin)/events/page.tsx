import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ReorderableList } from "@/components/ui/ReorderableList";
import { cn } from "@/lib/cn";
import { imagePreviewUrl } from "@/lib/imagePreview";
import { zonedParts, zonedToday } from "@/lib/zoned-time";
import { saveEventOrder, setEventPublished } from "./actions";
import { registrationStatus } from "./event.schema";
import { RegistrationBadge } from "./_components/RegistrationBadge";

export default async function EventsPage() {
  const db = await requireAdmin();
  const { data: events, error } = await db
    .from("events")
    .select(
      "id, title, slug, starts_at, timezone, image_url, is_published, registration_open, registration_opens_on, registration_closes_on",
    )
    .order("sort_order")
    .order("starts_at");
  if (error) throw error;

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link href="/events/new" className={buttonVariants()}>
          New event
        </Link>
      </div>
      <p className="text-muted mb-4 text-sm">
        The home page lists upcoming published events in this order; past events
        drop off it but keep their own page.
      </p>
      {events.length === 0 ? (
        <p className="text-muted">No events yet.</p>
      ) : (
        <ReorderableList
          save={saveEventOrder}
          rows={events.map((event) => {
            const start = zonedParts(event.starts_at, event.timezone);
            const photo = imagePreviewUrl(event.image_url);
            const status = registrationStatus(
              {
                starts_at: event.starts_at,
                registration_open: event.registration_open,
                registration_opens_on: event.registration_opens_on ?? "",
                registration_closes_on: event.registration_closes_on ?? "",
              },
              zonedToday(event.timezone),
            );
            const missing = !event.image_url
              ? "Needs a photo"
              : !event.registration_opens_on
                ? "Needs dates"
                : null;
            return {
              id: event.id,
              label: event.title,
              content: (
                <>
                  <div className="bg-background border-border flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                      <img
                        src={photo}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageIcon
                        size={18}
                        className="text-muted"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <Link
                    href={`/events/${event.id}`}
                    className="flex min-w-0 flex-1 flex-col hover:underline"
                  >
                    <span className="font-bold">{event.title}</span>
                    <span className="text-muted text-sm">
                      {start.date} · {start.time} ({event.timezone})
                    </span>
                  </Link>
                  <RegistrationBadge status={status} />
                  <span
                    className={cn(
                      "w-20 text-right text-sm",
                      event.is_published ? "text-accent" : "text-muted",
                    )}
                  >
                    {event.is_published ? "Published" : "Draft"}
                  </span>
                  {event.is_published || !missing ? (
                    <form action={setEventPublished}>
                      <input type="hidden" name="id" value={event.id} />
                      <input
                        type="hidden"
                        name="published"
                        value={String(!event.is_published)}
                      />
                      <SubmitButton
                        variant="secondary"
                        size="sm"
                        pendingLabel={
                          event.is_published
                            ? "Unpublishing..."
                            : "Publishing..."
                        }
                      >
                        {event.is_published ? "Unpublish" : "Publish"}
                      </SubmitButton>
                    </form>
                  ) : (
                    <span className="text-danger w-[5.5rem] text-center text-xs">
                      {missing}
                    </span>
                  )}
                </>
              ),
            };
          })}
        />
      )}
    </div>
  );
}
