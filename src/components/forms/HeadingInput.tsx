"use client";

import { useFormContext } from "react-hook-form";
import { errorAt } from "./errorAt";
import { inputClass } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

/** A section heading, edited at heading size so it reads like the page. */
export function HeadingInput({
  name,
  label,
  placeholder = "Section heading",
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errorAt(errors, name);
  return (
    <div>
      <input
        {...register(name)}
        aria-label={label}
        placeholder={placeholder}
        className={cn(
          inputClass,
          "hover:border-border border-transparent bg-transparent px-2 text-2xl font-bold",
        )}
      />
      {error && (
        <p role="alert" className="text-danger mt-1 px-2 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
