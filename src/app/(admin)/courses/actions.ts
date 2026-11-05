"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import { syncChildren } from "@/lib/children";
import { loadCourseLecturers, loadCourseSection } from "./course.data";
import { ORDER_CHANGED, orderChanges, orderIdsSchema } from "@/lib/order";
import { nullIfEmpty } from "@/lib/schema";
import {
  basicsSchema,
  newCourseSchema,
  pricingSchema,
  toCents,
} from "./course.schema";
import {
  courseSectionKeys,
  courseSections,
  courseStats,
  sectionSchema,
  seoSchema,
  statsSchema,
  type CourseSectionKey,
  type SectionInput,
} from "./course.sections";
import {
  lecturerSlugs,
  lecturersSchema,
  type LecturersInput,
} from "./course.lecturers";

export type SaveResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const SLUG_TAKEN = {
  ok: false as const,
  error: "Another course already uses this slug.",
  fieldErrors: { slug: "Already used by another course." },
};

function refresh(id?: string) {
  revalidatePath("/courses");
  if (id) revalidatePath(`/courses/${id}`, "layout");
}

export async function createCourse(input: unknown): Promise<SaveResult> {
  const db = await requireAdmin();
  const parsed = newCourseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const { data: last } = await db
    .from("courses")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await db
    .from("courses")
    .insert({
      ...parsed.data,
      // Stays hidden, with enrollment off, until it's filled in.
      is_published: false,
      enrollment_open: false,
      sort_order: (last?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();
  if (error?.code === "23505") return SLUG_TAKEN;
  if (error) throw error;
  refresh();
  redirect(`/courses/${data.id}`);
}

export async function saveCourseBasics(
  id: string,
  input: unknown,
): Promise<SaveResult> {
  const db = await requireAdmin();
  const courseId = z.uuid().parse(id);
  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const values = parsed.data;
  const { error } = await db
    .from("courses")
    .update({
      ...values,
      introduction: nullIfEmpty(values.introduction),
      summary: nullIfEmpty(values.summary),
      audience_summary: nullIfEmpty(values.audience_summary),
      benefits: nullIfEmpty(values.benefits),
    })
    .eq("id", courseId);
  if (error?.code === "23505") return SLUG_TAKEN;
  if (error) throw error;
  refresh(courseId);
  return { ok: true };
}

export async function saveCoursePricing(
  id: string,
  input: unknown,
): Promise<SaveResult> {
  const db = await requireAdmin();
  const courseId = z.uuid().parse(id);
  const parsed = pricingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const values = parsed.data;

  const { error } = await db
    .from("courses")
    .update({
      starts_on: nullIfEmpty(values.starts_on),
      enrollment_open: values.enrollment_open,
      enrollment_opens_on: nullIfEmpty(values.enrollment_opens_on),
      enrollment_closes_on: nullIfEmpty(values.enrollment_closes_on),
    })
    .eq("id", courseId);
  if (error) throw error;

  // One price row per course (unique course_id); creates it on first save.
  const { error: planError } = await db.from("course_plans").upsert(
    {
      course_id: courseId,
      amount: toCents(values.amount),
      manual_payments_enabled: values.manual_payments_enabled,
      minimum_payment: toCents(values.minimum_payment),
      title: values.plan_title,
      description: nullIfEmpty(values.plan_description),
      features: values.features.map(({ value }) => value),
    },
    { onConflict: "course_id" },
  );
  if (planError) throw planError;
  refresh(courseId);
  return { ok: true };
}

export async function deleteCourse(
  id: string,
): Promise<{ error: string } | undefined> {
  const db = await requireAdmin();
  const { error } = await db
    .from("courses")
    .delete()
    .eq("id", z.uuid().parse(id));
  // orders.course_id keeps purchase history and blocks the delete.
  if (error?.code === "23503")
    return {
      error:
        "This course has orders, so it can't be deleted. Unpublish it instead.",
    };
  if (error) throw error;
  refresh();
  redirect("/courses");
}

const toggleSchema = z.object({
  id: z.uuid(),
  published: z.enum(["true", "false"]),
});

export async function setCoursePublished(formData: FormData) {
  const db = await requireAdmin();
  const { id, published } = toggleSchema.parse(Object.fromEntries(formData));
  const { error } = await db
    .from("courses")
    .update({ is_published: published === "true" })
    .eq("id", id);
  if (error) throw error;
  refresh(id);
}

/** Saves the list's order, as set in its "Edit order" mode, in one go. */
export async function saveCourseOrder(
  ids: unknown,
): Promise<{ error: string } | undefined> {
  const db = await requireAdmin();
  const { data: rows, error } = await db
    .from("courses")
    .select("id, sort_order");
  if (error) throw error;
  const changes = orderChanges(rows, orderIdsSchema.parse(ids));
  if (!changes) return { error: ORDER_CHANGED };
  const results = await Promise.all(
    changes.map((change) =>
      db
        .from("courses")
        .update({ sort_order: change.sort_order })
        .eq("id", change.id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
  refresh();
}

const sectionKey = z.enum(
  courseSectionKeys as [CourseSectionKey, ...CourseSectionKey[]],
);

export async function saveCourseSection(
  id: string,
  key: string,
  input: unknown,
): Promise<{ ok: true; values: SectionInput } | { ok: false; error: string }> {
  const db = await requireAdmin();
  const courseId = z.uuid().parse(id);
  const parsedKey = sectionKey.parse(key);
  const section = courseSections[parsedKey];
  const parsed = sectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const saved = parsed.data;

  const columns: Database["public"]["Tables"]["courses"]["Update"] = {};
  if (section.heading) columns[section.heading] = nullIfEmpty(saved.heading);
  if (section.body) columns[section.body] = nullIfEmpty(saved.body);
  if (section.tools)
    columns.curriculum_tools = saved.tools.map(({ value }) => value);
  if (Object.keys(columns).length) {
    const { error } = await db
      .from("courses")
      .update(columns)
      .eq("id", courseId);
    if (error) throw error;
  }
  await syncChildren(
    db,
    section.table,
    { column: "course_id", id: courseId },
    saved.items,
  );
  refresh(courseId);
  // Fresh rows give new cards their ids, so the next save updates them.
  const values = await loadCourseSection(db, courseId, parsedKey);
  if (!values) return { ok: false, error: "This course no longer exists." };
  return { ok: true, values };
}

/** Saves the four stats the site reads; other labels are left alone. */
export async function saveCourseStats(
  id: string,
  input: unknown,
): Promise<SaveResult> {
  const db = await requireAdmin();
  const courseId = z.uuid().parse(id);
  const parsed = statsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const { data: rows, error } = await db
    .from("course_stats")
    .select("id, label")
    .eq("course_id", courseId);
  if (error) throw error;
  for (const [index, { label }] of courseStats.entries()) {
    const value = parsed.data[label];
    const matching = rows.filter(
      (row) => row.label.toLowerCase() === label.toLowerCase(),
    );
    const [first, ...duplicates] = matching;
    // Empty removes the stat, so the site shows "TBA" or hides it.
    const remove = value ? duplicates : matching;
    if (remove.length) {
      const { error: e } = await db
        .from("course_stats")
        .delete()
        .in(
          "id",
          remove.map((row) => row.id),
        );
      if (e) throw e;
    }
    if (!value) continue;
    const { error: e } = first
      ? await db
          .from("course_stats")
          .update({ label, value })
          .eq("id", first.id)
      : await db
          .from("course_stats")
          .insert({ course_id: courseId, label, value, sort_order: index + 1 });
    if (e) throw e;
  }
  refresh(courseId);
  return { ok: true };
}

export async function saveCourseSeo(
  id: string,
  input: unknown,
): Promise<SaveResult> {
  const db = await requireAdmin();
  const courseId = z.uuid().parse(id);
  const parsed = seoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const { error } = await db
    .from("courses")
    .update({
      seo_title: nullIfEmpty(parsed.data.seo_title),
      seo_description: nullIfEmpty(parsed.data.seo_description),
    })
    .eq("id", courseId);
  if (error) throw error;
  refresh(courseId);
  return { ok: true };
}

export async function saveCourseLecturers(
  id: string,
  input: unknown,
): Promise<
  { ok: true; values: LecturersInput } | { ok: false; error: string }
> {
  const db = await requireAdmin();
  const courseId = z.uuid().parse(id);
  const parsed = lecturersSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const { lecturers } = parsed.data;
  const { data: saved, error } = await db
    .from("course_lecturers")
    .select("id, slug")
    .eq("course_id", courseId);
  if (error) throw error;
  const slugs = lecturerSlugs(
    lecturers,
    new Map(saved.map(({ id: rowId, slug }) => [rowId, slug])),
  );
  await syncChildren(
    db,
    "course_lecturers",
    { column: "course_id", id: courseId },
    lecturers.map((lecturer, index) => ({
      ...lecturer,
      slug: slugs[index]!,
      linkedin_url: nullIfEmpty(lecturer.linkedin_url),
      image_url: nullIfEmpty(lecturer.image_url),
      image_alt: nullIfEmpty(lecturer.image_alt),
    })),
  );
  refresh(courseId);
  return { ok: true, values: await loadCourseLecturers(db, courseId) };
}
