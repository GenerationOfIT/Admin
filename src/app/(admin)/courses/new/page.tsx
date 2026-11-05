import { BackLink } from "@/components/ui/BackLink";
import { requireAdmin } from "@/lib/auth";
import { NewCourseForm } from "../_components/NewCourseForm";

export default async function NewCoursePage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl">
      <BackLink href="/courses">Courses</BackLink>
      <h1 className="mt-2 mb-2 text-2xl font-bold">New course</h1>
      <p className="text-muted mb-6 text-sm">
        It starts as a draft with enrollment off. Fill in its content and price
        on the next screens, then publish it.
      </p>
      <NewCourseForm />
    </div>
  );
}
