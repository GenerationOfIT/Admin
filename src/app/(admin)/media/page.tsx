import { requireAdmin } from "@/lib/auth";
import { listMediaLibraryItems } from "@/lib/media";
import { MediaLibrary } from "./_components/MediaLibrary";

export default async function ImagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const [{ tab, q }, db] = await Promise.all([searchParams, requireAdmin()]);
  const items = await listMediaLibraryItems(db);

  return (
    <div className="max-w-6xl">
      <h1 className="mb-2 text-2xl font-bold">Images</h1>
      <p className="text-muted mb-6 text-sm">
        Every uploaded image, by the section that uses it. Upload several at
        once here, then pick them in a form with &ldquo;Choose existing&rdquo;.
        An image used in two sections appears in both.
      </p>
      <MediaLibrary items={items} initialTab={tab} initialQuery={q} />
    </div>
  );
}
