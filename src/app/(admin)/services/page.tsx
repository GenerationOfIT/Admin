import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ReorderableList } from "@/components/ui/ReorderableList";
import { saveServiceOrder, setPublished } from "./actions";

export default async function ServicesPage() {
  const db = await requireAdmin();
  const { data: services, error } = await db
    .from("services")
    .select("id, title, slug, is_published, sort_order")
    .order("sort_order")
    .order("title");
  if (error) throw error;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services</h1>
        <Link href="/services/new" className={buttonVariants()}>
          New service
        </Link>
      </div>
      <p className="text-muted mb-4 text-sm">
        The order here is the order on the home page.
      </p>
      <ReorderableList
        save={saveServiceOrder}
        rows={services.map((service) => ({
          id: service.id,
          label: service.title,
          content: (
            <>
              <Link
                href={`/services/${service.id}`}
                className="flex min-w-0 flex-1 flex-col hover:underline"
              >
                <span className="font-bold">{service.title}</span>
                <span className="text-muted text-sm">
                  /services/{service.slug}
                </span>
              </Link>
              <span
                className={
                  service.is_published
                    ? "text-accent text-sm"
                    : "text-muted text-sm"
                }
              >
                {service.is_published ? "Published" : "Draft"}
              </span>
              <form action={setPublished}>
                <input type="hidden" name="id" value={service.id} />
                <input
                  type="hidden"
                  name="published"
                  value={String(!service.is_published)}
                />
                <SubmitButton
                  variant="secondary"
                  size="sm"
                  pendingLabel={
                    service.is_published ? "Unpublishing..." : "Publishing..."
                  }
                >
                  {service.is_published ? "Unpublish" : "Publish"}
                </SubmitButton>
              </form>
            </>
          ),
        }))}
      />
    </div>
  );
}
