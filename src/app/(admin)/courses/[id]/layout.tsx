import { BackLink } from "@/components/ui/BackLink";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { CourseTabs } from "../_components/CourseTabs";

export default async function CourseLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const { data: course, error } = await db
    .from("courses")
    .select("title, slug, is_published")
    .eq("id", id.data)
    .maybeSingle();
  if (error) throw error;
  if (!course) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  return (
    <div className="max-w-4xl">
      <BackLink href="/courses">Courses</BackLink>
      <div className="mt-2 mb-6 flex items-center gap-4">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        {siteUrl && course.is_published && (
          <a
            href={`${siteUrl}/courses/${course.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-foreground flex items-center gap-1 text-sm"
          >
            View on site <ExternalLink size={14} />
          </a>
        )}
      </div>
      <CourseTabs id={id.data} />
      {children}
    </div>
  );
}
