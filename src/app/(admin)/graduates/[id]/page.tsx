import { BackLink } from "@/components/ui/BackLink";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadGraduate } from "../graduate.data";
import { GraduateForm } from "../_components/GraduateForm";

export default async function EditGraduatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const graduate = await loadGraduate(db, id.data);
  if (!graduate) notFound();
  return (
    <div className="max-w-3xl">
      <BackLink href="/graduates">Graduates</BackLink>
      <h1 className="mt-2 mb-6 text-2xl font-bold">{graduate.name}</h1>
      <GraduateForm id={id.data} graduate={graduate} />
    </div>
  );
}
