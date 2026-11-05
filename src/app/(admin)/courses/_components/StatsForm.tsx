"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, inputClass } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { saveCourseStats } from "../actions";
import { courseStats, statsSchema, type StatsInput } from "../course.sections";

export function StatsForm({
  id,
  values,
  otherLabels,
}: {
  id: string;
  values: StatsInput;
  /** Stats with labels the site never reads. */
  otherLabels: string[];
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<StatsInput>({
    resolver: zodResolver(statsSchema),
    defaultValues: values,
  });
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);

  const onSubmit = handleSubmit((input) =>
    startTransition(async () => {
      const result = await saveCourseStats(id, input);
      if (result.ok) {
        reset(input);
        setStatus({ ok: true, text: "Saved." });
      } else setStatus({ ok: false, text: result.error });
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <FormSection
        eyebrow="Course facts"
        title="Stats"
        description='Shown in the course facts and the Schedule & Pricing tab. Leave a field empty (or write "TBA") to show it as not announced yet.'
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {courseStats.map((stat) => (
            <Field
              key={stat.label}
              label={stat.label}
              hint={stat.hint}
              error={errors[stat.label]?.message}
            >
              <input
                {...register(stat.label)}
                placeholder={stat.placeholder}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
        {otherLabels.length > 0 && (
          <p className="text-muted mt-5 text-xs">
            This course also has stats the site doesn&apos;t show (
            {otherLabels.join(", ")}). They&apos;re left as they are.
          </p>
        )}
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
  );
}
