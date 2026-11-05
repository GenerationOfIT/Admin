"use client";

import { useWatch, type Control } from "react-hook-form";
import { imagePreviewUrl } from "@/lib/imagePreview";
import { roleLine, type TestimonialInput } from "../testimonial.schema";

/** Approximates the site's TestimonialCard, so editors see what they write. */
export function TestimonialPreview({
  control,
}: {
  control: Control<TestimonialInput>;
}) {
  const [name, quote, avatar, jobTitle, company, context] = useWatch({
    control,
    name: [
      "name",
      "quote",
      "avatar_url",
      "job_title",
      "company",
      "context_label",
    ],
  });
  const role = roleLine({
    job_title: jobTitle,
    company,
    context_label: context,
  });
  return (
    <figure className="border-primary/20 bg-surface flex min-h-56 flex-col justify-between gap-6 rounded-2xl border p-8">
      <blockquote className="text-muted line-clamp-5 text-[0.9375rem] leading-6">
        “{quote || "The quote appears here."}”
      </blockquote>
      <figcaption className="flex items-center gap-3">
        {imagePreviewUrl(avatar) && (
          // eslint-disable-next-line @next/next/no-img-element -- remote preview of a site file
          <img
            src={imagePreviewUrl(avatar)!}
            alt=""
            className="size-10 shrink-0 rounded-full object-cover"
          />
        )}
        <div className="leading-4">
          <strong className="text-sm">{name || "Name"}</strong>
          {role && <p className="text-foreground/50 mt-1 text-xs">{role}</p>}
        </div>
      </figcaption>
    </figure>
  );
}
