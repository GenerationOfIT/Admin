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
import { SlugField } from "@/components/ui/SlugField";
import { cn } from "@/lib/cn";
import { saveEventBasics } from "../actions";
import { basicsSchema, type BasicsInput } from "../event.schema";
import { DeleteEventButton } from "./DeleteEventButton";

export function BasicsForm({
  id,
  event,
  orders,
}: {
  id: string;
  event: BasicsInput;
  orders: number;
}) {
  const form = useForm<BasicsInput>({
    resolver: zodResolver(basicsSchema),
    defaultValues: event,
  });
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    formState: { errors, isDirty },
  } = form;
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);

  const onSubmit = handleSubmit(
    (values) =>
      startTransition(async () => {
        // A picked photo goes to the bucket only now, right before saving.
        let prepared: { values: BasicsInput; uploaded: string[] };
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
        const result = await saveEventBasics(id, prepared.values);
        if (result.ok) {
          reset(prepared.values);
          setStatus({ ok: true, text: "Saved." });
          return;
        }
        await discardStagedUploads(prepared.uploaded);
        setStatus({ ok: false, text: result.error });
        for (const [field, text] of Object.entries(result.fieldErrors ?? {}))
          setError(field as keyof BasicsInput, { message: text });
      }),
    () => setStatus({ ok: false, text: "Check the highlighted fields." }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-10">
        <FormSection eyebrow="Event page and home card" title="Basics">
          <div className="flex flex-col gap-5">
            <label className="bg-background border-border flex items-center gap-3 self-start rounded-full border px-4 py-2 text-sm">
              <input type="checkbox" {...register("is_published")} />
              Published on the site
            </label>
            <Field label="Title" error={errors.title?.message}>
              <input {...register("title")} className={inputClass} />
            </Field>
            <SlugField
              prefix="/events/"
              registration={register("slug")}
              error={errors.slug?.message}
              existing
            />
            <Field
              label="Card description"
              hint="Shown on the event's card on the home page."
              error={errors.card_description?.message}
            >
              <textarea
                {...register("card_description")}
                rows={2}
                className={inputClass}
              />
            </Field>
            <Field
              label="Introduction"
              hint="The text at the top of the event page. Separate paragraphs with a blank line."
              error={errors.introduction?.message}
            >
              <textarea
                {...register("introduction")}
                rows={5}
                className={inputClass}
              />
            </Field>
            <ImageField
              name="image_url"
              label="Photo"
              folder="events"
              // Fills the full width of the event page's header.
              recommended="1920 × 1080 px, landscape"
              hint="Required to publish. Used as the event page's background and on the home card."
            />
            <Field
              label="Price (USD)"
              hint="0 means a free event; the site then says Free."
              error={errors.price?.message}
            >
              <input
                type="number"
                min={0}
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                className={cn(inputClass, "sm:w-1/3")}
              />
            </Field>
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
      <FormSection
        tone="danger"
        eyebrow="Danger zone"
        title="Delete event"
        description="Removes the event and all its content. Unpublish instead if you might want it back. Its photos stay in the image library."
        className="mt-10"
      >
        <DeleteEventButton id={id} title={event.title} orders={orders} />
      </FormSection>
    </FormProvider>
  );
}
