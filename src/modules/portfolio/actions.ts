"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ConflictError, ForbiddenError, NotApprovedError, NotFoundError, ValidationError } from "@/lib/errors";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePermission } from "@/modules/roles/permissions";
import { SLUG_MAX, SLUG_MIN } from "./slug";
import { saveSiteSettings, setPublished } from "./service";

export type SiteFormState = { error?: string; saved?: boolean; done?: "published" | "unpublished" } | undefined;

async function sessionContext() {
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.activeTenantId; // from the session, never from the form
  return userId && tenantId ? { userId, tenantId } : null;
}

const clean = (value: FormDataEntryValue | null, max: number) => {
  const text = (value ?? "").toString().trim().slice(0, max);
  return text === "" ? null : text;
};

export async function saveSiteSettingsAction(_prev: SiteFormState, fd: FormData): Promise<SiteFormState> {
  const { t } = await getDictionary();
  const ctx = await sessionContext();
  if (!ctx) return { error: t.portfolioErrors.signInAgain };

  try {
    await requirePermission(ctx.userId, ctx.tenantId, "portfolio.design");
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: t.portfolioErrors.noPermission };
    throw error;
  }

  try {
    await saveSiteSettings(ctx.tenantId, ctx.userId, {
      slug: (fd.get("slug") ?? "").toString(),
      templateKey: (fd.get("templateKey") ?? "cinematic").toString(),
      seoTitle: clean(fd.get("seoTitle"), 70),
      seoDescription: clean(fd.get("seoDescription"), 160),
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      const problems = t.publish.errors as Record<string, string>;
      const text = problems[error.message] ?? t.portfolioErrors.generic;
      return { error: format(text, { min: SLUG_MIN, max: SLUG_MAX }) };
    }
    if (error instanceof ConflictError) return { error: t.publish.errors.taken };
    if (error instanceof NotFoundError) return { error: t.portfolioErrors.notFound };
    throw error;
  }

  revalidatePath("/portal", "layout");
  return { saved: true };
}

export async function setPublishedAction(_prev: SiteFormState, fd: FormData): Promise<SiteFormState> {
  const { t } = await getDictionary();
  const ctx = await sessionContext();
  if (!ctx) return { error: t.portfolioErrors.signInAgain };

  try {
    await requirePermission(ctx.userId, ctx.tenantId, "portfolio.publish");
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: t.portfolioErrors.noPermission };
    throw error;
  }

  const publish = fd.get("publish") === "true";
  try {
    await setPublished(ctx.tenantId, ctx.userId, publish);
  } catch (error) {
    if (error instanceof ValidationError) return { error: t.publish.needsAddress };
    if (error instanceof NotApprovedError) return { error: t.publish.needsApproval };
    if (error instanceof NotFoundError) return { error: t.portfolioErrors.notFound };
    throw error;
  }

  revalidatePath("/", "layout");
  return { done: publish ? "published" : "unpublished" };
}
