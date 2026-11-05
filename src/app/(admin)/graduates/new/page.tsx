import { BackLink } from "@/components/ui/BackLink";
import { requireAdmin } from "@/lib/auth";
import { emptyGraduate } from "../graduate.schema";
import { GraduateForm } from "../_components/GraduateForm";

export default async function NewGraduatePage() {
  await requireAdmin();
  return (
    <div className="max-w-3xl">
      <BackLink href="/graduates">Graduates</BackLink>
      <h1 className="mt-2 mb-6 text-2xl font-bold">New graduate</h1>
      <GraduateForm graduate={emptyGraduate} />
    </div>
  );
}
