import { cn } from "@/lib/cn";

/**
 * A block of public page content (heading, text, cards). The lime stripe sets
 * it apart from settings and search metadata.
 */
export function ContentBlock({
  eyebrow,
  className,
  children,
}: {
  eyebrow: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-accent bg-surface flex flex-col gap-5 rounded-r-2xl border-l-4 p-6",
        className,
      )}
    >
      <p className="text-accent text-xs font-bold tracking-widest uppercase">
        {eyebrow}
      </p>
      {children}
    </div>
  );
}
