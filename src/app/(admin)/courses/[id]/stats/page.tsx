import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadCourseStats } from "../../course.data";
import { StatsForm } from "../../_components/StatsForm";

export default async function CourseStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const { values, otherLabels } = await loadCourseStats(db, id.data);
  return <StatsForm id={id.data} values={values} otherLabels={otherLabels} />;
}
