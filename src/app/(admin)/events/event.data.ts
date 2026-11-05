import "server-only";
import type { requireAdmin } from "@/lib/auth";
import { zonedParts } from "@/lib/zoned-time";
import {
  toDollars,
  type AgendaInput,
  type BasicsInput,
  type HighlightsInput,
  type ScheduleInput,
  type SpeakersInput,
} from "./event.schema";

type Db = Awaited<ReturnType<typeof requireAdmin>>;

export async function loadEventBasics(
  db: Db,
  id: string,
): Promise<BasicsInput | null> {
  const { data, error } = await db
    .from("events")
    .select(
      "title, slug, card_description, introduction, image_url, price, is_published",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    image_url: data.image_url ?? "",
    price: toDollars(data.price),
  };
}

/** Sign-ups block deleting an event (orders.event_id keeps the history). */
export async function countEventOrders(db: Db, id: string) {
  const { count, error } = await db
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);
  if (error) throw error;
  return count ?? 0;
}

export async function loadEventSchedule(
  db: Db,
  id: string,
): Promise<ScheduleInput | null> {
  const { data, error } = await db
    .from("events")
    .select(
      "starts_at, ends_at, timezone, location, street_address, address_locality, address_country, registration_open, registration_opens_on, registration_closes_on, is_published",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const start = zonedParts(data.starts_at, data.timezone);
  const end = data.ends_at ? zonedParts(data.ends_at, data.timezone) : null;
  return {
    start_date: start.date,
    start_time: start.time,
    end_date: end?.date ?? "",
    end_time: end?.time ?? "",
    timezone: data.timezone,
    location: data.location,
    street_address: data.street_address ?? "",
    address_locality: data.address_locality ?? "",
    address_country: data.address_country ?? "",
    registration_open: data.registration_open,
    registration_opens_on: data.registration_opens_on ?? "",
    registration_closes_on: data.registration_closes_on ?? "",
    is_published: data.is_published,
  };
}

export async function loadEventHighlights(
  db: Db,
  id: string,
): Promise<HighlightsInput> {
  const { data, error } = await db
    .from("event_highlights")
    .select("id, icon, label")
    .eq("event_id", id)
    .order("sort_order");
  if (error) throw error;
  return {
    highlights: data.map((row) => ({
      ...row,
      icon: row.icon as HighlightsInput["highlights"][number]["icon"],
    })),
  };
}

/** The agenda in time order, as times of day in the event's time zone. */
export async function loadEventAgenda(
  db: Db,
  id: string,
): Promise<(AgendaInput & { startDate: string; timezone: string }) | null> {
  const { data, error } = await db
    .from("events")
    .select(
      "agenda_title, starts_at, timezone, event_agenda_items(id, starts_at, title, description)",
    )
    .eq("id", id)
    .order("starts_at", { referencedTable: "event_agenda_items" })
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    agenda_title: data.agenda_title,
    startDate: zonedParts(data.starts_at, data.timezone).date,
    timezone: data.timezone,
    items: data.event_agenda_items.map((item) => ({
      id: item.id,
      time: zonedParts(item.starts_at, data.timezone).time,
      title: item.title,
      description: item.description ?? "",
    })),
  };
}

export async function loadEventSpeakers(
  db: Db,
  id: string,
): Promise<SpeakersInput> {
  const { data, error } = await db
    .from("event_speakers")
    .select("id, name, job_title, company, photo_url")
    .eq("event_id", id)
    .order("sort_order");
  if (error) throw error;
  return {
    speakers: data.map((row) => ({
      id: row.id,
      name: row.name,
      job_title: row.job_title ?? "",
      company: row.company ?? "",
      photo_url: row.photo_url ?? "",
    })),
  };
}
