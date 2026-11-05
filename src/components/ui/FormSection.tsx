import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// Each kind of form group gets its own look, so admins can tell site content,
// search metadata and destructive actions apart at a glance.
const sectionVariants = cva("scroll-mt-6 rounded-2xl", {
  variants: {
    tone: {
      panel: "bg-surface border-border border p-6",
      plain: "",
      light: "bg-foreground text-ink p-6",
      danger: "border-danger border p-6",
    },
  },
  defaultVariants: { tone: "panel" },
});

export function FormSection({
  id,
  eyebrow,
  title,
  description,
  tone,
  className,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
} & VariantProps<typeof sectionVariants>) {
  const muted = tone === "light" ? "text-ink/70" : "text-muted";
  return (
    <section
      id={id}
      aria-labelledby={id && `${id}-title`}
      className={cn(sectionVariants({ tone }), className)}
    >
      <header className="mb-5">
        {eyebrow && (
          <p
            className={cn(
              "mb-1 text-xs font-bold tracking-widest uppercase",
              tone === "danger" ? "text-danger" : muted,
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2 id={id && `${id}-title`} className="text-xl font-bold">
          {title}
        </h2>
        {description && (
          <p className={cn("mt-1 text-sm", muted)}>{description}</p>
        )}
      </header>
      {children}
    </section>
  );
}
