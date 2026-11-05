import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ReorderableList } from "@/components/ui/ReorderableList";
import { cn } from "@/lib/cn";
import { saveCourseOrder, setCoursePublished } from "./actions";
import { enrollmentStatus, tbilisiToday } from "./course.schema";
import { EnrollmentBadge } from "./_components/EnrollmentBadge";

export default async function CoursesPage() {
  const db = await requireAdmin();
  const { data: courses, error } = await db
    .from("courses")
    .select(
      "id, title, slug, is_published, is_popular, enrollment_open, enrollment_opens_on, enrollment_closes_on",
    )
    .order("sort_order")
    .order("title");
  if (error) throw error;
  const today = tbilisiToday();

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Link href="/courses/new" className={buttonVariants()}>
          New course
        </Link>
      </div>
      <p className="text-muted mb-4 text-sm">
        The order here is the order on the home and academy pages.
      </p>
      <ReorderableList
        save={saveCourseOrder}
        rows={courses.map((course) => ({
          id: course.id,
          label: course.title,
          content: (
            <>
              <Link
                href={`/courses/${course.id}`}
                className="flex min-w-0 flex-1 flex-col hover:underline"
              >
                <span className="font-bold">
                  {course.title}
                  {course.is_popular && (
                    <span className="text-accent ml-2 text-xs font-normal">
                      Popular
                    </span>
                  )}
                </span>
                <span className="text-muted text-sm">
                  /courses/{course.slug}
                </span>
              </Link>
              <EnrollmentBadge
                status={enrollmentStatus(
                  {
                    enrollment_open: course.enrollment_open,
                    enrollment_opens_on: course.enrollment_opens_on ?? "",
                    enrollment_closes_on: course.enrollment_closes_on ?? "",
                  },
                  today,
                )}
              />
              <span
                className={cn(
                  "w-20 text-right text-sm",
                  course.is_published ? "text-accent" : "text-muted",
                )}
              >
                {course.is_published ? "Published" : "Draft"}
              </span>
              <form action={setCoursePublished}>
                <input type="hidden" name="id" value={course.id} />
                <input
                  type="hidden"
                  name="published"
                  value={String(!course.is_published)}
                />
                <SubmitButton
                  variant="secondary"
                  size="sm"
                  pendingLabel={
                    course.is_published ? "Unpublishing..." : "Publishing..."
                  }
                >
                  {course.is_published ? "Unpublish" : "Publish"}
                </SubmitButton>
              </form>
            </>
          ),
        }))}
      />
    </div>
  );
}
