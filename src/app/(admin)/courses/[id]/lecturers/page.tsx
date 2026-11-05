import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadCourseLecturers } from "../../course.data";
import { LecturersForm } from "../../_components/LecturersForm";

export default async function CourseLecturersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const values = await loadCourseLecturers(db, id.data);
  return <LecturersForm id={id.data} values={values} />;
}
