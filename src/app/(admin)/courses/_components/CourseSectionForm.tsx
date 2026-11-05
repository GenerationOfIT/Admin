"use client";

import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardListEditor } from "@/components/forms/CardListEditor";
import { ContentBlock } from "@/components/forms/ContentBlock";
import { HeadingInput } from "@/components/forms/HeadingInput";
import { TagListEditor } from "@/components/forms/TagListEditor";
import { Field, inputClass } from "@/components/ui/Field";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { saveCourseSection } from "../actions";
import {
  courseSections,
  sectionSchema,
  type CourseSectionKey,
  type SectionInput,
} from "../course.sections";

export function CourseSectionForm({
  id,
  sectionKey,
  values,
}: {
  id: string;
  sectionKey: CourseSectionKey;
  values: SectionInput;
}) {
  const section = courseSections[sectionKey];
  const form = useForm<SectionInput>({
    resolver: zodResolver(sectionSchema),
    defaultValues: values,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);

  const onSubmit = handleSubmit(
    (input) =>
      startTransition(async () => {
        const result = await saveCourseSection(id, sectionKey, input);
        if (!result.ok) {
          setStatus({ ok: false, text: result.error });
          return;
        }
        // Saved rows carry ids for newly added cards.
        reset(result.values);
        setStatus({ ok: true, text: "Saved." });
      }),
    () => setStatus({ ok: false, text: "Check the highlighted fields." }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-8">
        <p className="text-muted text-sm">
          The {section.label} tab shows on the course page when:{" "}
          {section.shownWhen}
        </p>
        <ContentBlock eyebrow={`${section.label} tab`}>
          {section.heading && (
            <HeadingInput name="heading" label={`${section.label} heading`} />
          )}
          {section.body && (
            <Field
              label="Text"
              hint="Separate paragraphs with a blank line."
              error={errors.body?.message}
            >
              <textarea {...register("body")} rows={6} className={inputClass} />
            </Field>
          )}
          {section.tools && (
            <TagListEditor
              name="tools"
              label="Hands-on with"
              placeholder="e.g. Jira"
            />
          )}
          <CardListEditor
            name="items"
            noun={section.noun}
            emptyText={`No ${section.noun}s yet.`}
          />
        </ContentBlock>
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
