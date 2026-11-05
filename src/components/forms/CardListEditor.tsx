"use client";

import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { errorAt } from "./errorAt";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";

/**
 * An ordered list of title + description cards, laid out like the site's card
 * grids. Saved rows keep their database `id` as a normal field.
 */
export function CardListEditor({
  name,
  noun = "card",
  emptyText,
}: {
  name: string;
  /** "card", "part"... used in labels. */
  noun?: string;
  /** Shown when the list is empty, e.g. what that means on the site. */
  emptyText?: string;
}) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name,
    // RHF's own key; leaves our `id` field alone.
    keyName: "key",
  });
  const Noun = noun[0]!.toUpperCase() + noun.slice(1);

  return (
    <div>
      {fields.length === 0 && emptyText && (
        <p className="text-muted mb-4 px-2 text-sm">{emptyText}</p>
      )}
      <ol className="grid gap-4 md:grid-cols-2">
        {fields.map((field, index) => (
          <li
            key={field.key}
            className="bg-background border-border flex flex-col gap-3 rounded-xl border p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="bg-primary size-2 rounded-full"
                />
                {Noun} {index + 1}
              </span>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Move ${noun} ${index + 1} earlier`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowLeft size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Move ${noun} ${index + 1} later`}
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowRight size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${noun} ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            <Field
              label="Title"
              error={errorAt(errors, `${name}.${index}.title`)}
            >
              <input
                {...register(`${name}.${index}.title`)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Description"
              error={errorAt(errors, `${name}.${index}.description`)}
            >
              <textarea
                {...register(`${name}.${index}.description`)}
                rows={3}
                className={inputClass}
              />
            </Field>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => append({ title: "", description: "" })}
            className="border-border text-muted hover:border-primary hover:text-foreground flex size-full min-h-24 items-center justify-center gap-2 rounded-xl border border-dashed p-4"
          >
            <Plus size={16} /> Add {noun}
          </button>
        </li>
      </ol>
    </div>
  );
}
