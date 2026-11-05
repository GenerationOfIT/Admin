"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, inputClass } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { isValidTimeZone, zonedToIso, zonedToday } from "@/lib/zoned-time";
import { saveEventSchedule } from "../actions";
import {
  registrationStatus,
  scheduleSchema,
  type ScheduleInput,
} from "../event.schema";
import { RegistrationBadge, registrationText } from "./RegistrationBadge";
import { TimeZoneSelect } from "./TimeZoneSelect";

export function ScheduleForm({
  id,
  schedule,
}: {
  id: string;
  schedule: ScheduleInput;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: schedule,
  });
  const [startDate, startTime, timezone, open, opensOn, closesOn] = useWatch({
    control,
    name: [
      "start_date",
      "start_time",
      "timezone",
      "registration_open",
      "registration_opens_on",
      "registration_closes_on",
    ],
  });
  // The preview follows the form as it's edited, before saving.
  const zone = isValidTimeZone(timezone) ? timezone : schedule.timezone;
  const today = zonedToday(zone);
  const startsAt =
    startDate && /^\d\d:\d\d$/.test(startTime)
      ? zonedToIso(startDate, startTime, zone)
      : zonedToIso(schedule.start_date, schedule.start_time, schedule.timezone);
  const status = registrationStatus(
    {
      starts_at: startsAt,
      registration_open: open,
      registration_opens_on: opensOn,
      registration_closes_on: closesOn,
    },
    today,
  );
  const [pending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);

  const onSubmit = handleSubmit(
    (values) =>
      startTransition(async () => {
        const result = await saveEventSchedule(id, values);
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
        eyebrow="When"
        title="Date and time"
        description="Times as they are at the venue. Visitors see them in this time zone, wherever they are."
      >
        <div className="flex flex-col gap-5">
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
            <Field label="Time zone" error={errors.timezone?.message}>
              <TimeZoneSelect
                registration={register("timezone")}
                current={schedule.timezone}
              />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field
              label="End date"
              hint="Optional, with the end time."
              error={errors.end_date?.message}
            >
              <input
                type="date"
                {...register("end_date")}
                className={inputClass}
              />
            </Field>
            <Field label="Ends at" error={errors.end_time?.message}>
              <input
                type="time"
                {...register("end_time")}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection
        eyebrow="Where"
        title="Place"
        description="The location text is what visitors read. The address parts help Google show the event in search results."
      >
        <div className="flex flex-col gap-5">
          <Field
            label="Location"
            hint="E.g. “Tech Park, Tbilisi” or “Online via Zoom”."
            error={errors.location?.message}
          >
            <input {...register("location")} className={inputClass} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field
              label="Street address"
              hint="Optional."
              error={errors.street_address?.message}
            >
              <input {...register("street_address")} className={inputClass} />
            </Field>
            <Field
              label="City"
              hint="Optional."
              error={errors.address_locality?.message}
            >
              <input {...register("address_locality")} className={inputClass} />
            </Field>
            <Field
              label="Country"
              hint="Optional, e.g. GE or Georgia."
              error={errors.address_country?.message}
            >
              <input {...register("address_country")} className={inputClass} />
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection
        eyebrow="Who can sign up, and when"
        title="Registration"
        description="Days count in the event's time zone. Registration closes once the event starts, whatever the dates say."
      >
        <div className="flex flex-col gap-5">
          <div className="bg-background border-border flex flex-wrap items-center gap-3 rounded-xl border p-4 text-sm">
            <span className="text-muted">Today ({today}):</span>
            <RegistrationBadge status={status} />
            <span>{registrationText[status].detail}</span>
          </div>
          <label className="bg-background border-border flex items-center gap-3 self-start rounded-full border px-4 py-2 text-sm">
            <input type="checkbox" {...register("registration_open")} />
            Registration switched on
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Registration opens"
              error={errors.registration_opens_on?.message}
            >
              <input
                type="date"
                {...register("registration_opens_on")}
                className={inputClass}
              />
            </Field>
            <Field
              label="Registration closes"
              hint="People can still register on this day. No later than the event's day."
              error={errors.registration_closes_on?.message}
            >
              <input
                type="date"
                {...register("registration_closes_on")}
                className={inputClass}
              />
            </Field>
          </div>
          {schedule.is_published && (
            <p className="text-muted text-sm">
              This event is published, so both registration dates are required.
            </p>
          )}
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
