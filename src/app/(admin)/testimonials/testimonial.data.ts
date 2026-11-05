import "server-only";
import type { requireAdmin } from "@/lib/auth";
import type { TestimonialInput, TestimonialType } from "./testimonial.schema";

type Db = Awaited<ReturnType<typeof requireAdmin>>;

export async function loadTestimonial(
  db: Db,
  id: string,
): Promise<TestimonialInput | null> {
  const { data, error } = await db
    .from("testimonials")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    type: data.type as TestimonialType,
    name: data.name,
    job_title: data.job_title ?? "",
    company: data.company ?? "",
    context_label: data.context_label ?? "",
    quote: data.quote,
    avatar_url: data.avatar_url ?? "",
    show_on_home: data.show_on_home,
    show_on_academy: data.show_on_academy,
    service_slug: data.service_slug ?? "",
    course_id: data.course_id ?? "",
    is_published: data.is_published,
  };
}

/** Choices for the service and course pickers, drafts included. */
export async function loadPlacementOptions(db: Db) {
  const [services, courses] = await Promise.all([
    db.from("services").select("slug, title, is_published").order("sort_order"),
    db.from("courses").select("id, title, is_published").order("sort_order"),
  ]);
  if (services.error) throw services.error;
  if (courses.error) throw courses.error;
  return {
    services: services.data.map((s) => ({
      value: s.slug,
      label: s.is_published ? s.title : `${s.title} (draft)`,
    })),
    courses: courses.data.map((c) => ({
      value: c.id,
      label: c.is_published ? c.title : `${c.title} (draft)`,
    })),
  };
}
export type PlacementOptions = Awaited<ReturnType<typeof loadPlacementOptions>>;
