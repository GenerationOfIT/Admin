import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { requireAdmin } from "@/lib/auth";
import { ReorderableList } from "@/components/ui/ReorderableList";
import { cn } from "@/lib/cn";
import { saveTestimonialOrder } from "../actions";
import { TestimonialPagePicker } from "../_components/TestimonialPagePicker";
import { loadPlacementOptions } from "../testimonial.data";
import { testimonialsOnPage } from "../testimonial.order";
import { parseTestimonialPage } from "../testimonial.pages";

export default async function TestimonialOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page =
    parseTestimonialPage((await searchParams).page) ??
    parseTestimonialPage("home")!;
  const db = await requireAdmin();
  const [rows, options] = await Promise.all([
    testimonialsOnPage(db, page),
    loadPlacementOptions(db),
  ]);
  const groups = [
    {
      label: "Pages",
      pages: [
        { key: "home", label: "Home" },
        { key: "academy", label: "Academy" },
      ],
    },
    {
      label: "Service pages",
      pages: options.services.map((s) => ({
        key: `service:${s.value}`,
        label: s.label,
      })),
    },
    {
      label: "Course pages",
      pages: options.courses.map((c) => ({
        key: `course:${c.value}`,
        label: c.label,
      })),
    },
  ];

  return (
    <div className="max-w-5xl">
      <BackLink href="/testimonials">Testimonials</BackLink>
      <h1 className="mt-2 mb-2 text-2xl font-bold">Order on site</h1>
      <p className="text-muted mb-6 text-sm">
        Each page has its own order. Saving an order here only changes this
        page. Newly placed testimonials go last.
      </p>
      <TestimonialPagePicker groups={groups} current={page.key}>
        <div>
          {rows.length === 0 ? (
            <p className="text-muted text-sm">
              No testimonials are placed on this page.
            </p>
          ) : (
            <ReorderableList
              // A fresh list per page, so an unsaved order never carries over.
              key={page.key}
              numbered
              save={saveTestimonialOrder.bind(null, page.key)}
              rows={rows.map((row) => ({
                id: row.id,
                label: row.name,
                content: (
                  <>
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
                    <span className="text-muted text-xs">
                      {row.type === "graduate" ? "Graduate" : "Client"}
                    </span>
                    <span
                      className={cn(
                        "w-20 text-right text-sm",
                        row.is_published ? "text-accent" : "text-muted",
                      )}
                    >
                      {row.is_published ? "Published" : "Draft"}
                    </span>
                  </>
                ),
              }))}
            />
          )}
        </div>
      </TestimonialPagePicker>
    </div>
  );
}
