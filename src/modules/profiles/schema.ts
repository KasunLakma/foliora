import { z } from "zod";
import { GENDERS, LANGUAGE_CODES, SOCIAL_PLATFORMS } from "./constants";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((v) => (v === "" ? null : v));

const wholeNumber = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= min && v <= max), { message });

const thisYear = new Date().getFullYear();

export const profileSchema = z.object({
  stageName: z.string().trim().min(2, "Enter your stage name").max(120, "Stage name is too long"),
  legalName: text(120),
  taglineEn: text(160),
  taglineSi: text(160),
  bioEn: text(3000),
  bioSi: text(3000),
  gender: z.preprocess((v) => (v === "" || v == null ? null : v), z.enum(GENDERS).nullable()),
  birthYear: wholeNumber(1900, thisYear - 5, "Enter a valid birth year"),
  location: text(80),
  nationality: text(80),
  heightCm: wholeNumber(100, 250, "Height must be between 100 and 250 cm"),
  build: text(60),
  eyeColor: text(60),
  hairColor: text(60),
  languages: z.array(z.enum(LANGUAGE_CODES)).max(10),
  skillIds: z.array(z.string().min(1)).max(60),
  socialLinks: z
    .array(
      z.object({
        platform: z.enum(SOCIAL_PLATFORMS),
        url: z.string().url("Check your social links. Each one must be a valid web address."),
      }),
    )
    .max(SOCIAL_PLATFORMS.length),
});

export type ProfileInput = z.infer<typeof profileSchema>;
