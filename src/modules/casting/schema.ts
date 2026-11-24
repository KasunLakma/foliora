import { z } from "zod";
import { deadlineFromDate } from "./rules";

export const CASTING_GENDERS = ["ANY", "MALE", "FEMALE"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((value) => (value === "" ? null : value));

const optionalAge = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .refine((n) => n === null || (Number.isInteger(n) && n >= 0 && n <= 100), "Age must be a whole number from 0 to 100");

export const callSchema = z
  .object({
    title: z.string().trim().min(3, "Enter a title").max(150, "Keep the title under 150 characters"),
    company: optionalText(120),
    role: optionalText(150),
    description: z
      .string()
      .trim()
      .min(20, "Describe the role in at least 20 characters")
      .max(5000, "Keep the description under 5000 characters"),
    gender: z.enum(CASTING_GENDERS),
    ageMin: optionalAge,
    ageMax: optionalAge,
    location: optionalText(120),
    compensation: optionalText(200),
    deadline: z.string().trim().refine((value) => deadlineFromDate(value) !== null, "Enter a valid deadline date"),
  })
  .refine((v) => v.ageMin === null || v.ageMax === null || v.ageMin <= v.ageMax, {
    message: "The minimum age cannot be more than the maximum age",
    path: ["ageMax"],
  });

export type CallInput = z.infer<typeof callSchema>;
