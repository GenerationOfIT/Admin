import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { BackLink } from "@/components/ui/BackLink";
import { loadPlacementOptions, loadTestimonial } from "../testimonial.data";
import { TestimonialForm } from "../_components/TestimonialForm";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const [testimonial, options] = await Promise.all([
    loadTestimonial(db, id.data),
    loadPlacementOptions(db),
  ]);
  if (!testimonial) notFound();
  return (
    <div className="max-w-5xl">
      <BackLink href={`/testimonials?type=${testimonial.type}`}>
        Testimonials
      </BackLink>
      <h1 className="mt-2 mb-6 text-2xl font-bold">{testimonial.name}</h1>
      <TestimonialForm
        id={id.data}
        testimonial={testimonial}
        options={options}
      />
    </div>
  );
}
