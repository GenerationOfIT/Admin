import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ReorderableList } from "@/components/ui/ReorderableList";
import { cn } from "@/lib/cn";
import { imagePreviewUrl } from "@/lib/imagePreview";
import { saveGraduateOrder, setGraduatePublished } from "./actions";

export default async function GraduatesPage() {
  const db = await requireAdmin();
  const { data: graduates, error } = await db
    .from("graduates")
    .select("id, name, title, image_url, is_published")
    .order("sort_order")
    .order("name");
  if (error) throw error;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Graduates</h1>
        <Link href="/graduates/new" className={buttonVariants()}>
          New graduate
        </Link>
      </div>
      <p className="text-muted mb-4 text-sm">
        The photo carousel on the Graduates and About pages, in this order. The
        About page hides its section while none are published.
      </p>
      {graduates.length === 0 ? (
        <p className="text-muted">No graduates yet.</p>
      ) : (
        <ReorderableList
          save={saveGraduateOrder}
          rows={graduates.map((graduate) => {
            const photo = imagePreviewUrl(graduate.image_url);
            return {
              id: graduate.id,
              label: graduate.name,
              content: (
                <>
                  <div className="bg-background border-border flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
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
                    href={`/graduates/${graduate.id}`}
                    className="flex min-w-0 flex-1 flex-col hover:underline"
                  >
                    <span className="font-bold">{graduate.name}</span>
                    <span className="text-muted text-sm">{graduate.title}</span>
                  </Link>
                  <span
                    className={cn(
                      "w-20 text-right text-sm",
                      graduate.is_published ? "text-accent" : "text-muted",
                    )}
                  >
                    {graduate.is_published ? "Published" : "Draft"}
                  </span>
                  {graduate.is_published || graduate.image_url ? (
                    <form action={setGraduatePublished}>
                      <input type="hidden" name="id" value={graduate.id} />
                      <input
                        type="hidden"
                        name="published"
                        value={String(!graduate.is_published)}
                      />
                      <SubmitButton
                        variant="secondary"
                        size="sm"
                        pendingLabel={
                          graduate.is_published
                            ? "Unpublishing..."
                            : "Publishing..."
                        }
                      >
                        {graduate.is_published ? "Unpublish" : "Publish"}
                      </SubmitButton>
                    </form>
                  ) : (
                    // Every carousel card is a photo.
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
