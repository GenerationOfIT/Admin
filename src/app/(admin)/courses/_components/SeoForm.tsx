"use client";

import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchResultsFields } from "@/components/forms/SearchResultsFields";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { saveCourseSeo } from "../actions";
import { seoSchema, type SeoInput } from "../course.sections";

export function SeoForm({
  id,
  course,
}: {
  id: string;
  course: {
    title: string;
    slug: string;
    introduction: string | null;
    seo_title: string | null;
    seo_description: string | null;
  };
}) {
  const form = useForm<SeoInput>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      seo_title: course.seo_title ?? "",
      seo_description: course.seo_description ?? "",
    },
  });
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);

  const onSubmit = form.handleSubmit((input) =>
    startTransition(async () => {
      const result = await saveCourseSeo(id, input);
      if (result.ok) {
        form.reset(input);
        setStatus({ ok: true, text: "Saved." });
      } else setStatus({ ok: false, text: result.error });
    }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-8">
        <SearchResultsFields
          path={`courses › ${course.slug}`}
          // Same fallbacks as the site's course page generateMetadata.
          fallbackTitle={`${course.title} | GenofIT Academy`}
          fallbackDescription={course.introduction ?? ""}
          fallbackDescriptionHint="Empty uses the introduction from Basics."
        />
        <SaveBar
          pending={pending}
          dirty={form.formState.isDirty}
          onDiscard={() => {
            form.reset();
            setStatus(null);
          }}
          status={status}
        />
      </form>
    </FormProvider>
  );
}
