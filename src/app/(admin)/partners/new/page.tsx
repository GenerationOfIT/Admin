import { BackLink } from "@/components/ui/BackLink";
import { requireAdmin } from "@/lib/auth";
import { emptyPartner } from "../partner.schema";
import { PartnerForm } from "../_components/PartnerForm";

export default async function NewPartnerPage() {
  await requireAdmin();
  return (
    <div className="max-w-3xl">
      <BackLink href="/partners">Partners</BackLink>
      <h1 className="mt-2 mb-6 text-2xl font-bold">New partner</h1>
      <PartnerForm partner={emptyPartner} />
    </div>
  );
}
