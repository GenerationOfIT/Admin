import "server-only";
import type { requireAdmin } from "@/lib/auth";
import type { PartnerInput } from "./partner.schema";

type Db = Awaited<ReturnType<typeof requireAdmin>>;

export async function loadPartner(
  db: Db,
  id: string,
): Promise<PartnerInput | null> {
  const { data, error } = await db
    .from("partners")
    .select("name, logo_url, is_published")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, logo_url: data.logo_url ?? "" };
}
