"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn, signOut } from "@/auth";
import { loginSchema, registerSchema } from "@/modules/auth/schema";
import { EmailTakenError, registerUser } from "@/modules/auth/service";

export type FormState = { error?: string } | undefined;

export async function loginAction(
    _prev: FormState,
    formData: FormData,
): Promise<FormState> {
    const parsed = loginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    });
    if (!parsed.success) return { error: "Enter a valid email and password." };

    try {
        await signIn("credentials", {
            email: parsed.data.email,
            password: parsed.data.password,
            redirectTo: "/portal",
        });
    } catch (error) {
        if (error instanceof AuthError) return { error: "Invalid email or password." };
        throw error; // the redirect itself must be re-thrown
    }
}

export async function registerAction(
    _prev: FormState,
    formData: FormData,
): Promise<FormState> {
    const parsed = registerSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        accountType: formData.get("accountType"),
        tenantName: formData.get("tenantName"),
    });
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
    }

    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = h.get("user-agent") ?? undefined;

    try {
        await registerUser(parsed.data, { ip, userAgent });
    } catch (error) {
        if (error instanceof EmailTakenError) return { error: error.message };
        throw error;
    }

    try {
        await signIn("credentials", {
            email: parsed.data.email,
            password: parsed.data.password,
            redirectTo: "/portal",
        });
    } catch (error) {
        if (error instanceof AuthError) return { error: "Account created. Please sign in." };
        throw error;
    }
}

export async function signOutAction() {
    await signOut({ redirectTo: "/login" });
}