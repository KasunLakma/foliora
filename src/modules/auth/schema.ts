import { z } from "zod";
import type { Dictionary } from "../../lib/i18n/dictionaries";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

/** Error messages come from the dictionary so they appear in the visitor's language. */
export function createRegisterSchema(m: Dictionary["auth"]["errors"]) {
  return z.object({
    name: z.string().trim().min(2, m.nameShort).max(100),
    email: z.string().trim().toLowerCase().email(m.emailInvalid),
    password: z.string().min(10, m.passwordShort).max(128),
    accountType: z.enum(["INDIVIDUAL", "AGENCY"]),
    tenantName: z.string().trim().min(2, m.tenantShort).max(120),
  });
}

export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;
