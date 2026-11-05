import type { UseFormRegisterReturn } from "react-hook-form";
import { Field, inputClass } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

// The fixed prefix shows that only the last part of the address is typed here.
export function SlugField({
  prefix,
  registration,
  error,
  existing,
}: {
  /** The fixed start of the address, e.g. "/services/". */
  prefix: string;
  registration: UseFormRegisterReturn<"slug">;
  error?: string;
  existing?: boolean;
}) {
  return (
    <Field
      label="Slug"
      hint={`Only the last part of the address, without slashes: lowercase letters, numbers and hyphens, e.g. manual-testing.${existing ? " Changing it breaks existing links and search results." : ""}`}
      error={error}
    >
      <span className="flex items-stretch">
        <span className="border-border bg-surface text-muted flex items-center rounded-l-lg border border-r-0 px-3">
          {prefix}
        </span>
        <input
          {...registration}
          placeholder="manual-testing"
          className={cn(inputClass, "rounded-l-none")}
        />
      </span>
    </Field>
  );
}
