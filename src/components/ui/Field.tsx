import { cn } from "@/lib/cn";

export const inputClass =
  "border-border bg-background focus:border-primary w-full rounded-lg border px-3 py-2 outline-none";

export function Field({
  label,
  hint,
  error,
  light,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  /** Darker hint and error text for fields on a light panel. */
  light?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-bold">{label}</span>
      {children}
      {hint && (
        <span className={cn("text-xs", light ? "text-ink/70" : "text-muted")}>
          {hint}
        </span>
      )}
      {error && (
        <span
          role="alert"
          className={cn("text-xs", light ? "text-red-700" : "text-danger")}
        >
          {error}
        </span>
      )}
    </label>
  );
}
