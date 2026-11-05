/**
 * Event times are entered and shown as the venue's local date and time (its
 * IANA time zone, e.g. Asia/Tbilisi) but stored as exact moments
 * (timestamptz). These convert between the two with the built-in Intl API,
 * including daylight-saving changes.
 */

function zonedFields(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(ms);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** The venue's local date ("2026-11-20") and time ("18:30") of a moment. */
export function zonedParts(iso: string, timeZone: string) {
  const f = zonedFields(Date.parse(iso), timeZone);
  return {
    date: `${f.year}-${pad(f.month)}-${pad(f.day)}`,
    time: `${pad(f.hour)}:${pad(f.minute)}`,
  };
}

/** How far the zone is ahead of UTC at that moment, in milliseconds. */
function offset(ms: number, timeZone: string) {
  const f = zonedFields(ms, timeZone);
  return (
    Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute, f.second) -
    (ms - (ms % 1000))
  );
}

/** The exact moment of a local date and time at the venue, as ISO UTC. */
export function zonedToIso(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const [hour, minute] = time.split(":").map(Number) as [number, number];
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  // Twice, so a guess on the other side of a daylight-saving change settles.
  const first = asUtc - offset(asUtc, timeZone);
  return new Date(asUtc - offset(first, timeZone)).toISOString();
}

/** Today's date at the venue. */
export function zonedToday(timeZone: string, now = Date.now()) {
  return zonedParts(new Date(now).toISOString(), timeZone).date;
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
