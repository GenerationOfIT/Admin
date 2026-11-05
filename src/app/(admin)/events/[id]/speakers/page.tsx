import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadEventSpeakers } from "../../event.data";
import { SpeakersForm } from "../../_components/SpeakersForm";

export default async function EventSpeakersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const values = await loadEventSpeakers(db, id.data);
  return <SpeakersForm id={id.data} values={values} />;
}
