/**
 * Placeholder shown by loading.tsx while a page renders on the server. Next
 * prefetches it with each link, so a click shows it immediately.
 */
export function PageSkeleton({ title = true }: { title?: boolean }) {
  return (
    <div className="max-w-5xl animate-pulse" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {title && <div className="bg-surface mb-6 h-8 w-48 rounded-lg" />}
      <div className="border-border divide-border divide-y rounded-xl border">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            <div className="bg-surface h-4 w-1/3 rounded" />
            <div className="bg-surface ml-auto h-4 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
