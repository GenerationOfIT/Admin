"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, inputClass } from "@/components/ui/Field";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { SlugField } from "@/components/ui/SlugField";
import { createEvent } from "../actions";
import { newEventSchema, type NewEventInput } from "../event.schema";
import { TimeZoneSelect } from "./TimeZoneSelect";

export function NewEventForm() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<NewEventInput>({
    resolver: zodResolver(newEventSchema),
    defaultValues: {
      title: "",
      slug: "",
      card_description: "",
      start_date: "",
      start_time: "18:00",
      timezone: "Asia/Tbilisi",
    },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      // On success the action redirects to the new event's edit page.
      const result = await createEvent(values);
      if (!result.ok) {
        setStatus({ ok: false, text: result.error });
        for (const [field, text] of Object.entries(result.fieldErrors ?? {}))
          setError(field as keyof NewEventInput, { message: text });
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Title" error={errors.title?.message}>
        <input {...register("title")} className={inputClass} />
      </Field>
      <SlugField
        prefix="/events/"
        registration={register("slug")}
        error={errors.slug?.message}
      />
      <Field
        label="Card description"
        hint="Shown on the event's card on the home page."
        error={errors.card_description?.message}
      >
        <textarea
          {...register("card_description")}
          rows={3}
          className={inputClass}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Date" error={errors.start_date?.message}>
          <input
            type="date"
            {...register("start_date")}
            className={inputClass}
          />
        </Field>
        <Field label="Starts at" error={errors.start_time?.message}>
          <input
            type="time"
            {...register("start_time")}
            className={inputClass}
          />
        </Field>
        <Field
          label="Time zone"
          hint="Where the event happens."
          error={errors.timezone?.message}
        >
          <TimeZoneSelect
            registration={register("timezone")}
            current="Asia/Tbilisi"
          />
        </Field>
      </div>
      <SaveBar
        pending={pending}
        dirty={isDirty}
        status={status}
        label="Create draft"
        cancelHref="/events"
        allowClean
      />
    </form>
  );
}
