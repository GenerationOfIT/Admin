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
import { saveCourseLecturers } from "../actions";
import {
  emptyLecturer,
  lecturersSchema,
  type LecturersInput,
} from "../course.lecturers";

export function LecturersForm({
  id,
  values,
}: {
  id: string;
  values: LecturersInput;
}) {
  const form = useForm<LecturersInput>({
    resolver: zodResolver(lecturersSchema),
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
    name: "lecturers",
    // RHF's own key; leaves the database `id` field alone.
    keyName: "key",
  });
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);

  const onSubmit = handleSubmit(
    (input) =>
      startTransition(async () => {
        // Picked photos go to the bucket only now, right before saving.
        let prepared: { values: LecturersInput; uploaded: string[] };
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
        const result = await saveCourseLecturers(id, prepared.values);
        if (!result.ok) {
          await discardStagedUploads(prepared.uploaded);
          setStatus({ ok: false, text: result.error });
          return;
        }
        // Saved rows carry ids for newly added lecturers.
        reset(result.values);
        setStatus({ ok: true, text: "Saved." });
      }),
    () => setStatus({ ok: false, text: "Check the highlighted fields." }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <p className="text-muted text-sm">
          Shown in the course page header, in this order. Unpublished lecturers
          are hidden.
        </p>
        {fields.length === 0 && (
          <p className="text-muted text-sm">No lecturers yet.</p>
        )}
        <ol className="flex flex-col gap-4">
          {fields.map((field, index) => {
            const itemErrors = errors.lecturers?.[index];
            return (
              <li
                key={field.key}
                className="bg-surface border-border flex flex-col gap-5 rounded-2xl border p-6"
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      {...register(`lecturers.${index}.is_published`)}
                    />
                    Published
                  </label>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Move lecturer ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Move lecturer ${index + 1} down`}
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <ArrowDown size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove lecturer ${index + 1}`}
                      onClick={() => remove(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <ImageField
                  name={`lecturers.${index}.image_url`}
                  label="Photo"
                  folder="lecturers"
                  // Shown as a 44 px circle; 400 px leaves room for sharp screens.
                  recommended="400 × 400 px, square"
                  round
                  hint="Optional. Without one, the site shows a placeholder."
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Name" error={itemErrors?.name?.message}>
                    <input
                      {...register(`lecturers.${index}.name`)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Role" error={itemErrors?.role?.message}>
                    <input
                      {...register(`lecturers.${index}.role`)}
                      placeholder="Senior QA Engineer"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field
                  label="LinkedIn"
                  hint="Optional. When set, the lecturer’s card links here on the site."
                  error={itemErrors?.linkedin_url?.message}
                >
                  <input
                    {...register(`lecturers.${index}.linkedin_url`)}
                    placeholder="https://www.linkedin.com/in/name"
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Photo description"
                  hint="For screen readers. Empty uses the name."
                  error={itemErrors?.image_alt?.message}
                >
                  <input
                    {...register(`lecturers.${index}.image_alt`)}
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
          onClick={() => append(emptyLecturer)}
        >
          <Plus size={14} /> Add lecturer
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
