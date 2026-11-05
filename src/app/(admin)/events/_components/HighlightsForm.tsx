"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { saveEventHighlights } from "../actions";
import {
  highlightIcons,
  highlightsSchema,
  type HighlightsInput,
} from "../event.schema";

export function HighlightsForm({
  id,
  values,
}: {
  id: string;
  values: HighlightsInput;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<HighlightsInput>({
    resolver: zodResolver(highlightsSchema),
    defaultValues: values,
  });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "highlights",
    // RHF's own key; leaves the database `id` field alone.
    keyName: "key",
  });
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);

  const onSubmit = handleSubmit(
    (input) =>
      startTransition(async () => {
        const result = await saveEventHighlights(id, input);
        if (!result.ok) {
          setStatus({ ok: false, text: result.error });
          return;
        }
        // Saved rows carry ids for newly added highlights.
        reset(result.values);
        setStatus({ ok: true, text: "Saved." });
      }),
    () => setStatus({ ok: false, text: "Check the highlighted fields." }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <p className="text-muted text-sm">
        Short points with an icon, shown on the event page in this order, e.g.
        “6 expert speakers” or “Live workshops”.
      </p>
      {fields.length === 0 && (
        <p className="text-muted text-sm">No highlights yet.</p>
      )}
      <ol className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const itemErrors = errors.highlights?.[index];
          return (
            <li
              key={field.key}
              className="bg-surface border-border flex flex-wrap items-end gap-4 rounded-2xl border p-4"
            >
              <Field label="Icon" className="w-40">
                <select
                  {...register(`highlights.${index}.icon`)}
                  className={inputClass}
                >
                  {highlightIcons.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Text"
                error={itemErrors?.label?.message}
                className="min-w-48 flex-1"
              >
                <input
                  {...register(`highlights.${index}.label`)}
                  className={inputClass}
                />
              </Field>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Move highlight ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Move highlight ${index + 1} down`}
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove highlight ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => append({ icon: "speakers", label: "" })}
      >
        <Plus size={14} /> Add highlight
      </Button>
      <SaveBar
        pending={pending}
        dirty={isDirty}
        status={status}
        onDiscard={() => {
          reset();
          setStatus(null);
        }}
      />
    </form>
  );
}
