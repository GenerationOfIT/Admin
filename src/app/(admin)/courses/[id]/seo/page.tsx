import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadCourseSeo } from "../../course.data";
import { SeoForm } from "../../_components/SeoForm";

export default async function CourseSeoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const course = await loadCourseSeo(db, id.data);
  if (!course) notFound();
  return <SeoForm id={id.data} course={course} />;
}
