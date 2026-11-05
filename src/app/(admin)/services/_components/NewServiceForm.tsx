"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { createService } from "../actions";
import { newServiceSchema, type NewServiceInput } from "../service.schema";
import { SlugField } from "@/components/ui/SlugField";
import { useLeaveWarning } from "@/components/forms/useLeaveWarning";

export function NewServiceForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<NewServiceInput>({
    resolver: zodResolver(newServiceSchema),
    defaultValues: { title: "", slug: "", card_description: "" },
  });
  useLeaveWarning(isDirty);

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      // On success the action redirects to the new service's edit page.
      const result = await createService(values);
      if (!result.ok) {
        setMessage(result.error);
        for (const [field, text] of Object.entries(result.fieldErrors ?? {}))
          setError(field as keyof NewServiceInput, { message: text });
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Title" error={errors.title?.message}>
        <input {...register("title")} className={inputClass} />
      </Field>
      <SlugField
        prefix="/services/"
        registration={register("slug")}
        error={errors.slug?.message}
      />
      <Field
        label="Card description"
        hint="Shown on the home page card and in the request form."
        error={errors.card_description?.message}
      >
        <textarea
          {...register("card_description")}
          rows={3}
          className={inputClass}
        />
      </Field>
      {message && (
        <p role="alert" className="text-danger text-sm">
          {message}
        </p>
      )}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create draft"}
        </Button>
        {!pending && (
          <Link
            href="/services"
            className={buttonVariants({ variant: "ghost" })}
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
