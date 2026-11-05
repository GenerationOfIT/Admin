"use client";

import { useState, useTransition } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { ImageField } from "@/components/forms/ImageField";
import {
  discardStagedUploads,
  findStagedImages,
  uploadStagedImages,
} from "@/components/forms/stagedImages";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, inputClass } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { SaveBar } from "@/components/ui/SaveBar";
import { createTestimonial, saveTestimonial } from "../actions";
import type { PlacementOptions } from "../testimonial.data";
import {
  placementFor,
  testimonialSchema,
  type TestimonialInput,
} from "../testimonial.schema";
import { DeleteTestimonialButton } from "./DeleteTestimonialButton";
import { TestimonialPreview } from "./TestimonialPreview";

const typeLabels = {
  client: {
    title: "Client",
    hint: "A company that used a GenofIT service.",
  },
  graduate: {
    title: "Graduate",
    hint: "A student who finished a course.",
  },
};

export function TestimonialForm({
  id,
  testimonial,
  options,
}: {
  /** Missing when creating a new testimonial. */
  id?: string;
  testimonial: TestimonialInput;
  options: PlacementOptions;
}) {
  const form = useForm<TestimonialInput>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: testimonial,
  });
  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = form;
  const type = useWatch({ control, name: "type" });
  const [showOnHome, showOnAcademy, serviceSlug, courseId] = useWatch({
    control,
    name: ["show_on_home", "show_on_academy", "service_slug", "course_id"],
  });
  // Same rule as saving: placements that don't fit the type don't count.
  const placement = placementFor({
    ...testimonial,
    type,
    show_on_home: showOnHome,
    show_on_academy: showOnAcademy,
    service_slug: serviceSlug,
    course_id: courseId,
  });
  const unplaced =
    !placement.show_on_home &&
    !placement.show_on_academy &&
    !placement.service_slug &&
    !placement.course_id;
  // A staged image counts too: it lives in the form values until saved.
  const changed = isDirty;
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const onSubmit = handleSubmit(
    (values) =>
      startTransition(async () => {
        // Picked images go to the bucket only now, right before saving.
        let prepared: { values: TestimonialInput; uploaded: string[] };
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
        // createTestimonial redirects to the list on success.
        const result = id
          ? await saveTestimonial(id, prepared.values)
          : await createTestimonial(prepared.values);
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
        <FormSection eyebrow="What the card shows" title="Testimonial">
          <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="flex flex-col gap-5">
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1.5 text-sm font-bold">Type</legend>
                <div className="flex gap-3">
                  {(["client", "graduate"] as const).map((value) => (
                    <label
                      key={value}
                      className="border-border has-checked:border-accent flex flex-1 cursor-pointer flex-col rounded-xl border p-3 text-sm"
                    >
                      <span className="flex items-center gap-2 font-bold">
                        <input
                          type="radio"
                          value={value}
                          {...register("type")}
                        />
                        {typeLabels[value].title}
                      </span>
                      <span className="text-muted mt-1 text-xs">
                        {typeLabels[value].hint}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Name" error={errors.name?.message}>
                <input {...register("name")} className={inputClass} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Job title" error={errors.job_title?.message}>
                  <input
                    {...register("job_title")}
                    placeholder="CTO"
                    className={inputClass}
                  />
                </Field>
                <Field label="Company" error={errors.company?.message}>
                  <input
                    {...register("company")}
                    placeholder="CloudStack"
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field
                label="Context"
                hint="After the dot on the card, e.g. the service they used."
                error={errors.context_label?.message}
              >
                <input
                  {...register("context_label")}
                  placeholder="One-Time Product Testing"
                  className={inputClass}
                />
              </Field>
              <Field
                label="Quote"
                hint="Cards show about five lines; the full quote opens on click."
                error={errors.quote?.message}
              >
                <textarea
                  {...register("quote")}
                  rows={5}
                  className={inputClass}
                />
              </Field>
              <ImageField
                name="avatar_url"
                label="Photo"
                folder="testimonials"
                // Shown as a 40 px circle; 400 px leaves room for sharp screens.
                recommended="400 × 400 px, square"
                round
                hint="Optional. Shown as a small circle, so a square photo crops best."
              />
            </div>
            <div>
              <p className="text-muted mb-2 text-xs font-bold tracking-widest uppercase">
                Preview
              </p>
              <TestimonialPreview control={control} />
            </div>
          </div>
        </FormSection>

        <FormSection
          tone="plain"
          eyebrow="On the site"
          title="Where it appears"
          description={
            type === "client"
              ? "Clients can appear on the home page and on one service page."
              : "Graduates can appear on the home page, the academy page and one course page."
          }
        >
          <div className="border-accent bg-surface flex flex-col gap-5 rounded-r-2xl border-l-4 p-6">
            {unplaced && (
              <p className="text-danger text-sm">
                This testimonial isn&apos;t shown anywhere. Choose where it
                appears before publishing.
              </p>
            )}
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" {...register("show_on_home")} />
              Home page
            </label>
            {type === "graduate" && (
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" {...register("show_on_academy")} />
                Academy page
              </label>
            )}
            {type === "client" ? (
              <Field label="Service page">
                <select {...register("service_slug")} className={inputClass}>
                  <option value="">None</option>
                  {options.services.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Course page">
                <select {...register("course_id")} className={inputClass}>
                  <option value="">None</option>
                  {options.courses.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <div className="border-border border-t pt-5">
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" {...register("is_published")} />
                <span className="font-bold">Published</span>
              </label>
              {errors.is_published && (
                <p role="alert" className="text-danger mt-1 text-xs">
                  {errors.is_published.message}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        <SaveBar
          pending={pending}
          dirty={changed}
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
          cancelHref={id ? undefined : "/testimonials"}
        />
      </form>
      {id && (
        <FormSection
          tone="danger"
          eyebrow="Danger zone"
          title="Delete testimonial"
          description="Unpublish it instead if you might want it back."
          className="mt-10"
        >
          <DeleteTestimonialButton id={id} name={testimonial.name} />
        </FormSection>
      )}
    </FormProvider>
  );
}
