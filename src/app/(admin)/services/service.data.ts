import "server-only";
import type { requireAdmin } from "@/lib/auth";
import type { ServiceInput } from "./service.schema";

type Db = Awaited<ReturnType<typeof requireAdmin>>;

const byOrder = <T extends { sort_order: number }>(rows: T[]) =>
  [...rows].sort((a, b) => a.sort_order - b.sort_order);
const toCards = (
  rows: {
    id: string;
    title: string;
    description: string;
    sort_order: number;
  }[],
) =>
  byOrder(rows).map(({ id, title, description }) => ({
    id,
    title,
    description,
  }));

/** A service and its card lists, shaped like the edit form. */
export async function loadService(
  db: Db,
  id: string,
): Promise<ServiceInput | null> {
  const { data, error } = await db
    .from("services")
    .select(
      "*, service_scope_items(*), service_use_cases(*), service_deliverables(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    title: data.title,
    slug: data.slug,
    card_description: data.card_description,
    introduction: data.introduction ?? "",
    scope_title: data.scope_title,
    use_cases_title: data.use_cases_title,
    deliverables_title: data.deliverables_title,
    seo_title: data.seo_title ?? "",
    seo_description: data.seo_description ?? "",
    is_published: data.is_published,
    scope: toCards(data.service_scope_items),
    use_cases: toCards(data.service_use_cases),
    deliverables: toCards(data.service_deliverables),
  };
}
