import { randomInt } from "node:crypto";

export type BillingPeriodName = "MONTHLY" | "YEARLY";

/** applications = casting applications a month. null means unlimited. */
export type PlanLimits = { photos: number; showreels: number; applications: number | null };
export const DEFAULT_LIMITS: PlanLimits = { photos: 15, showreels: 5, applications: 3 };

export function priceFor(plan: { monthlyPrice: number; yearlyPrice: number }, period: BillingPeriodName) {
  return period === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
}

/** Adds calendar months. 31 January + 1 month is 28 (or 29) February, never 3 March. */
export function addMonths(date: Date, months: number) {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function addPeriod(date: Date, period: BillingPeriodName) {
  return addMonths(date, period === "YEARLY" ? 12 : 1);
}

// No 0, O, 1, I or L, so that the code is easy to read out and to type.
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** A short code such as FOL-7K3QXM that the account writes in the bank transfer description. */
export function makeCode(random: (max: number) => number = (max) => randomInt(max)) {
  return `FOL-${Array.from({ length: 6 }, () => CODE_CHARS[random(CODE_CHARS.length)]).join("")}`;
}

export function readLimits(json: unknown): PlanLimits {
  const value = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  const number = (key: "photos" | "showreels") =>
    typeof value[key] === "number" && Number.isFinite(value[key]) ? (value[key] as number) : DEFAULT_LIMITS[key];
  const applications =
    value.applications === null
      ? null
      : typeof value.applications === "number" && Number.isFinite(value.applications)
        ? value.applications
        : DEFAULT_LIMITS.applications;
  return { photos: number("photos"), showreels: number("showreels"), applications };
}

/** When several paid periods overlap, the biggest plan counts; among equals, the one that lasts longest. */
export function pickActive<T extends { endsAt: Date; plan: { sortOrder: number } }>(subscriptions: T[]): T | null {
  if (subscriptions.length === 0) return null;
  return [...subscriptions].sort(
    (a, b) => b.plan.sortOrder - a.plan.sortOrder || b.endsAt.getTime() - a.endsAt.getTime(),
  )[0];
}

/**
 * A plan allows a number of photos. If an account has more (for example after a paid plan ended),
 * the first ones in its own order are shown, and the main photo is always kept. Nothing is deleted.
 * The list must already be in the account's own order.
 */
export function visiblePhotos<T extends { isCover: boolean }>(photos: T[], limit: number): T[] {
  if (limit <= 0) return [];
  if (photos.length <= limit) return photos;

  const shown = photos.slice(0, limit);
  const cover = photos.find((photo) => photo.isCover);
  if (cover && !shown.includes(cover)) shown[limit - 1] = cover;
  return shown;
}
