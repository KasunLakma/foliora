"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getDictionary } from "@/lib/i18n/server";
import { createRegisterSchema, loginSchema } from "@/modules/auth/schema";
import { EmailTakenError, registerUser } from "@/modules/auth/service";

export type FormState = { error?: string } | undefined;

/** Platform staff who have no talent account of their own start in the admin area. */
async function landingFor(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { platformRole: true, memberships: { select: { id: true }, take: 1 } },
  });
  return user?.platformRole && user.memberships.length === 0 ? "/admin" : "/portal";
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { t } = await getDictionary();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: t.auth.errors.enterValid };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: await landingFor(parsed.data.email),
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: t.auth.errors.invalidLogin };
    throw error; // the redirect itself must be re-thrown
  }
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { t } = await getDictionary();
  const parsed = createRegisterSchema(t.auth.errors).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    accountType: formData.get("accountType"),
    tenantName: formData.get("tenantName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t.auth.errors.generic };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = h.get("user-agent") ?? undefined;

  try {
    await registerUser(parsed.data, { ip, userAgent });
  } catch (error) {
    if (error instanceof EmailTakenError) return { error: t.auth.errors.emailTaken };
    throw error;
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      // Individuals start with the step-by-step profile setup.
      redirectTo: parsed.data.accountType === "INDIVIDUAL" ? "/portal/welcome" : "/portal",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: t.auth.errors.createdSignIn };
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
