import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadCourseSection } from "../../course.data";
import {
  courseSectionKeys,
  type CourseSectionKey,
} from "../../course.sections";
import { CourseSectionForm } from "../../_components/CourseSectionForm";

// Overview, curriculum, capstone and outcomes share this page and its form.
export default async function CourseSectionPage({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { id: rawId, section } = await params;
  const id = z.uuid().safeParse(rawId);
  if (!id.success || !courseSectionKeys.includes(section as CourseSectionKey))
    notFound();
  const key = section as CourseSectionKey;
  const db = await requireAdmin();
  const values = await loadCourseSection(db, id.data, key);
  if (!values) notFound();
  // key resets the form when switching between section tabs.
  return (
    <CourseSectionForm
      key={key}
      id={id.data}
      sectionKey={key}
      values={values}
    />
  );
}
