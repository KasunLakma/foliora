import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
});

export const registerSchema = z.object({
    name: z.string().trim().min(2, "Enter your name").max(100),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z
        .string()
        .min(10, "Password must be at least 10 characters")
        .max(128),
    accountType: z.enum(["INDIVIDUAL", "AGENCY"]),
    tenantName: z.string().trim().min(2, "Enter a name for the account").max(120),
});

export type RegisterInput = z.infer<typeof registerSchema>;