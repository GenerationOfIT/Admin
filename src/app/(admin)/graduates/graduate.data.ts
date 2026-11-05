import "server-only";
import type { requireAdmin } from "@/lib/auth";
import type { GraduateInput } from "./graduate.schema";

type Db = Awaited<ReturnType<typeof requireAdmin>>;

export async function loadGraduate(
  db: Db,
  id: string,
): Promise<GraduateInput | null> {
  const { data, error } = await db
    .from("graduates")
    .select("name, title, image_url, is_published")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, image_url: data.image_url ?? "" };
}
