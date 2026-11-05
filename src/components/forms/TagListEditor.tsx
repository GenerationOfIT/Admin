"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { errorAt } from "./errorAt";
import { inputClass } from "@/components/ui/Field";

/** Short labels shown as chips, e.g. tools. Stored as { value } items. */
export function TagListEditor({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const [draft, setDraft] = useState("");
  const error = errorAt(errors, name);

  function add() {
    const value = draft.trim();
    if (!value) return;
    const taken = fields.some(
      (field) =>
        (field as unknown as { value: string }).value.toLowerCase() ===
        value.toLowerCase(),
    );
    if (!taken) append({ value });
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-bold">{label}</span>
      <ul className="flex flex-wrap gap-2">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="border-border flex items-center gap-1 rounded-md border py-1 pr-1 pl-3"
          >
            {(field as unknown as { value: string }).value}
            <button
              type="button"
              aria-label={`Remove ${(field as unknown as { value: string }).value}`}
              onClick={() => remove(index)}
              className="text-muted hover:text-foreground p-0.5"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          // Enter adds a tag instead of submitting the form.
          if (event.key === "Enter") {
            event.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder}
        aria-label={`Add to ${label}`}
        className={inputClass}
      />
      <span className="text-muted text-xs">Press Enter to add.</span>
      {error && (
        <span role="alert" className="text-danger text-xs">
          {error}
        </span>
      )}
    </div>
  );
}
