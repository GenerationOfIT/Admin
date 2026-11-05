"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageField } from "@/components/forms/ImageField";
import {
  discardStagedUploads,
  findStagedImages,
  uploadStagedImages,
} from "@/components/forms/stagedImages";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { saveEventSpeakers } from "../actions";
import { speakersSchema, type SpeakersInput } from "../event.schema";

const emptySpeaker = { name: "", job_title: "", company: "", photo_url: "" };

export function SpeakersForm({
  id,
  values,
}: {
  id: string;
  values: SpeakersInput;
}) {
  const form = useForm<SpeakersInput>({
    resolver: zodResolver(speakersSchema),
    defaultValues: values,
  });
  const {
    control,
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = form;
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "speakers",
    // RHF's own key; leaves the database `id` field alone.
    keyName: "key",
  });
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);

  const onSubmit = handleSubmit(
    (input) =>
      startTransition(async () => {
        // Picked photos go to the bucket only now, right before saving.
        let prepared: { values: SpeakersInput; uploaded: string[] };
        try {
          prepared = await uploadStagedImages(
            findStagedImages(getValues()),
            input,
          );
        } catch (cause) {
          setStatus({
            ok: false,
            text: cause instanceof Error ? cause.message : "Upload failed.",
          });
          return;
        }
        const result = await saveEventSpeakers(id, prepared.values);
        if (!result.ok) {
          await discardStagedUploads(prepared.uploaded);
          setStatus({ ok: false, text: result.error });
          return;
        }
        // Saved rows carry ids for newly added speakers.
        reset(result.values);
        setStatus({ ok: true, text: "Saved." });
      }),
    () => setStatus({ ok: false, text: "Check the highlighted fields." }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <p className="text-muted text-sm">
          Shown on the event page in this order. Speakers belong to this event
          only, so their role stays as it was at the time.
        </p>
        {fields.length === 0 && (
          <p className="text-muted text-sm">No speakers yet.</p>
        )}
        <ol className="flex flex-col gap-4">
          {fields.map((field, index) => {
            const itemErrors = errors.speakers?.[index];
            return (
              <li
                key={field.key}
                className="bg-surface border-border flex flex-col gap-5 rounded-2xl border p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted text-sm">
                    Speaker {index + 1}
                  </span>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Move speaker ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Move speaker ${index + 1} down`}
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <ArrowDown size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove speaker ${index + 1}`}
                      onClick={() => remove(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <ImageField
                  name={`speakers.${index}.photo_url`}
                  label="Photo"
                  folder="events"
                  // A card about a quarter of the page wide on desktop.
                  recommended="600 × 600 px, square"
                  hint="Optional. Its description on the site is “Portrait of <name>”."
                />
                <Field label="Name" error={itemErrors?.name?.message}>
                  <input
                    {...register(`speakers.${index}.name`)}
                    className={inputClass}
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Job title"
                    hint="Optional."
                    error={itemErrors?.job_title?.message}
                  >
                    <input
                      {...register(`speakers.${index}.job_title`)}
                      placeholder="Head of QA"
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    label="Company"
                    hint="Optional."
                    error={itemErrors?.company?.message}
                  >
                    <input
                      {...register(`speakers.${index}.company`)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </li>
            );
          })}
        </ol>
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => append(emptySpeaker)}
        >
          <Plus size={14} /> Add speaker
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
    </FormProvider>
  );
}
