import { BackLink } from "@/components/ui/BackLink";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadPartner } from "../partner.data";
import { PartnerForm } from "../_components/PartnerForm";

export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const partner = await loadPartner(db, id.data);
  if (!partner) notFound();
  return (
    <div className="max-w-3xl">
      <BackLink href="/partners">Partners</BackLink>
      <h1 className="mt-2 mb-6 text-2xl font-bold">{partner.name}</h1>
      <PartnerForm id={id.data} partner={partner} />
    </div>
  );
}
