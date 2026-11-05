import Link from "next/link";
import { ListOrdered } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/Button";
import {
  PendingContent,
  PendingLink,
  PendingNavigation,
} from "@/components/ui/PendingNavigation";
import { cn } from "@/lib/cn";
import { StableLabel } from "@/components/ui/StableLabel";
import { loadPlacementOptions } from "./testimonial.data";
import { testimonialTypes, type TestimonialType } from "./testimonial.schema";

const tabs: Record<TestimonialType, string> = {
  client: "Clients",
  graduate: "Graduates",
};

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const requested = (await searchParams).type;
  const type: TestimonialType = testimonialTypes.includes(
    requested as TestimonialType,
  )
    ? (requested as TestimonialType)
    : "client";
  const db = await requireAdmin();
  const [{ data: rows, error }, options] = await Promise.all([
    db
      .from("testimonials")
      .select(
        "id, name, company, quote, is_published, show_on_home, show_on_academy, service_slug, course_id",
      )
      .eq("type", type)
      .order("name"),
    loadPlacementOptions(db),
  ]);
  if (error) throw error;
  const labelOf = (list: { value: string; label: string }[], value: string) =>
    list.find((option) => option.value === value)?.label ?? "Unknown";

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <div className="flex gap-3">
          <Link
            href="/testimonials/order"
            className={buttonVariants({ variant: "secondary" })}
          >
            <ListOrdered size={16} /> Order on site
          </Link>
          <Link href="/testimonials/new" className={buttonVariants()}>
            New testimonial
          </Link>
        </div>
      </div>
      <PendingNavigation>
        <nav aria-label="Testimonial type" className="mb-4 flex gap-2">
          {testimonialTypes.map((value) => (
            <PendingLink
              key={value}
              href={`/testimonials?type=${value}`}
              aria-current={value === type ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm",
                value === type
                  ? "bg-foreground text-ink font-bold"
                  : "text-muted hover:text-foreground",
              )}
            >
              <StableLabel>{tabs[value]}</StableLabel>
            </PendingLink>
          ))}
        </nav>
        <p className="text-muted mb-4 text-sm">
          Each page on the site has its own order; set it with Order on site.
        </p>
        <PendingContent>
          {rows.length === 0 ? (
            <p className="text-muted">No {tabs[type].toLowerCase()} yet.</p>
          ) : (
            <ul className="border-border divide-border divide-y rounded-xl border">
              {rows.map((row) => {
                const places = [
                  row.show_on_home && "Home",
                  row.show_on_academy && "Academy",
                  row.service_slug &&
                    labelOf(options.services, row.service_slug),
                  row.course_id && labelOf(options.courses, row.course_id),
                ].filter((place): place is string => Boolean(place));
                return (
                  <li
                    key={row.id}
                    className="flex items-center gap-4 px-4 py-3"
                  >
                    <Link
                      href={`/testimonials/${row.id}`}
                      className="flex min-w-0 flex-1 flex-col hover:underline"
                    >
                      <span className="font-bold">
                        {row.name}
                        {row.company && (
                          <span className="text-muted font-normal">
                            {" "}
                            · {row.company}
                          </span>
                        )}
                      </span>
                      <span className="text-muted line-clamp-2 text-sm">
                        “{row.quote}”
                      </span>
                    </Link>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      {/* E.g. after its service or course was deleted. */}
                      {places.length === 0 && (
                        <span className="border-danger text-danger rounded-full border px-2 py-0.5 text-xs">
                          No placement
                        </span>
                      )}
                      {places.map((place) => (
                        <span
                          key={place}
                          className="border-border rounded-full border px-2 py-0.5 text-xs"
                        >
                          {place}
                        </span>
                      ))}
                    </div>
                    <span
                      className={cn(
                        "w-20 shrink-0 text-right text-sm",
                        row.is_published ? "text-accent" : "text-muted",
                      )}
                    >
                      {row.is_published ? "Published" : "Draft"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </PendingContent>
      </PendingNavigation>
    </div>
  );
}
