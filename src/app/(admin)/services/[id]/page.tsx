import { BackLink } from "@/components/ui/BackLink";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadService } from "../service.data";
import { ServiceForm } from "../_components/ServiceForm";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const service = await loadService(db, id.data);
  if (!service) notFound();
  // Saved slug, not the form value: the delete trigger matches on this.
  const { count, error } = await db
    .from("testimonials")
    .select("id", { count: "exact", head: true })
    .eq("service_slug", service.slug);
  if (error) throw error;
  return (
    <div className="max-w-4xl">
      <BackLink href="/services">Services</BackLink>
      <h1 className="mt-2 mb-6 text-2xl font-bold">{service.title}</h1>
      <ServiceForm
        id={id.data}
        service={service}
        linkedTestimonials={count ?? 0}
      />
    </div>
  );
}
