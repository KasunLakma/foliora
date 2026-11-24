import type { Dictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";

/** "Age 20 to 30", "Age 18 and over", "Up to age 25", or nothing. */
export function ageText(c: Dictionary["casting"], min: number | null, max: number | null) {
  if (min !== null && max !== null) return format(c.ageBetween, { min, max });
  if (min !== null) return format(c.ageFrom, { min });
  if (max !== null) return format(c.ageUpTo, { max });
  return null;
}

/** Dates in Sri Lanka time, in the visitor's language. */
export function dateFormatter(locale: string) {
  return new Intl.DateTimeFormat(locale === "si" ? "si-LK" : "en-GB", { dateStyle: "medium", timeZone: "Asia/Colombo" });
}
