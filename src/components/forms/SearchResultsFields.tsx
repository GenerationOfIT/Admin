"use client";

import { Search } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { Field } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { cn } from "@/lib/cn";

// Roughly what Google shows before cutting text off.
const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;

const lightInput =
  "w-full rounded-lg border border-ink/25 bg-white px-3 py-2 text-ink outline-none focus:border-ink";

function clip(text: string, limit: number) {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function Counter({ value, limit }: { value: string; limit: number }) {
  return (
    <span
      className={cn(
        "text-xs",
        value.length > limit ? "font-bold text-red-700" : "text-ink/60",
      )}
    >
      {value.length}/{limit} recommended
      {value.length > limit &&
        " · Google may cut off the rest. You can still save."}
    </span>
  );
}

/**
 * seo_title and seo_description with a Google-style preview. The fallbacks
 * must match the site's generateMetadata for that page type.
 */
export function SearchResultsFields({
  path,
  fallbackTitle,
  fallbackDescription,
  fallbackDescriptionHint,
}: {
  /** e.g. "services › manual-testing". */
  path: string;
  /** Shown when the SEO title is empty, e.g. "Manual Testing | GenofIT". */
  fallbackTitle: string;
  fallbackDescription: string;
  /** e.g. "Empty uses the introduction." */
  fallbackDescriptionHint: string;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<{ seo_title: string; seo_description: string }>();
  const [seoTitle, seoDescription] = useWatch({
    control,
    name: ["seo_title", "seo_description"],
  });
  const shownTitle = seoTitle || fallbackTitle;
  const shownDescription = seoDescription || fallbackDescription;

  return (
    <FormSection
      id="search"
      tone="light"
      eyebrow="Not shown on the page"
      title="Search results"
      description="How this page appears on Google and when the link is shared. Leave empty to use the page's own title and introduction."
    >
      <div className="mb-6 rounded-xl border border-black/10 bg-white p-4 font-[Arial,sans-serif]">
        <p className="mb-2 flex items-center gap-1.5 text-xs text-black/50">
          <Search size={12} /> Preview
        </p>
        <p className="text-sm text-[#202124]">www.genofit.tech › {path}</p>
        <p className="text-xl leading-snug text-[#1a0dab]">
          {clip(shownTitle, TITLE_LIMIT)}
        </p>
        <p className="text-sm leading-snug text-[#4d5156]">
          {clip(shownDescription, DESCRIPTION_LIMIT)}
        </p>
      </div>
      <div className="flex flex-col gap-5">
        <Field
          label="SEO title"
          hint={`Empty uses "${fallbackTitle}".`}
          error={errors.seo_title?.message}
          light
        >
          <input {...register("seo_title")} className={lightInput} />
          <Counter value={seoTitle} limit={TITLE_LIMIT} />
        </Field>
        <Field
          label="SEO description"
          hint={fallbackDescriptionHint}
          error={errors.seo_description?.message}
          light
        >
          <textarea
            {...register("seo_description")}
            rows={3}
            className={lightInput}
          />
          <Counter value={seoDescription} limit={DESCRIPTION_LIMIT} />
        </Field>
      </div>
    </FormSection>
  );
}
