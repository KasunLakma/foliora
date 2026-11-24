const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000; // Sri Lanka is UTC+5:30 all year

/** The moment the current month began in Sri Lanka. Monthly application counts start here. */
export function monthStartSriLanka(now: Date) {
  const local = new Date(now.getTime() + COLOMBO_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - COLOMBO_OFFSET_MS);
}

/** "2026-12-31" becomes the very end of that day in Sri Lanka. Returns null for anything that is not a real date. */
export function deadlineFromDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  // JavaScript quietly turns 31 February into 3 March, so check that the day really exists
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  const deadline = new Date(`${date}T23:59:59+05:30`);
  return Number.isNaN(deadline.getTime()) ? null : deadline;
}

/** The "2026-12-31" form of a deadline, for putting it back in a form. */
export function dateFromDeadline(deadline: Date) {
  return new Date(deadline.getTime() + COLOMBO_OFFSET_MS).toISOString().slice(0, 10);
}
