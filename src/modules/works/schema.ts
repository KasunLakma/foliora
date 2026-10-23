import { z } from "zod";
import type { Dictionary } from "../../lib/i18n/dictionaries";
import { format } from "../../lib/i18n/format";

export const WORK_TYPES = [
  "FILM",
  "TV",
  "THEATRE",
  "COMMERCIAL",
  "MUSIC_VIDEO",
  "WEB_SERIES",
  "MODELLING",
  "OTHER",
] as const;

export const ROLE_TYPES = ["LEAD", "SUPPORTING", "CAMEO", "EXTRA", "OTHER"] as const;

function isWebAddress(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Error messages come from the dictionary so they appear in the visitor's language. */
export function createWorkSchema(m: Dictionary["portfolioErrors"]) {
  const text = (max: number) =>
    z
      .string()
      .trim()
      .max(max, format(m.max, { max }))
      .transform((v) => (v === "" ? null : v));

  const thisYear = new Date().getFullYear();

  return z.object({
    id: z
      .string()
      .trim()
      .transform((v) => (v === "" ? undefined : v)),
    title: z.string().trim().min(2, m.title).max(160, format(m.max, { max: 160 })),
    year: z
      .string()
      .trim()
      .transform(Number)
      .refine((n) => Number.isInteger(n) && n >= 1950 && n <= thisYear + 3, { message: m.year }),
    type: z.enum(WORK_TYPES),
    roleName: text(120),
    roleType: z.preprocess((v) => (v === "" || v == null ? null : v), z.enum(ROLE_TYPES).nullable()),
    director: text(120),
    company: text(120),
    description: text(1000),
    link: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : v))
      .refine((v) => v === null || isWebAddress(v), { message: m.link }),
    isFeatured: z.boolean(),
  });
}

export type WorkInput = z.infer<ReturnType<typeof createWorkSchema>>;
