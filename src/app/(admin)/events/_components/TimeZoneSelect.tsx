import type { UseFormRegisterReturn } from "react-hook-form";
import { inputClass } from "@/components/ui/Field";
import { commonTimeZones } from "../event.schema";

/** The venue's time zone; a saved zone missing from the short list is kept. */
export function TimeZoneSelect({
  registration,
  current,
}: {
  registration: UseFormRegisterReturn;
  current: string;
}) {
  const zones = commonTimeZones.includes(current)
    ? commonTimeZones
    : [current, ...commonTimeZones];
  return (
    <select {...registration} className={inputClass}>
      {zones.map((zone) => (
        <option key={zone} value={zone}>
          {zone.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
