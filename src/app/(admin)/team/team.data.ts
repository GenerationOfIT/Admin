import "server-only";
import type { requireAdmin } from "@/lib/auth";
import type { TeamMemberInput } from "./team.schema";

type Db = Awaited<ReturnType<typeof requireAdmin>>;

export async function loadTeamMember(
  db: Db,
  id: string,
): Promise<TeamMemberInput | null> {
  const { data, error } = await db
    .from("team_members")
    .select("name, role, organization, image_url, is_published")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    organization: data.organization ?? "",
    image_url: data.image_url ?? "",
  };
}
