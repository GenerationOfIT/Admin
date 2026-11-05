"use client";

import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageField } from "@/components/forms/ImageField";
import {
  discardStagedUploads,
  findStagedImages,
  uploadStagedImages,
} from "@/components/forms/stagedImages";
import { Field, inputClass } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { SaveBar, type SaveStatus } from "@/components/ui/SaveBar";
import { createTeamMember, saveTeamMember } from "../actions";
import { teamMemberSchema, type TeamMemberInput } from "../team.schema";
import { DeleteTeamMemberButton } from "./DeleteTeamMemberButton";

export function TeamMemberForm({
  id,
  member,
}: {
  /** Missing when creating a new team member. */
  id?: string;
  member: TeamMemberInput;
}) {
  const form = useForm<TeamMemberInput>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: member,
  });
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = form;
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<SaveStatus>(null);

  const onSubmit = handleSubmit(
    (values) =>
      startTransition(async () => {
        // A picked photo goes to the bucket only now, right before saving.
        let prepared: { values: TeamMemberInput; uploaded: string[] };
        try {
          prepared = await uploadStagedImages(
            findStagedImages(getValues()),
            values,
          );
        } catch (cause) {
          setStatus({
            ok: false,
            text: cause instanceof Error ? cause.message : "Upload failed.",
          });
          return;
        }
        // createTeamMember redirects to the list on success.
        const result = id
          ? await saveTeamMember(id, prepared.values)
          : await createTeamMember(prepared.values);
        if (result.ok) {
          reset(prepared.values);
          setStatus({ ok: true, text: "Saved." });
        } else {
          await discardStagedUploads(prepared.uploaded);
          setStatus({ ok: false, text: result.error });
        }
      }),
    () => setStatus({ ok: false, text: "Check the highlighted fields." }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-10">
        <FormSection eyebrow="About page card" title="Team member">
          <div className="flex flex-col gap-5">
            <label className="bg-background border-border flex items-center gap-3 self-start rounded-full border px-4 py-2 text-sm">
              <input type="checkbox" {...register("is_published")} />
              Published on the About page
            </label>
            <ImageField
              name="image_url"
              label="Photo"
              folder="team"
              // A square card up to ~440 px wide; 800 px stays sharp on
              // high-resolution screens.
              recommended="800 × 800 px, square"
              hint="Required to publish. Its description on the site is “Portrait of <name>”."
            />
            <Field label="Name" error={errors.name?.message}>
              <input {...register("name")} className={inputClass} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Role" error={errors.role?.message}>
                <input
                  {...register("role")}
                  placeholder="VP of Quality Engineering"
                  className={inputClass}
                />
              </Field>
              <Field
                label="Organization"
                hint="Optional."
                error={errors.organization?.message}
              >
                <input {...register("organization")} className={inputClass} />
              </Field>
            </div>
          </div>
        </FormSection>
        <SaveBar
          pending={pending}
          dirty={isDirty}
          status={status}
          label={id ? "Save" : "Create"}
          allowClean={!id}
          onDiscard={
            id
              ? () => {
                  reset();
                  setStatus(null);
                }
              : undefined
          }
          cancelHref={id ? undefined : "/team"}
        />
      </form>
      {id && (
        <FormSection
          tone="danger"
          eyebrow="Danger zone"
          title="Delete team member"
          description="Unpublish instead if you might want them back. The photo stays in the image library."
          className="mt-10"
        >
          <DeleteTeamMemberButton id={id} name={member.name} />
        </FormSection>
      )}
    </FormProvider>
  );
}
