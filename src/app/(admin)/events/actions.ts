"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { syncChildren } from "@/lib/children";
import { ORDER_CHANGED, orderChanges, orderIdsSchema } from "@/lib/order";
import { nullIfEmpty } from "@/lib/schema";
import { zonedParts, zonedToIso } from "@/lib/zoned-time";
import {
  loadEventAgenda,
  loadEventHighlights,
  loadEventSpeakers,
} from "./event.data";
import {
  agendaSchema,
  basicsSchema,
  highlightsSchema,
  newEventSchema,
  scheduleSchema,
  speakersSchema,
  toCents,
  type AgendaInput,
  type HighlightsInput,
  type SpeakersInput,
} from "./event.schema";

export type SaveResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const SLUG_TAKEN = {
  ok: false as const,
  error: "Another event already uses this slug.",
  fieldErrors: { slug: "Already used by another event." },
};

const NEEDS_DATES =
  "Set the registration dates on the Schedule tab before publishing.";

function refresh(id?: string) {
  revalidatePath("/events");
  if (id) revalidatePath(`/events/${id}`, "layout");
}

export async function createEvent(input: unknown): Promise<SaveResult> {
  const db = await requireAdmin();
  const parsed = newEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const values = parsed.data;
  const { data: last } = await db
    .from("events")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await db
    .from("events")
    .insert({
      title: values.title,
      slug: values.slug,
      card_description: values.card_description,
      starts_at: zonedToIso(
        values.start_date,
        values.start_time,
        values.timezone,
      ),
      timezone: values.timezone,
      // Required columns, filled in on the next screens.
      introduction: "",
      location: "To be announced",
      agenda_title: "Agenda",
      price: 0,
      // Stays hidden, with registration off, until it's filled in.
      is_published: false,
      registration_open: false,
      sort_order: (last?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();
  if (error?.code === "23505") return SLUG_TAKEN;
  if (error) throw error;
  refresh();
  redirect(`/events/${data.id}`);
}

export async function saveEventBasics(
  id: string,
  input: unknown,
): Promise<SaveResult> {
  const db = await requireAdmin();
  const eventId = z.uuid().parse(id);
  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const values = parsed.data;
  const { error } = await db
    .from("events")
    .update({
      title: values.title,
      slug: values.slug,
      card_description: values.card_description,
      introduction: values.introduction,
      image_url: nullIfEmpty(values.image_url),
      price: toCents(values.price),
      is_published: values.is_published,
    })
    .eq("id", eventId);
  if (error?.code === "23505") return SLUG_TAKEN;
  // events_published_need_registration.
  if (error?.code === "23514") return { ok: false, error: NEEDS_DATES };
  if (error) throw error;
  refresh(eventId);
  return { ok: true };
}

export async function saveEventSchedule(
  id: string,
  input: unknown,
): Promise<SaveResult> {
  const db = await requireAdmin();
  const eventId = z.uuid().parse(id);
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const values = parsed.data;
  const { error } = await db
    .from("events")
    .update({
      starts_at: zonedToIso(
        values.start_date,
        values.start_time,
        values.timezone,
      ),
      ends_at: values.end_date
        ? zonedToIso(values.end_date, values.end_time, values.timezone)
        : null,
      timezone: values.timezone,
      location: values.location,
      street_address: nullIfEmpty(values.street_address),
      address_locality: nullIfEmpty(values.address_locality),
      address_country: nullIfEmpty(values.address_country),
      registration_open: values.registration_open,
      registration_opens_on: nullIfEmpty(values.registration_opens_on),
      registration_closes_on: nullIfEmpty(values.registration_closes_on),
    })
    .eq("id", eventId);
  // The form checks the same rules; this covers a page that went stale, e.g.
  // the event was published in another tab.
  if (error?.code === "23514")
    return {
      ok: false,
      error:
        "These dates break a rule: registration must close by the event's day, and a published event needs both dates.",
    };
  if (error) throw error;
  refresh(eventId);
  return { ok: true };
}

export async function saveEventHighlights(
  id: string,
  input: unknown,
): Promise<
  { ok: true; values: HighlightsInput } | { ok: false; error: string }
> {
  const db = await requireAdmin();
  const eventId = z.uuid().parse(id);
  const parsed = highlightsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  await syncChildren(
    db,
    "event_highlights",
    { column: "event_id", id: eventId },
    parsed.data.highlights,
  );
  refresh(eventId);
  return { ok: true, values: await loadEventHighlights(db, eventId) };
}

export async function saveEventAgenda(
  id: string,
  input: unknown,
): Promise<{ ok: true; values: AgendaInput } | { ok: false; error: string }> {
  const db = await requireAdmin();
  const eventId = z.uuid().parse(id);
  const parsed = agendaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  // Agenda times are times of day on the event's start date, at the venue.
  const { data: event, error } = await db
    .from("events")
    .select("starts_at, timezone")
    .eq("id", eventId)
    .single();
  if (error) throw error;
  const startDate = zonedParts(event.starts_at, event.timezone).date;
  const { error: titleError } = await db
    .from("events")
    .update({ agenda_title: parsed.data.agenda_title })
    .eq("id", eventId);
  if (titleError) throw titleError;
  await syncChildren(
    db,
    "event_agenda_items",
    { column: "event_id", id: eventId },
    parsed.data.items.map(({ time, description, ...item }) => ({
      ...item,
      starts_at: zonedToIso(startDate, time, event.timezone),
      description: nullIfEmpty(description),
    })),
  );
  refresh(eventId);
  const saved = await loadEventAgenda(db, eventId);
  return {
    ok: true,
    values: { agenda_title: saved!.agenda_title, items: saved!.items },
  };
}

export async function saveEventSpeakers(
  id: string,
  input: unknown,
): Promise<{ ok: true; values: SpeakersInput } | { ok: false; error: string }> {
  const db = await requireAdmin();
  const eventId = z.uuid().parse(id);
  const parsed = speakersSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  await syncChildren(
    db,
    "event_speakers",
    { column: "event_id", id: eventId },
    parsed.data.speakers.map((speaker) => ({
      id: speaker.id,
      name: speaker.name,
      job_title: nullIfEmpty(speaker.job_title),
      company: nullIfEmpty(speaker.company),
      photo_url: nullIfEmpty(speaker.photo_url),
    })),
  );
  refresh(eventId);
  return { ok: true, values: await loadEventSpeakers(db, eventId) };
}

export async function deleteEvent(
  id: string,
): Promise<{ error: string } | undefined> {
  const db = await requireAdmin();
  const { error } = await db
    .from("events")
    .delete()
    .eq("id", z.uuid().parse(id));
  // orders.event_id keeps sign-up history and blocks the delete. Highlights,
  // agenda and speakers go with the event (on delete cascade).
  if (error?.code === "23503")
    return {
      error:
        "This event has sign-ups, so it can't be deleted. Unpublish it instead.",
    };
  if (error) throw error;
  refresh();
  redirect("/events");
}

const toggleSchema = z.object({
  id: z.uuid(),
  published: z.enum(["true", "false"]),
});

export async function setEventPublished(formData: FormData) {
  const db = await requireAdmin();
  const { id, published } = toggleSchema.parse(Object.fromEntries(formData));
  if (published === "true") {
    // Same rules as the forms; the list only offers Publish when they hold.
    const { data } = await db
      .from("events")
      .select("image_url, registration_opens_on")
      .eq("id", id)
      .maybeSingle();
    if (!data?.image_url) throw new Error("Add a photo before publishing.");
    if (!data.registration_opens_on) throw new Error(NEEDS_DATES);
  }
  const { error } = await db
    .from("events")
    .update({ is_published: published === "true" })
    .eq("id", id);
  if (error) throw error;
  refresh(id);
}

/** Saves the list's order, as set in its "Edit order" mode, in one go. */
export async function saveEventOrder(
  ids: unknown,
): Promise<{ error: string } | undefined> {
  const db = await requireAdmin();
  const { data: rows, error } = await db
    .from("events")
    .select("id, sort_order");
  if (error) throw error;
  const changes = orderChanges(rows, orderIdsSchema.parse(ids));
  if (!changes) return { error: ORDER_CHANGED };
  const results = await Promise.all(
    changes.map((change) =>
      db
        .from("events")
        .update({ sort_order: change.sort_order })
        .eq("id", change.id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
  refresh();
}
