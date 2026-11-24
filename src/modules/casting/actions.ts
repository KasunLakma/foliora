"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ConflictError, ForbiddenError, LimitError, NotFoundError, ValidationError } from "@/lib/errors";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentPlan } from "@/modules/billing/service";
import { requirePermission } from "@/modules/roles/permissions";
import { applyToCall, withdrawApplication } from "./service";

export type CastingFormState = { error?: string; done?: boolean } | undefined;

async function context() {
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.activeTenantId; // from the session, never from the form
  return userId && tenantId ? { userId, tenantId } : null;
}

export async function applyAction(_prev: CastingFormState, fd: FormData): Promise<CastingFormState> {
  const { t } = await getDictionary();
  const c = t.casting;
  const ctx = await context();
  if (!ctx) return { error: c.errors.signInAgain };

  try {
    // applying is part of managing your own profile
    await requirePermission(ctx.userId, ctx.tenantId, "profile.edit");
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: c.errors.noPermission };
    throw error;
  }

  try {
    await applyToCall(ctx.tenantId, ctx.userId, (fd.get("callId") ?? "").toString(), (fd.get("message") ?? "").toString());
  } catch (error) {
    if (error instanceof ValidationError) {
      const reasons = c.notEligible as Record<string, string>;
      return { error: reasons[error.message] ?? c.errors.closed };
    }
    if (error instanceof ConflictError) return { error: c.errors.applied };
    if (error instanceof LimitError) {
      const { limits } = await getCurrentPlan(ctx.tenantId);
      return { error: format(c.errors.limit, { max: limits.applications ?? 0 }) };
    }
    if (error instanceof NotFoundError) return { error: c.errors.generic };
    throw error;
  }

  revalidatePath("/portal/casting", "layout");
  return { done: true };
}

export async function withdrawAction(fd: FormData): Promise<void> {
  const ctx = await context();
  const id = (fd.get("id") ?? "").toString();
  if (!ctx || !id) return;

  try {
    await requirePermission(ctx.userId, ctx.tenantId, "profile.edit");
    await withdrawApplication(ctx.tenantId, ctx.userId, id);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) return;
    throw error;
  }
  revalidatePath("/portal/casting", "layout");
}
