import { requireAdmin } from "@/lib/auth";
import { NewServiceForm } from "../_components/NewServiceForm";

export default async function NewServicePage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">New service</h1>
      <p className="text-muted mb-6 text-sm">
        It starts as a draft. Add its page content and cards on the next screen,
        then publish it.
      </p>
      <NewServiceForm />
    </div>
  );
}
