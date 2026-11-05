import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { requireAdmin } from "@/lib/auth";
import {
  toDollars,
  type BasicsInput,
  type PricingInput,
} from "./course.schema";
import {
  courseSections,
  courseStats,
  type CourseSectionKey,
  type SectionInput,
  type StatsInput,
} from "./course.sections";
import type { LecturersInput } from "./course.lecturers";

type Db = Awaited<ReturnType<typeof requireAdmin>>;

export async function loadCourseBasics(
  db: Db,
  id: string,
): Promise<(BasicsInput & { id: string }) | null> {
  const { data, error } = await db
    .from("courses")
    .select(
      "id, title, slug, card_description, introduction, summary, audience_summary, benefits, is_published, is_popular, is_curriculum_course",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    introduction: data.introduction ?? "",
    summary: data.summary ?? "",
    audience_summary: data.audience_summary ?? "",
    benefits: data.benefits ?? "",
  };
}

// Defaults for a course that has no price row yet; saving creates one.
const newPlan = {
  amount: 0,
  manual_payments_enabled: true,
  minimum_payment: 10000,
  title: "Full Payment",
  description: "One-time payment",
  features: [] as string[],
};

export async function loadCoursePricing(
  db: Db,
  id: string,
): Promise<PricingInput | null> {
  const { data, error } = await db
    .from("courses")
    .select(
      "starts_on, enrollment_open, enrollment_opens_on, enrollment_closes_on, course_plans(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // unique (course_id) makes this embed a single object, not a list.
  const plan = data.course_plans ?? newPlan;
  return {
    starts_on: data.starts_on ?? "",
    enrollment_open: data.enrollment_open,
    enrollment_opens_on: data.enrollment_opens_on ?? "",
    enrollment_closes_on: data.enrollment_closes_on ?? "",
    amount: toDollars(plan.amount),
    manual_payments_enabled: plan.manual_payments_enabled,
    minimum_payment: toDollars(plan.minimum_payment),
    plan_title: plan.title,
    plan_description: plan.description ?? "",
    features: plan.features.map((value) => ({ value })),
  };
}

/** What blocks or follows a delete: orders block it, testimonials are unlinked. */
export async function loadCourseLinks(db: Db, id: string) {
  const [orders, testimonials] = await Promise.all([
    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("course_id", id),
    db
      .from("testimonials")
      .select("id", { count: "exact", head: true })
      .eq("course_id", id),
  ]);
  if (orders.error) throw orders.error;
  if (testimonials.error) throw testimonials.error;
  return { orders: orders.count ?? 0, testimonials: testimonials.count ?? 0 };
}

type SectionRow = Record<string, unknown> & {
  items: {
    id: string;
    title: string;
    description: string;
    sort_order: number;
  }[];
};

/** One content tab: its heading/text columns plus its card list. */
export async function loadCourseSection(
  db: Db,
  id: string,
  key: CourseSectionKey,
): Promise<SectionInput | null> {
  const section = courseSections[key];
  const columns = [
    section.heading,
    section.body,
    section.tools && "curriculum_tools",
  ]
    .filter(Boolean)
    .join(", ");
  // The column list depends on the section, which the typed client can't follow.
  const { data, error } = await (db as unknown as SupabaseClient)
    .from("courses")
    .select(`${columns ? `${columns}, ` : ""}items:${section.table}(*)`)
    .eq("id", id)
    .maybeSingle<SectionRow>();
  if (error) throw error;
  if (!data) return null;
  return {
    heading: section.heading
      ? ((data[section.heading] as string | null) ?? "")
      : "",
    body: section.body ? ((data[section.body] as string | null) ?? "") : "",
    tools: section.tools
      ? ((data.curriculum_tools as string[]) ?? []).map((value) => ({ value }))
      : [],
    items: [...data.items]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ id: itemId, title, description }) => ({
        id: itemId,
        title,
        description,
      })),
  };
}

export async function loadCourseStats(
  db: Db,
  id: string,
): Promise<{ values: StatsInput; otherLabels: string[] }> {
  const { data, error } = await db
    .from("course_stats")
    .select("label, value")
    .eq("course_id", id)
    .order("sort_order");
  if (error) throw error;
  const known = courseStats.map(({ label }) => label.toLowerCase());
  const valueOf = (label: string) =>
    data.find((row) => row.label.toLowerCase() === label.toLowerCase())
      ?.value ?? "";
  return {
    values: {
      Duration: valueOf("Duration"),
      Lectures: valueOf("Lectures"),
      Hours: valueOf("Hours"),
      Format: valueOf("Format"),
    },
    otherLabels: data
      .map((row) => row.label)
      .filter((label) => !known.includes(label.toLowerCase())),
  };
}

export async function loadCourseSeo(db: Db, id: string) {
  const { data, error } = await db
    .from("courses")
    .select("title, slug, introduction, seo_title, seo_description")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadCourseLecturers(
  db: Db,
  id: string,
): Promise<LecturersInput> {
  const { data, error } = await db
    .from("course_lecturers")
    .select("id, name, role, linkedin_url, image_url, image_alt, is_published")
    .eq("course_id", id)
    .order("sort_order");
  if (error) throw error;
  return {
    lecturers: data.map((row) => ({
      ...row,
      linkedin_url: row.linkedin_url ?? "",
      image_url: row.image_url ?? "",
      image_alt: row.image_alt ?? "",
    })),
  };
}
