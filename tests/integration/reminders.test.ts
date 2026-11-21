import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/db/prisma";
import { registerUser } from "../../src/modules/auth/service";
import { REMINDER_DAYS, findSubscriptionsToRemind } from "../../src/modules/billing/reminders";

const stamp = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-12-01T00:00:00Z");

let a: { userId: string; tenantId: string };
let b: { userId: string; tenantId: string };
let proId: string;

const give = (tenantId: string, startsInDays: number, endsInDays: number, extra: Record<string, unknown> = {}) =>
  prisma.subscription.create({
    data: {
      tenantId,
      planId: proId,
      period: "MONTHLY",
      startsAt: new Date(now.getTime() + startsInDays * DAY),
      endsAt: new Date(now.getTime() + endsInDays * DAY),
      ...extra,
    },
  });

/** Only the two accounts of this test, so that other data in the database cannot disturb it. */
const dueFor = async () => {
  const due = await findSubscriptionsToRemind(now);
  return due.filter((s) => s.tenantId === a.tenantId || s.tenantId === b.tenantId);
};

beforeAll(async () => {
  await prisma.plan.upsert({
    where: { key: "pro" },
    update: {},
    create: { key: "pro", name: "Pro", monthlyPrice: 2500, yearlyPrice: 25000, sortOrder: 1, limits: { photos: 200, showreels: 5 } },
  });
  proId = (await prisma.plan.findUniqueOrThrow({ where: { key: "pro" } })).id;

  a = await registerUser({
    name: "Remind A",
    email: `remind-a-${stamp}@example.test`,
    password: "a-long-password-123",
    accountType: "INDIVIDUAL",
    tenantName: `Remind Tenant A ${stamp}`,
  });
  b = await registerUser({
    name: "Remind B",
    email: `remind-b-${stamp}@example.test`,
    password: "a-long-password-123",
    accountType: "INDIVIDUAL",
    tenantName: `Remind Tenant B ${stamp}`,
  });
});

afterAll(async () => {
  const tenantIds = [a.tenantId, b.tenantId];
  await prisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.subscription.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [a.userId, b.userId] } } });
  await prisma.$disconnect();
});

describe("which accounts get a reminder", () => {
  it("those whose paid period ends within the reminder window", async () => {
    await give(a.tenantId, -27, 3);
    const due = await dueFor();
    expect(due.map((s) => s.tenantId)).toEqual([a.tenantId]);
    expect(due[0].plan.name).toBe("Pro");
  });

  it("not those whose period ends later, or ended already", async () => {
    await give(b.tenantId, -10, REMINDER_DAYS + 13); // ends in 20 days
    await give(b.tenantId, -40, -1); // ended yesterday
    expect((await dueFor()).map((s) => s.tenantId)).toEqual([a.tenantId]);
  });

  it("not those who already renewed", async () => {
    await give(a.tenantId, 3, 33); // the next month, already paid
    expect(await dueFor()).toEqual([]);
  });

  it("not those who were already reminded", async () => {
    await give(b.tenantId, -28, 2, { reminderSentAt: new Date(now.getTime() - DAY) });
    expect(await dueFor()).toEqual([]);
  });
});
