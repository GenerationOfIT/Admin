import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadEventAgenda } from "../../event.data";
import { AgendaForm } from "../../_components/AgendaForm";

export default async function EventAgendaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const loaded = await loadEventAgenda(db, id.data);
  if (!loaded) notFound();
  const { startDate, timezone, ...values } = loaded;
  return (
    <AgendaForm
      id={id.data}
      values={values}
      startDate={startDate}
      timezone={timezone}
    />
  );
}
