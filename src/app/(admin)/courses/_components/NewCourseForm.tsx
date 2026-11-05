"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, inputClass } from "@/components/ui/Field";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { SlugField } from "@/components/ui/SlugField";
import { createCourse } from "../actions";
import { newCourseSchema, type NewCourseInput } from "../course.schema";

export function NewCourseForm() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NewCourseInput>({
    resolver: zodResolver(newCourseSchema),
    defaultValues: { title: "", slug: "", card_description: "" },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      // On success the action redirects to the new course's edit page.
      const result = await createCourse(values);
      if (!result.ok) {
        setStatus({ ok: false, text: result.error });
        for (const [field, text] of Object.entries(result.fieldErrors ?? {}))
          setError(field as keyof NewCourseInput, { message: text });
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Title" error={errors.title?.message}>
        <input {...register("title")} className={inputClass} />
      </Field>
      <SlugField
        prefix="/courses/"
        registration={register("slug")}
        error={errors.slug?.message}
      />
      <Field
        label="Card description"
        hint="Shown on the home and academy course cards."
        error={errors.card_description?.message}
      >
        <textarea
          {...register("card_description")}
          rows={3}
          className={inputClass}
        />
      </Field>
      <SaveBar
        pending={pending}
        dirty={false}
        status={status}
        label="Create draft"
        cancelHref="/courses"
        allowClean
      />
    </form>
  );
}
