import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadEventHighlights } from "../../event.data";
import { HighlightsForm } from "../../_components/HighlightsForm";

export default async function EventHighlightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const values = await loadEventHighlights(db, id.data);
  return <HighlightsForm id={id.data} values={values} />;
}
