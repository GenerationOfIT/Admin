"use client";

import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageField } from "@/components/forms/ImageField";
import {
  discardStagedUploads,
  findStagedImages,
  uploadStagedImages,
} from "@/components/forms/stagedImages";
import { Field, inputClass } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { createGraduate, saveGraduate } from "../actions";
import { graduateSchema, type GraduateInput } from "../graduate.schema";
import { DeleteGraduateButton } from "./DeleteGraduateButton";

export function GraduateForm({
  id,
  graduate,
}: {
  /** Missing when creating a new graduate. */
  id?: string;
  graduate: GraduateInput;
}) {
  const form = useForm<GraduateInput>({
    resolver: zodResolver(graduateSchema),
    defaultValues: graduate,
  });
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = form;
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);

  const onSubmit = handleSubmit(
    (values) =>
      startTransition(async () => {
        // A picked photo goes to the bucket only now, right before saving.
        let prepared: { values: GraduateInput; uploaded: string[] };
        try {
          prepared = await uploadStagedImages(
            findStagedImages(getValues()),
            values,
          );
        } catch (cause) {
          setStatus({
            ok: false,
            text: cause instanceof Error ? cause.message : "Upload failed.",
          });
          return;
        }
        // createGraduate redirects to the list on success.
        const result = id
          ? await saveGraduate(id, prepared.values)
          : await createGraduate(prepared.values);
        if (result.ok) {
          reset(prepared.values);
          setStatus({ ok: true, text: "Saved." });
        } else {
          await discardStagedUploads(prepared.uploaded);
          setStatus({ ok: false, text: result.error });
        }
      }),
    () => setStatus({ ok: false, text: "Check the highlighted fields." }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-10">
        <FormSection eyebrow="Graduates and About pages" title="Graduate">
          <div className="flex flex-col gap-5">
            <label className="bg-background border-border flex items-center gap-3 self-start rounded-full border px-4 py-2 text-sm">
              <input type="checkbox" {...register("is_published")} />
              Published on the site
            </label>
            <ImageField
              name="image_url"
              label="Photo"
              folder="graduates"
              // A 230 × 300 px portrait card; about twice that stays sharp on
              // high-resolution screens.
              recommended="600 × 780 px, portrait"
              hint="Required to publish. Cropped to fill the card, so keep the face near the middle. Its description on the site is “<name>, GenofIT graduate”."
            />
            <Field
              label="Title line"
              hint="Shown above the name, e.g. the course they took or their job: “API & Performance Testing”, “QA Engineer at TBC Bank”."
              error={errors.title?.message}
            >
              <input {...register("title")} className={inputClass} />
            </Field>
            <Field label="Name" error={errors.name?.message}>
              <input {...register("name")} className={inputClass} />
            </Field>
          </div>
        </FormSection>
        <SaveBar
          pending={pending}
          dirty={isDirty}
          status={status}
          label={id ? "Save" : "Create"}
          allowClean={!id}
          onDiscard={
            id
              ? () => {
                  reset();
                  setStatus(null);
                }
              : undefined
          }
          cancelHref={id ? undefined : "/graduates"}
        />
      </form>
      {id && (
        <FormSection
          tone="danger"
          eyebrow="Danger zone"
          title="Delete graduate"
          description="Unpublish instead if you might want them back. The photo stays in the image library."
          className="mt-10"
        >
          <DeleteGraduateButton id={id} name={graduate.name} />
        </FormSection>
      )}
    </FormProvider>
  );
}
