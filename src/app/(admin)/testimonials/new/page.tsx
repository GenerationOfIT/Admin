import { BackLink } from "@/components/ui/BackLink";
import { requireAdmin } from "@/lib/auth";
import { loadPlacementOptions } from "../testimonial.data";
import { emptyTestimonial } from "../testimonial.schema";
import { TestimonialForm } from "../_components/TestimonialForm";

export default async function NewTestimonialPage() {
  const db = await requireAdmin();
  const options = await loadPlacementOptions(db);
  return (
    <div className="max-w-5xl">
      <BackLink href="/testimonials">Testimonials</BackLink>
      <h1 className="mt-2 mb-6 text-2xl font-bold">New testimonial</h1>
      <TestimonialForm testimonial={emptyTestimonial} options={options} />
    </div>
  );
}
