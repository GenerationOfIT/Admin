"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { saveEventAgenda } from "../actions";
import { agendaSchema, type AgendaInput } from "../event.schema";

export function AgendaForm({
  id,
  values,
  startDate,
  timezone,
}: {
  id: string;
  values: AgendaInput;
  startDate: string;
  timezone: string;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AgendaInput>({
    resolver: zodResolver(agendaSchema),
    defaultValues: values,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
    // RHF's own key; leaves the database `id` field alone.
    keyName: "key",
  });
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);

  const onSubmit = handleSubmit(
    (input) =>
      startTransition(async () => {
        const result = await saveEventAgenda(id, input);
        if (!result.ok) {
          setStatus({ ok: false, text: result.error });
          return;
        }
        // Back in time order, with ids for new items.
        reset(result.values);
        setStatus({ ok: true, text: "Saved." });
      }),
    () => setStatus({ ok: false, text: "Check the highlighted fields." }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <FormSection
        eyebrow="Event page"
        title="Agenda"
        description={`Times of day on the event's date (${startDate}, ${timezone.replace(/_/g, " ")}). The site lists items by time, so their order here doesn't matter; it's sorted again when you save.`}
      >
        <div className="flex flex-col gap-5">
          <Field label="Section title" error={errors.agenda_title?.message}>
            <input {...register("agenda_title")} className={inputClass} />
          </Field>
          {fields.length === 0 && (
            <p className="text-muted text-sm">No agenda items yet.</p>
          )}
          <ol className="flex flex-col gap-3">
            {fields.map((field, index) => {
              const itemErrors = errors.items?.[index];
              return (
                <li
                  key={field.key}
                  className="bg-background border-border flex flex-col gap-4 rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-end gap-4">
                    <Field
                      label="Time"
                      error={itemErrors?.time?.message}
                      className="w-32"
                    >
                      <input
                        type="time"
                        {...register(`items.${index}.time`)}
                        className={inputClass}
                      />
                    </Field>
                    <Field
                      label="Title"
                      error={itemErrors?.title?.message}
                      className="min-w-48 flex-1"
                    >
                      <input
                        {...register(`items.${index}.title`)}
                        className={inputClass}
                      />
                    </Field>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove agenda item ${index + 1}`}
                      onClick={() => remove(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <Field
                    label="Description"
                    hint="Optional."
                    error={itemErrors?.description?.message}
                  >
                    <textarea
                      {...register(`items.${index}.description`)}
                      rows={2}
                      className={inputClass}
                    />
                  </Field>
                </li>
              );
            })}
          </ol>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => append({ time: "", title: "", description: "" })}
          >
            <Plus size={14} /> Add agenda item
          </Button>
        </div>
      </FormSection>
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
