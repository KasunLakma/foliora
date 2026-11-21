import { prisma } from "../../lib/db/prisma";
import { sendEmail } from "../../lib/email";
import { DEFAULT_LOCALE, isLocale } from "../../lib/i18n/config";
import { dictionaries } from "../../lib/i18n/dictionaries";
import { format } from "../../lib/i18n/format";

type Decision =
  | { kind: "approved"; planName: string; endsAt: Date }
  | { kind: "rejected"; planName: string; amount: number; reason: string | null };

/** Tells the owner(s) of an account what happened to their payment. Does nothing when email is not set up. */
export async function notifyPaymentDecision(tenantId: string, decision: Decision) {
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
  if (decision.kind === "approved") {
    const date = new Intl.DateTimeFormat(locale === "si" ? "si-LK" : "en-GB", { dateStyle: "medium" }).format(
      decision.endsAt,
    );
    subject = format(m.paymentApprovedSubject, { plan: decision.planName });
    text = format(m.paymentApprovedText, {
      plan: decision.planName,
      date,
      url: base ? `${base}/portal/billing` : "Foliora",
    });
  } else {
    subject = m.paymentRejectedSubject;
    text = format(m.paymentRejectedText, {
      plan: decision.planName,
      amount: `LKR ${decision.amount.toLocaleString("en-US")}`,
    });
    if (decision.reason) text += `\n\n${format(m.reasonLine, { reason: decision.reason })}`;
  }

  for (const owner of owners) await sendEmail({ to: owner.user.email, subject, text });
}
