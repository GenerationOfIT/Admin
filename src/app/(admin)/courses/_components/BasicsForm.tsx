"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, inputClass } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { SlugField } from "@/components/ui/SlugField";
import { saveCourseBasics } from "../actions";
import { basicsSchema, type BasicsInput } from "../course.schema";
import { DeleteCourseButton } from "./DeleteCourseButton";
import { fixedTitleMentions } from "../course.mentions";

export function BasicsForm({
  id,
  course,
  links,
}: {
  id: string;
  course: BasicsInput;
  links: { orders: number; testimonials: number };
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<BasicsInput>({
    resolver: zodResolver(basicsSchema),
    defaultValues: course,
  });
  // By the saved slug, so the note doesn't flicker while the slug is edited.
  const mentions = fixedTitleMentions[course.slug];
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);

  const onSubmit = handleSubmit(
    (values) =>
      startTransition(async () => {
        const result = await saveCourseBasics(id, values);
        if (result.ok) {
          reset(values);
          setStatus({ ok: true, text: "Saved." });
          return;
        }
        setStatus({ ok: false, text: result.error });
        for (const [field, text] of Object.entries(result.fieldErrors ?? {}))
          setError(field as keyof BasicsInput, { message: text });
      }),
    () => setStatus({ ok: false, text: "Check the highlighted fields." }),
  );

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col gap-10">
        <FormSection eyebrow="Course page and cards" title="Basics">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-3">
              {(
                [
                  ["is_published", "Published on the site"],
                  ["is_popular", 'Show the "Popular" badge'],
                ] as const
              ).map(([name, label]) => (
                <label
                  key={name}
                  className="bg-background border-border flex items-center gap-3 rounded-full border px-4 py-2 text-sm"
                >
                  <input type="checkbox" {...register(name)} />
                  {label}
                </label>
              ))}
            </div>
            <Field label="Title" error={errors.title?.message}>
              <input {...register("title")} className={inputClass} />
            </Field>
            {mentions && (
              <div className="border-danger rounded-lg border p-3 text-sm">
                <p className="text-danger font-bold">
                  Careful when renaming this course
                </p>
                <p className="text-muted mt-1">
                  The site also writes “{course.title}” as fixed text in:
                </p>
                <ul className="text-muted mt-1 list-disc pl-5">
                  {mentions.map((place) => (
                    <li key={place}>{place}</li>
                  ))}
                </ul>
                <p className="text-muted mt-1">
                  Those don&apos;t change with this field; a developer has to
                  update them in the site&apos;s code.
                </p>
              </div>
            )}
            <SlugField
              prefix="/courses/"
              registration={register("slug")}
              error={errors.slug?.message}
              existing
            />
            <Field
              label="Card description"
              hint="Shown on the home and academy course cards."
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
              hint="The text under the title on the course page."
              error={errors.introduction?.message}
            >
              <textarea
                {...register("introduction")}
                rows={4}
                className={inputClass}
              />
            </Field>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                {...register("is_curriculum_course")}
                className="mt-1"
              />
              <span>
                <span className="font-bold">
                  Real course (shown to Google as a course)
                </span>
                <span className="text-muted block text-xs">
                  Leave on for courses with lessons or modules. Turn off for
                  programs that aren&apos;t a course.
                </span>
              </span>
            </label>
          </div>
        </FormSection>

        <FormSection
          tone="plain"
          eyebrow="Academy page"
          title="Academy card"
          description="The extra text on this course's card on the academy page."
        >
          <div className="border-accent bg-surface flex flex-col gap-5 rounded-r-2xl border-l-4 p-6">
            <Field
              label="Summary"
              hint="Under the card's title."
              error={errors.summary?.message}
            >
              <textarea
                {...register("summary")}
                rows={2}
                className={inputClass}
              />
            </Field>
            <Field
              label="Who is this for"
              error={errors.audience_summary?.message}
            >
              <textarea
                {...register("audience_summary")}
                rows={2}
                className={inputClass}
              />
            </Field>
            <Field
              label="Why choose this course"
              error={errors.benefits?.message}
            >
              <textarea
                {...register("benefits")}
                rows={2}
                className={inputClass}
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
        title="Delete course"
        description="Removes the course and all its content. Unpublish instead if you might want it back."
        className="mt-10"
      >
        <DeleteCourseButton id={id} title={course.title} links={links} />
      </FormSection>
    </>
  );
}
