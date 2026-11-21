import { prisma } from "../../lib/db/prisma";
import { notifyRenewalReminder } from "./notify";

export const REMINDER_DAYS = 7;

/**
 * Paid periods that end within a week, that nobody was told about yet,
 * and that have not already been renewed by a later paid period.
 */
export async function findSubscriptionsToRemind(now = new Date()) {
  const until = new Date(now.getTime() + REMINDER_DAYS * 24 * 60 * 60 * 1000);
  const candidates = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      reminderSentAt: null,
      startsAt: { lte: now },
      endsAt: { gt: now, lte: until },
    },
    include: { plan: { select: { name: true } } },
  });

  const due = [];
  for (const subscription of candidates) {
    const renewed = await prisma.subscription.findFirst({
      where: { tenantId: subscription.tenantId, status: "ACTIVE", endsAt: { gt: subscription.endsAt } },
      select: { id: true },
    });
    if (!renewed) due.push(subscription);
  }
  return due;
}

/** Run once a day. A reminder is marked as sent only when an email was really delivered, so it is tried again tomorrow otherwise. */
export async function sendRenewalReminders(now = new Date()) {
  const due = await findSubscriptionsToRemind(now);
  let sent = 0;
  for (const subscription of due) {
    const delivered = await notifyRenewalReminder(subscription.tenantId, subscription.plan.name, subscription.endsAt);
    if (delivered) {
      await prisma.subscription.update({ where: { id: subscription.id }, data: { reminderSentAt: now } });
      sent += 1;
    }
  }
  return { due: due.length, sent };
}
