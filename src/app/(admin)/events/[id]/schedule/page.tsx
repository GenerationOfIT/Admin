import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadEventSchedule } from "../../event.data";
import { ScheduleForm } from "../../_components/ScheduleForm";

export default async function EventSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const schedule = await loadEventSchedule(db, id.data);
  if (!schedule) notFound();
  return <ScheduleForm id={id.data} schedule={schedule} />;
}
