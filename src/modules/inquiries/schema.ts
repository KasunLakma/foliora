import { z } from "zod";
import type { Dictionary } from "../../lib/i18n/dictionaries";
import { format } from "../../lib/i18n/format";

export const INQUIRY_TYPES = ["CASTING", "BRAND", "EVENT", "REPRESENTATION", "GENERAL"] as const;

/** Error messages come from the dictionary so they appear in the visitor's language. */
export function createInquirySchema(m: Dictionary["inquiryErrors"]) {
  const optional = (max: number) =>
    z
      .string()
      .trim()
      .max(max, format(m.max, { max }))
      .transform((v) => (v === "" ? null : v));

  return z.object({
    type: z.enum(INQUIRY_TYPES),
    senderName: z.string().trim().min(2, m.name).max(100, format(m.max, { max: 100 })),
    senderEmail: z.string().trim().toLowerCase().max(200, format(m.max, { max: 200 })).email(m.email),
    senderPhone: optional(30),
    company: optional(100),
    projectName: optional(120),
    message: z.string().trim().min(10, m.message).max(3000, format(m.max, { max: 3000 })),
  });
}

export type InquiryInput = z.infer<ReturnType<typeof createInquirySchema>>;
