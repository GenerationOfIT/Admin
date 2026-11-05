import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadCoursePricing } from "../../course.data";
import { tbilisiToday } from "../../course.schema";
import { PricingForm } from "../../_components/PricingForm";

export default async function CoursePricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const pricing = await loadCoursePricing(db, id.data);
  if (!pricing) notFound();
  // Computed on the server so the status preview matches across renders.
  return <PricingForm id={id.data} pricing={pricing} today={tbilisiToday()} />;
}
