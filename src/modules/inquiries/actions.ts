"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { auth } from "@/auth";
import { ForbiddenError, LimitError, NotFoundError, ValidationError } from "@/lib/errors";
import { getDictionary } from "@/lib/i18n/server";
import { requirePermission } from "@/modules/roles/permissions";
import { createInquirySchema } from "./schema";
import { notifyOwnerOfInquiry } from "./notify";
import {
  STATUSES,
  addInquiryNote,
  createInquiry,
  setInquiryStatus,
  type InquiryStatusName,
} from "./service";
import { hashIp, verifyFormToken } from "./spam";

export type InquiryFormState = { error?: string; done?: boolean } | undefined;

/** The public contact form. Anyone may use it, so it is guarded against robots and floods. */
export async function submitInquiryAction(
  _prev: InquiryFormState,
  fd: FormData,
): Promise<InquiryFormState> {
  const { t, locale } = await getDictionary();
  const text = (key: string) => (fd.get(key) ?? "").toString();

  // 1. A hidden field that people never see. Robots fill it in. They are told "thank you" and ignored.
  if (text("contact_url").trim() !== "") return { done: true };

  // 2. The form must have been open for a few seconds, and must come from this site.
  const secret = process.env.AUTH_SECRET ?? "";
  const check = verifyFormToken(text("token"), secret);
  if (check === "too_fast") return { error: t.inquiryErrors.tooFast };
  if (check !== "ok") return { error: t.inquiryErrors.expired };

  // 3. The content.
  const parsed = createInquirySchema(t.inquiryErrors).safeParse({
    type: text("type"),
    senderName: text("senderName"),
    senderEmail: text("senderEmail"),
    senderPhone: text("senderPhone"),
    company: text("company"),
    projectName: text("projectName"),
    message: text("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t.inquiryErrors.generic };

  const forwarded = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();

  try {
    const created = await createInquiry({
      slug: text("slug"),
      input: parsed.data,
      ipHash: hashIp(forwarded || "unknown", secret),
      locale,
    });
    // The email is sent after the visitor has already received their answer.
    after(() => notifyOwnerOfInquiry(created.id, created.tenantId));
  } catch (error) {
    if (error instanceof NotFoundError) return { error: t.inquiryErrors.unavailable };
    if (error instanceof LimitError) return { error: t.inquiryErrors.tooMany };
    throw error;
  }

  return { done: true };
}

async function memberContext() {
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.activeTenantId; // from the session, never from the form
  return userId && tenantId ? { userId, tenantId } : null;
}

export async function setInquiryStatusAction(fd: FormData): Promise<void> {
  const ctx = await memberContext();
  const id = (fd.get("id") ?? "").toString();
  const status = (fd.get("status") ?? "").toString();
  if (!ctx || !id || !(STATUSES as readonly string[]).includes(status)) return;

  try {
    await requirePermission(ctx.userId, ctx.tenantId, "inquiries.reply");
    await setInquiryStatus(ctx.tenantId, ctx.userId, id, status as InquiryStatusName);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) return;
    throw error;
  }
  revalidatePath("/portal", "layout");
}

export async function addInquiryNoteAction(fd: FormData): Promise<void> {
  const ctx = await memberContext();
  const id = (fd.get("id") ?? "").toString();
  if (!ctx || !id) return;

  try {
    await requirePermission(ctx.userId, ctx.tenantId, "inquiries.reply");
    await addInquiryNote(ctx.tenantId, ctx.userId, id, (fd.get("body") ?? "").toString());
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError || error instanceof ValidationError) return;
    throw error;
  }
  revalidatePath(`/portal/inbox/${id}`);
}
