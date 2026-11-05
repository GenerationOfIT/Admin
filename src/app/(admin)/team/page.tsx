import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ReorderableList } from "@/components/ui/ReorderableList";
import { cn } from "@/lib/cn";
import { imagePreviewUrl } from "@/lib/imagePreview";
import { saveTeamOrder, setTeamMemberPublished } from "./actions";

export default async function TeamPage() {
  const db = await requireAdmin();
  const { data: members, error } = await db
    .from("team_members")
    .select("id, name, role, organization, image_url, is_published")
    .order("sort_order")
    .order("name");
  if (error) throw error;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team</h1>
        <Link href="/team/new" className={buttonVariants()}>
          New team member
        </Link>
      </div>
      <p className="text-muted mb-4 text-sm">
        Shown on the About page in this order.
      </p>
      {members.length === 0 ? (
        <p className="text-muted">No team members yet.</p>
      ) : (
        <ReorderableList
          save={saveTeamOrder}
          rows={members.map((member) => {
            const photo = imagePreviewUrl(member.image_url);
            return {
              id: member.id,
              label: member.name,
              content: (
                <>
                  <div className="bg-background border-border flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                      <img
                        src={photo}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageIcon
                        size={18}
                        className="text-muted"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <Link
                    href={`/team/${member.id}`}
                    className="flex min-w-0 flex-1 flex-col hover:underline"
                  >
                    <span className="font-bold">{member.name}</span>
                    <span className="text-muted truncate text-sm">
                      {[member.role, member.organization]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Link>
                  <span
                    className={cn(
                      "w-20 text-right text-sm",
                      member.is_published ? "text-accent" : "text-muted",
                    )}
                  >
                    {member.is_published ? "Published" : "Draft"}
                  </span>
                  {member.is_published || member.image_url ? (
                    <form action={setTeamMemberPublished}>
                      <input type="hidden" name="id" value={member.id} />
                      <input
                        type="hidden"
                        name="published"
                        value={String(!member.is_published)}
                      />
                      <SubmitButton
                        variant="secondary"
                        size="sm"
                        pendingLabel={
                          member.is_published
                            ? "Unpublishing..."
                            : "Publishing..."
                        }
                      >
                        {member.is_published ? "Unpublish" : "Publish"}
                      </SubmitButton>
                    </form>
                  ) : (
                    // The About page card always shows the photo.
                    <span className="text-danger w-[5.5rem] text-center text-xs">
                      Needs a photo
                    </span>
                  )}
                </>
              ),
            };
          })}
        />
      )}
    </div>
  );
}
