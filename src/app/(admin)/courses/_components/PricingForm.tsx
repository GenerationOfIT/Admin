"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { cn } from "@/lib/cn";
import { saveCoursePricing } from "../actions";
import {
  enrollmentStatus,
  pricingSchema,
  type PricingInput,
} from "../course.schema";
import { EnrollmentBadge, enrollmentText } from "./EnrollmentBadge";

function DollarInput(props: React.ComponentProps<"input">) {
  return (
    <span className="flex items-stretch">
      <span className="border-border bg-surface text-muted flex items-center rounded-l-lg border border-r-0 px-3">
        $
      </span>
      <input
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        {...props}
        className={cn(inputClass, "rounded-l-none")}
      />
    </span>
  );
}

export function PricingForm({
  id,
  pricing,
  today,
}: {
  id: string;
  pricing: PricingInput;
  /** Tbilisi calendar day, YYYY-MM-DD. */
  today: string;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PricingInput>({
    resolver: zodResolver(pricingSchema),
    defaultValues: pricing,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "features",
  });
  const [open, opensOn, closesOn, manual] = useWatch({
    control,
    name: [
      "enrollment_open",
      "enrollment_opens_on",
      "enrollment_closes_on",
      "manual_payments_enabled",
    ],
  });
  const status = enrollmentStatus(
    {
      enrollment_open: open,
      enrollment_opens_on: opensOn,
      enrollment_closes_on: closesOn,
    },
    today,
  );
  const [pending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);

  const onSubmit = handleSubmit(
    (values) =>
      startTransition(async () => {
        const result = await saveCoursePricing(id, values);
        if (result.ok) {
          reset(values);
          setSaveStatus({ ok: true, text: "Saved." });
        } else setSaveStatus({ ok: false, text: result.error });
      }),
    () => setSaveStatus({ ok: false, text: "Check the highlighted fields." }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <FormSection
        eyebrow="Who can enroll, and when"
        title="Schedule"
        description="Dates are Tbilisi calendar days, the same as checkout."
      >
        <div className="flex flex-col gap-5">
          <div className="bg-background border-border flex flex-wrap items-center gap-3 rounded-xl border p-4 text-sm">
            <span className="text-muted">Today ({today}):</span>
            <EnrollmentBadge status={status} />
            <span>{enrollmentText[status].detail}</span>
          </div>
          <label className="bg-background border-border flex items-center gap-3 self-start rounded-full border px-4 py-2 text-sm">
            <input type="checkbox" {...register("enrollment_open")} />
            Enrollment switched on
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Enrollment opens"
              error={errors.enrollment_opens_on?.message}
            >
              <input
                type="date"
                {...register("enrollment_opens_on")}
                className={inputClass}
              />
            </Field>
            <Field
              label="Enrollment closes"
              hint="Students can still enroll on this day."
              error={errors.enrollment_closes_on?.message}
            >
              <input
                type="date"
                {...register("enrollment_closes_on")}
                className={inputClass}
              />
            </Field>
          </div>
          <Field
            label="Course starts"
            hint="Optional. Shown on the course page and in confirmation emails."
            error={errors.starts_on?.message}
          >
            <input
              type="date"
              {...register("starts_on")}
              className={cn(inputClass, "sm:w-1/2")}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        eyebrow="What students pay"
        title="Price"
        description="Stored in cents; type dollars, e.g. 900 for $900."
      >
        <div className="flex flex-col gap-5">
          <Field
            label="Tuition"
            hint="The full course price. Paying it at once is always offered."
            error={errors.amount?.message}
          >
            <DollarInput {...register("amount", { valueAsNumber: true })} />
          </Field>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              {...register("manual_payments_enabled")}
              className="mt-1"
            />
            <span>
              <span className="font-bold">Let students pay in parts</span>
              <span className="text-muted block text-xs">
                They choose each amount and come back to pay the rest. Nothing
                is charged automatically.
              </span>
            </span>
          </label>
          {manual && (
            <Field
              label="Minimum payment"
              hint="Per payment. A smaller final payment is always allowed."
              error={errors.minimum_payment?.message}
            >
              <DollarInput
                {...register("minimum_payment", { valueAsNumber: true })}
              />
            </Field>
          )}
        </div>
      </FormSection>

      <FormSection
        tone="plain"
        eyebrow="On the course page"
        title="Pricing card"
        description="The text on the full-payment card in the Schedule & Pricing tab."
      >
        <div className="border-accent bg-surface flex flex-col gap-5 rounded-r-2xl border-l-4 p-6">
          <Field label="Card title" error={errors.plan_title?.message}>
            <input {...register("plan_title")} className={inputClass} />
          </Field>
          <Field
            label="Card description"
            error={errors.plan_description?.message}
          >
            <input {...register("plan_description")} className={inputClass} />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-bold">
              What&apos;s included
            </legend>
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <input
                    {...register(`features.${index}.value`)}
                    aria-label={`Included item ${index + 1}`}
                    className={inputClass}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove item ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                {errors.features?.[index]?.value && (
                  <span role="alert" className="text-danger text-xs">
                    {errors.features[index].value.message}
                  </span>
                )}
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              className="mt-1 self-start"
              onClick={() => append({ value: "" })}
            >
              <Plus size={14} /> Add item
            </Button>
          </fieldset>
        </div>
      </FormSection>

      <SaveBar
        pending={pending}
        dirty={isDirty}
        status={saveStatus}
        onDiscard={() => {
          reset();
          setSaveStatus(null);
        }}
      />
    </form>
  );
}
