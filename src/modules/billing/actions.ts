"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ForbiddenError, LimitError, NotFoundError, ValidationError } from "@/lib/errors";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePermission } from "@/modules/roles/permissions";
import { MAX_PENDING_REQUESTS, cancelRequest, createPaymentRequest, markPaid } from "./service";

export type BillingFormState = { error?: string; done?: boolean } | undefined;

async function context() {
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.activeTenantId; // from the session, never from the form
  return userId && tenantId ? { userId, tenantId } : null;
}

export async function requestPlanAction(_prev: BillingFormState, fd: FormData): Promise<BillingFormState> {
  const { t } = await getDictionary();
  const ctx = await context();
  if (!ctx) return { error: t.billing.errors.signInAgain };

  try {
    await requirePermission(ctx.userId, ctx.tenantId, "billing.manage");
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: t.billing.errors.noPermission };
    throw error;
  }

  const period = (fd.get("period") ?? "").toString() === "YEARLY" ? "YEARLY" : "MONTHLY";
  try {
    await createPaymentRequest(ctx.tenantId, ctx.userId, (fd.get("planKey") ?? "").toString(), period);
  } catch (error) {
    if (error instanceof ValidationError) return { error: t.billing.errors.plan };
    if (error instanceof LimitError) return { error: format(t.billing.errors.tooMany, { max: MAX_PENDING_REQUESTS }) };
    throw error;
  }

  revalidatePath("/portal", "layout");
  return { done: true };
}

export async function markPaidAction(_prev: BillingFormState, fd: FormData): Promise<BillingFormState> {
  const { t } = await getDictionary();
  const ctx = await context();
  if (!ctx) return { error: t.billing.errors.signInAgain };

  try {
    await requirePermission(ctx.userId, ctx.tenantId, "billing.manage");
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: t.billing.errors.noPermission };
    throw error;
  }

  const text = (key: string) => (fd.get(key) ?? "").toString();
  const dateText = text("transferDate");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return { error: t.billing.errors.date };

  try {
    await markPaid(ctx.tenantId, ctx.userId, text("id"), {
      payerName: text("payerName"),
      bankReference: text("bankReference") || null,
      transferDate: new Date(`${dateText}T12:00:00Z`),
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return { error: error.message === "date" ? t.billing.errors.date : t.billing.errors.name };
    }
    if (error instanceof NotFoundError) return { error: t.billing.errors.notFound };
    throw error;
  }

  revalidatePath("/portal/billing");
  return { done: true };
}

export async function cancelRequestAction(fd: FormData): Promise<void> {
  const ctx = await context();
  const id = (fd.get("id") ?? "").toString();
  if (!ctx || !id) return;

  try {
    await requirePermission(ctx.userId, ctx.tenantId, "billing.manage");
    await cancelRequest(ctx.tenantId, ctx.userId, id);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) return;
    throw error;
  }
  revalidatePath("/portal/billing");
}
