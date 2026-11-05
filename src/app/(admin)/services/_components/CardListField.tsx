"use client";

import { CardListEditor } from "@/components/forms/CardListEditor";
import { ContentBlock } from "@/components/forms/ContentBlock";
import { HeadingInput } from "@/components/forms/HeadingInput";

/** One card section of the service page: its heading, then its cards. */
export function CardListField({
  name,
  titleName,
  label,
  number,
}: {
  name: "scope" | "use_cases" | "deliverables";
  titleName: "scope_title" | "use_cases_title" | "deliverables_title";
  label: string;
  number: number;
}) {
  return (
    <ContentBlock eyebrow={`Section ${number} · ${label}`}>
      <HeadingInput name={titleName} label={`Section ${number} heading`} />
      <CardListEditor
        name={name}
        emptyText="No cards yet. This section stays hidden on the site until it has one."
      />
    </ContentBlock>
  );
}
