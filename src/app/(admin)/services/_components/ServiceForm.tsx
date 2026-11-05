"use client";

import { useState, useTransition } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, inputClass } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { SaveBar } from "@/components/ui/SaveBar";
import { SearchResultsFields } from "@/components/forms/SearchResultsFields";
import { saveService } from "../actions";
import { cardLists, serviceSchema, type ServiceInput } from "../service.schema";
import { CardListField } from "./CardListField";
import { DeleteServiceButton } from "./DeleteServiceButton";
import { SlugField } from "@/components/ui/SlugField";

const jumpLinks = [
  { href: "#basics", label: "Basics" },
  { href: "#sections", label: "Page sections" },
  { href: "#search", label: "Search results" },
];

export function ServiceForm({
  id,
  service,
  linkedTestimonials,
}: {
  id: string;
  service: ServiceInput;
  linkedTestimonials: number;
}) {
  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service,
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = form;
  const [title, slug, introduction, cardText] = useWatch({
    control: form.control,
    name: ["title", "slug", "introduction", "card_description"],
  });
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const onSubmit = handleSubmit(
    (values) =>
      startTransition(async () => {
        const result = await saveService(id, values);
        if (result.ok) {
          // Saved rows carry ids for newly added cards.
          reset(result.service);
          setStatus({ ok: true, text: "Saved." });
          return;
        }
        setStatus({ ok: false, text: result.error });
        for (const [field, text] of Object.entries(result.fieldErrors ?? {}))
          setError(field as keyof ServiceInput, { message: text });
      }),
    () => setStatus({ ok: false, text: "Check the highlighted fields." }),
  );

  return (
    <FormProvider {...form}>
      <nav aria-label="Form sections" className="mb-6 flex gap-4 text-sm">
        {jumpLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-muted hover:text-foreground underline-offset-4 hover:underline"
          >
            {link.label}
          </a>
        ))}
      </nav>
      <form onSubmit={onSubmit} className="flex flex-col gap-10">
        <FormSection id="basics" eyebrow="Page and home card" title="Basics">
          <div className="flex flex-col gap-5">
            <label className="bg-background border-border flex items-center gap-3 self-start rounded-full border px-4 py-2 text-sm">
              <input
                type="checkbox"
                {...register("is_published")}
                className="accent-[var(--color-accent)]"
              />
              Published on the site
            </label>
            <Field label="Title" error={errors.title?.message}>
              <input {...register("title")} className={inputClass} />
            </Field>
            <SlugField
              prefix="/services/"
              registration={register("slug")}
              error={errors.slug?.message}
              existing
            />
            <Field
              label="Card description"
              hint="Shown on the home page card and in the request form."
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
              hint="The text under the title on the service page. Empty uses the card description."
              error={errors.introduction?.message}
            >
              <textarea
                {...register("introduction")}
                rows={4}
                className={inputClass}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          id="sections"
          tone="plain"
          eyebrow="On the service page"
          title="Page sections"
          description="Shown on the page in this order, below the introduction. A section with no cards is hidden."
        >
          <div className="flex flex-col gap-6">
            {cardLists.map((list, index) => (
              <CardListField
                key={list.key}
                name={list.key}
                titleName={list.titleKey}
                label={list.label}
                number={index + 1}
              />
            ))}
          </div>
        </FormSection>

        <SearchResultsFields
          path={`services › ${slug || "…"}`}
          // Same fallbacks as the site's service page generateMetadata.
          fallbackTitle={`${title || "Title"} | GenofIT`}
          fallbackDescription={introduction || cardText}
          fallbackDescriptionHint="Empty uses the introduction."
        />

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
        title="Delete service"
        description="Removes the service and all its cards. Unpublish instead if you might want it back."
        className="mt-10"
      >
        <DeleteServiceButton
          id={id}
          title={service.title}
          linkedTestimonials={linkedTestimonials}
        />
      </FormSection>
    </FormProvider>
  );
}
