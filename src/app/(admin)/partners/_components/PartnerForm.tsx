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
import { createPartner, savePartner } from "../actions";
import { partnerSchema, type PartnerInput } from "../partner.schema";
import { DeletePartnerButton } from "./DeletePartnerButton";

export function PartnerForm({
  id,
  partner,
}: {
  /** Missing when creating a new partner. */
  id?: string;
  partner: PartnerInput;
}) {
  const form = useForm<PartnerInput>({
    resolver: zodResolver(partnerSchema),
    defaultValues: partner,
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
        // A picked logo goes to the bucket only now, right before saving.
        let prepared: { values: PartnerInput; uploaded: string[] };
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
        // createPartner redirects to the list on success.
        const result = id
          ? await savePartner(id, prepared.values)
          : await createPartner(prepared.values);
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
        <FormSection eyebrow="Home page logo strip" title="Partner">
          <div className="flex flex-col gap-5">
            <label className="bg-background border-border flex items-center gap-3 self-start rounded-full border px-4 py-2 text-sm">
              <input type="checkbox" {...register("is_published")} />
              Published on the home page
            </label>
            <ImageField
              name="logo_url"
              label="Logo"
              folder="partners"
              // Shown in a box about 120 × 24 px; twice that, with room for
              // wide logos, stays sharp on high-resolution screens.
              recommended="480 × 120 px, PNG or WebP with a transparent background"
              hint="Required to publish. Shown small and slightly faded, centred in its box. A JPEG can't be transparent, so it shows as a box; SVG isn't accepted, so export a PNG or WebP."
            />
            <Field
              label="Name"
              hint="Not shown on the page; screen readers announce it instead of the logo."
              error={errors.name?.message}
            >
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
          cancelHref={id ? undefined : "/partners"}
        />
      </form>
      {id && (
        <FormSection
          tone="danger"
          eyebrow="Danger zone"
          title="Delete partner"
          description="Unpublish instead if you might want them back. The logo stays in the image library."
          className="mt-10"
        >
          <DeletePartnerButton id={id} name={partner.name} />
        </FormSection>
      )}
    </FormProvider>
  );
}
