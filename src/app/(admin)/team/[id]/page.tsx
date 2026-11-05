import { BackLink } from "@/components/ui/BackLink";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { loadTeamMember } from "../team.data";
import { TeamMemberForm } from "../_components/TeamMemberForm";

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const member = await loadTeamMember(db, id.data);
  if (!member) notFound();
  return (
    <div className="max-w-3xl">
      <BackLink href="/team">Team</BackLink>
      <h1 className="mt-2 mb-6 text-2xl font-bold">{member.name}</h1>
      <TeamMemberForm id={id.data} member={member} />
    </div>
  );
}
