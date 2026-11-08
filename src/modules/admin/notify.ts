import { prisma } from "../../lib/db/prisma";
import { sendEmail } from "../../lib/email";
import { DEFAULT_LOCALE, isLocale } from "../../lib/i18n/config";
import { dictionaries } from "../../lib/i18n/dictionaries";
import { format } from "../../lib/i18n/format";
import type { TenantAction } from "./transitions";

/** Tells the owner(s) of an account what the admin decided. Does nothing when email is not set up. */
export async function notifyTenantOwners(tenantId: string, action: TenantAction, reason?: string | null) {
  const [tenant, owners] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { defaultLocale: true } }),
    prisma.tenantMember.findMany({
      where: { tenantId, status: "ACTIVE", role: { key: "owner" }, user: { status: "ACTIVE" } },
      select: { user: { select: { email: true } } },
    }),
  ]);
  const locale = isLocale(tenant?.defaultLocale) ? tenant.defaultLocale : DEFAULT_LOCALE;
  const m = dictionaries[locale].emails;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  let subject: string;
  let text: string;
  if (action === "approve" || action === "reactivate") {
    subject = m.approvedSubject;
    text = format(m.approvedText, { url: base ? `${base}/login` : "Foliora" });
  } else if (action === "suspend") {
    subject = m.suspendedSubject;
    text = m.suspendedText;
  } else {
    subject = m.rejectedSubject;
    text = m.rejectedText;
  }
  if (reason?.trim() && action !== "approve" && action !== "reactivate") {
    text += `\n\n${format(m.reasonLine, { reason: reason.trim() })}`;
  }

  for (const owner of owners) await sendEmail({ to: owner.user.email, subject, text });
}
