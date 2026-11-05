import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ReorderableList } from "@/components/ui/ReorderableList";
import { cn } from "@/lib/cn";
import { imagePreviewUrl } from "@/lib/imagePreview";
import { savePartnerOrder, setPartnerPublished } from "./actions";

export default async function PartnersPage() {
  const db = await requireAdmin();
  const { data: partners, error } = await db
    .from("partners")
    .select("id, name, logo_url, is_published")
    .order("sort_order")
    .order("name");
  if (error) throw error;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Partners</h1>
        <Link href="/partners/new" className={buttonVariants()}>
          New partner
        </Link>
      </div>
      <p className="text-muted mb-4 text-sm">
        Logos in the home page&apos;s &ldquo;Our Partner Companies&rdquo; strip,
        in this order. The section is hidden while none are published.
      </p>
      {partners.length === 0 ? (
        <p className="text-muted">No partners yet.</p>
      ) : (
        <ReorderableList
          save={savePartnerOrder}
          rows={partners.map((partner) => {
            const logo = imagePreviewUrl(partner.logo_url);
            return {
              id: partner.id,
              label: partner.name,
              content: (
                <>
                  <div className="bg-background border-border flex h-12 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border px-2">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                      <img
                        src={logo}
                        alt=""
                        className="max-h-8 max-w-full object-contain"
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
                    href={`/partners/${partner.id}`}
                    className="min-w-0 flex-1 font-bold hover:underline"
                  >
                    {partner.name}
                  </Link>
                  <span
                    className={cn(
                      "w-20 text-right text-sm",
                      partner.is_published ? "text-accent" : "text-muted",
                    )}
                  >
                    {partner.is_published ? "Published" : "Draft"}
                  </span>
                  {partner.is_published || partner.logo_url ? (
                    <form action={setPartnerPublished}>
                      <input type="hidden" name="id" value={partner.id} />
                      <input
                        type="hidden"
                        name="published"
                        value={String(!partner.is_published)}
                      />
                      <SubmitButton
                        variant="secondary"
                        size="sm"
                        pendingLabel={
                          partner.is_published
                            ? "Unpublishing..."
                            : "Publishing..."
                        }
                      >
                        {partner.is_published ? "Unpublish" : "Publish"}
                      </SubmitButton>
                    </form>
                  ) : (
                    // The strip shows only logos.
                    <span className="text-danger w-[5.5rem] text-center text-xs">
                      Needs a logo
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
