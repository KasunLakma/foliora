import { prisma } from "../../lib/db/prisma";
import { sendEmail } from "../../lib/email";
import { DEFAULT_LOCALE, isLocale } from "../../lib/i18n/config";
import { dictionaries } from "../../lib/i18n/dictionaries";
import { format } from "../../lib/i18n/format";

/** Emails the owner(s) of the account about a new message. Does nothing for spam or when email is not set up. */
export async function notifyOwnerOfInquiry(inquiryId: string, tenantId: string) {
  const [inquiry, tenant, owners] = await Promise.all([
    prisma.inquiry.findFirst({ where: { id: inquiryId, tenantId } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { defaultLocale: true } }),
    prisma.tenantMember.findMany({
      where: { tenantId, status: "ACTIVE", role: { key: "owner" }, user: { status: "ACTIVE" } },
      select: { user: { select: { email: true } } },
    }),
  ]);
  if (!inquiry || inquiry.status === "SPAM") return;

  const locale = isLocale(tenant?.defaultLocale) ? tenant.defaultLocale : DEFAULT_LOCALE;
  const m = dictionaries[locale].emails;
  const typeLabel = dictionaries[locale].inquiryTypes[inquiry.type];
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  const lines = [
    m.intro,
    "",
    `${m.from}: ${inquiry.senderName} <${inquiry.senderEmail}>`,
    inquiry.senderPhone ? `${m.phone}: ${inquiry.senderPhone}` : null,
    inquiry.company ? `${m.company}: ${inquiry.company}` : null,
    inquiry.projectName ? `${m.project}: ${inquiry.projectName}` : null,
    `${m.type}: ${typeLabel}`,
    "",
    `${m.message}:`,
    inquiry.message,
    "",
    base ? format(m.open, { url: `${base}/portal/inbox/${inquiry.id}` }) : null,
    format(m.replyHint, { name: inquiry.senderName }),
  ];
  const text = lines.filter((line) => line !== null).join("\n");

  for (const owner of owners) {
    await sendEmail({
      to: owner.user.email,
      subject: format(m.subject, { name: inquiry.senderName }),
      text,
      replyTo: inquiry.senderEmail,
    });
  }
}
