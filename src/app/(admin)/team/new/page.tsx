import { BackLink } from "@/components/ui/BackLink";
import { requireAdmin } from "@/lib/auth";
import { emptyTeamMember } from "../team.schema";
import { TeamMemberForm } from "../_components/TeamMemberForm";

export default async function NewTeamMemberPage() {
  await requireAdmin();
  return (
    <div className="max-w-3xl">
      <BackLink href="/team">Team</BackLink>
      <h1 className="mt-2 mb-6 text-2xl font-bold">New team member</h1>
      <TeamMemberForm member={emptyTeamMember} />
    </div>
  );
}
