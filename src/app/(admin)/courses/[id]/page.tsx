import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadCourseBasics, loadCourseLinks } from "../course.data";
import { BasicsForm } from "../_components/BasicsForm";

export default async function CourseBasicsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const [course, links] = await Promise.all([
    loadCourseBasics(db, id.data),
    loadCourseLinks(db, id.data),
  ]);
  if (!course) notFound();
  const { id: courseId, ...values } = course;
  return <BasicsForm id={courseId} course={values} links={links} />;
}
