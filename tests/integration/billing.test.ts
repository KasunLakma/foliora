import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/db/prisma";
import { ForbiddenError, LimitError, NotFoundError, ValidationError } from "../../src/lib/errors";
import { registerUser } from "../../src/modules/auth/service";
import { approvePayment, listPaymentRequests, rejectPayment } from "../../src/modules/billing/admin";
import { addPeriod } from "../../src/modules/billing/rules";
import {
  MAX_PENDING_REQUESTS,
  cancelRequest,
  createPaymentRequest,
  getCurrentPlan,
  listMyRequests,
  markPaid,
} from "../../src/modules/billing/service";

const stamp = Date.now();
const password = "a-long-password-123";

let a: { userId: string; tenantId: string };
let b: { userId: string; tenantId: string };
let admin: { id: string };
let support: { id: string };
let plain: { id: string };
let pro: { id: string; monthlyPrice: number; yearlyPrice: number };

const makeUser = (label: string, extra: Record<string, unknown>) =>
  prisma.user.create({
    data: { email: `bill-${label}-${stamp}@example.test`, name: `Billing ${label}`, ...extra },
    select: { id: true },
  });

beforeAll(async () => {
  // The plans are shared data. Create them only if they are missing, and never overwrite real prices.
  const plans = [
    { key: "free", name: "Free", monthlyPrice: 0, yearlyPrice: 0, sortOrder: 0, limits: { photos: 15, showreels: 5 } },
    { key: "pro", name: "Pro", monthlyPrice: 2500, yearlyPrice: 25000, sortOrder: 1, limits: { photos: 200, showreels: 5 } },
    { key: "agency", name: "Agency", monthlyPrice: 12500, yearlyPrice: 125000, sortOrder: 2, limits: { photos: 2000, showreels: 5 } },
  ];
  for (const plan of plans) await prisma.plan.upsert({ where: { key: plan.key }, update: {}, create: plan });
  pro = await prisma.plan.findUniqueOrThrow({
    where: { key: "pro" },
    select: { id: true, monthlyPrice: true, yearlyPrice: true },
  });

  a = await registerUser({
    name: "Bill A",
    email: `bill-owner-a-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Billing Tenant A ${stamp}`,
  });
  b = await registerUser({
    name: "Bill B",
    email: `bill-owner-b-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Billing Tenant B ${stamp}`,
  });
  admin = await makeUser("admin", { platformRole: "ADMIN" });
  support = await makeUser("support", { platformRole: "SUPPORT" });
  plain = await makeUser("plain", {});
});

afterAll(async () => {
  const tenantIds = [a.tenantId, b.tenantId];
  const staffIds = [admin.id, support.id, plain.id];
  const requests = await prisma.paymentRequest.findMany({ where: { tenantId: { in: tenantIds } }, select: { id: true } });

  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { actorUserId: { in: staffIds } },
        { tenantId: { in: tenantIds } },
        { targetType: "PaymentRequest", targetId: { in: requests.map((r) => r.id) } },
      ],
    },
  });
  await prisma.subscription.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.paymentRequest.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [...staffIds, a.userId, b.userId] } } });
  await prisma.$disconnect();
});

describe("the Free plan", () => {
  it("is what every new account has", async () => {
    const plan = await getCurrentPlan(a.tenantId);
    expect(plan).toMatchObject({ key: "free", isFree: true, endsAt: null });
    expect(plan.limits.photos).toBeGreaterThan(0);
  });
});

describe("asking for a plan", () => {
  const ids: string[] = [];

  it("creates a request with the price of the plan and a code for the bank transfer", async () => {
    const monthly = await createPaymentRequest(a.tenantId, a.userId, "pro", "MONTHLY");
    const yearly = await createPaymentRequest(a.tenantId, a.userId, "pro", "YEARLY");
    ids.push(monthly.id, yearly.id);

    expect(monthly).toMatchObject({ status: "PENDING", amount: pro.monthlyPrice, period: "MONTHLY" });
    expect(yearly.amount).toBe(pro.yearlyPrice);
    expect(monthly.code).toMatch(/^FOL-[A-Z0-9]{6}$/);
    expect(monthly.code).not.toBe(yearly.code);
  });

  it("refuses the Free plan, an unknown plan and a wrong period", async () => {
    await expect(createPaymentRequest(a.tenantId, a.userId, "free", "MONTHLY")).rejects.toBeInstanceOf(ValidationError);
    await expect(createPaymentRequest(a.tenantId, a.userId, "gold", "MONTHLY")).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createPaymentRequest(a.tenantId, a.userId, "pro", "WEEKLY" as unknown as "MONTHLY"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("allows only a few waiting requests at a time, and a canceled one makes room", async () => {
    const third = await createPaymentRequest(a.tenantId, a.userId, "agency", "MONTHLY");
    ids.push(third.id);
    expect(ids).toHaveLength(MAX_PENDING_REQUESTS);

    await expect(createPaymentRequest(a.tenantId, a.userId, "pro", "MONTHLY")).rejects.toBeInstanceOf(LimitError);

    await cancelRequest(a.tenantId, a.userId, ids[1]);
    await cancelRequest(a.tenantId, a.userId, ids[2]);
    const mine = await listMyRequests(a.tenantId);
    expect(mine.filter((r) => r.status === "CANCELED")).toHaveLength(2);
    await expect(cancelRequest(a.tenantId, a.userId, ids[1])).rejects.toBeInstanceOf(NotFoundError); // already canceled
  });

  it("records who paid and when, and checks the details", async () => {
    const date = new Date("2026-11-01T12:00:00Z");
    await expect(
      markPaid(a.tenantId, a.userId, ids[0], { payerName: "A", bankReference: null, transferDate: date }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      markPaid(a.tenantId, a.userId, ids[0], { payerName: "Kasun L", bankReference: null, transferDate: new Date("nope") }),
    ).rejects.toBeInstanceOf(ValidationError);

    await markPaid(a.tenantId, a.userId, ids[0], { payerName: "  Kasun Lakmal ", bankReference: "SLIP-123", transferDate: date });
    const request = (await listMyRequests(a.tenantId)).find((r) => r.id === ids[0]);
    expect(request).toMatchObject({ payerName: "Kasun Lakmal", bankReference: "SLIP-123" });
    expect(request?.paidMarkedAt).not.toBeNull();
  });

  it("another account cannot touch my request", async () => {
    await expect(
      markPaid(b.tenantId, b.userId, ids[0], { payerName: "Someone Else", bankReference: null, transferDate: new Date() }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(cancelRequest(b.tenantId, b.userId, ids[0])).rejects.toBeInstanceOf(NotFoundError);
    expect(await listMyRequests(b.tenantId)).toHaveLength(0);
  });
});

describe("approving payments", () => {
  let firstId: string;

  it("only an admin can approve", async () => {
    firstId = (await listMyRequests(a.tenantId)).find((r) => r.status === "PENDING")!.id;
    await expect(approvePayment(support.id, firstId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(approvePayment(plain.id, firstId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(approvePayment(admin.id, "no-such-request")).rejects.toBeInstanceOf(NotFoundError);
    expect((await getCurrentPlan(a.tenantId)).isFree).toBe(true);
  });

  it("starts a paid month and records it as a staff action", async () => {
    const before = Date.now();
    const result = await approvePayment(admin.id, firstId);
    expect(result.planName).toBe("Pro");
    expect(result.endsAt.getTime()).toBeGreaterThan(before + 27 * 24 * 3600 * 1000);
    expect(result.endsAt.getTime()).toBeLessThan(before + 32 * 24 * 3600 * 1000);

    const plan = await getCurrentPlan(a.tenantId);
    expect(plan).toMatchObject({ key: "pro", isFree: false });
    expect(plan.endsAt?.getTime()).toBe(result.endsAt.getTime());
    expect((await getCurrentPlan(b.tenantId)).isFree).toBe(true);

    const entry = await prisma.auditLog.findFirst({ where: { action: "payment.approve", targetId: firstId } });
    expect(entry?.tenantId).toBeNull();
    expect(entry?.actorUserId).toBe(admin.id);

    await expect(approvePayment(admin.id, firstId)).rejects.toBeInstanceOf(ValidationError); // not twice
  });

  it("a renewal starts when the running month ends, so no paid days are lost", async () => {
    const renewal = await createPaymentRequest(a.tenantId, a.userId, "pro", "MONTHLY");
    await approvePayment(admin.id, renewal.id);

    const subscriptions = await prisma.subscription.findMany({ where: { tenantId: a.tenantId }, orderBy: { startsAt: "asc" } });
    expect(subscriptions).toHaveLength(2);
    expect(subscriptions[1].startsAt.getTime()).toBe(subscriptions[0].endsAt.getTime());
    expect(subscriptions[1].endsAt.getTime()).toBe(addPeriod(subscriptions[0].endsAt, "MONTHLY").getTime());

    // after the first month the second one carries on
    const afterFirst = new Date(subscriptions[0].endsAt.getTime() + 24 * 3600 * 1000);
    const later = await getCurrentPlan(a.tenantId, afterFirst);
    expect(later).toMatchObject({ key: "pro" });
    expect(later.endsAt?.getTime()).toBe(subscriptions[1].endsAt.getTime());
  });

  it("the bigger plan counts, and an ended period goes back to Free", async () => {
    const agency = await createPaymentRequest(a.tenantId, a.userId, "agency", "MONTHLY");
    await approvePayment(admin.id, agency.id);
    expect((await getCurrentPlan(a.tenantId)).key).toBe("agency");

    const farFuture = new Date(Date.now() + 5 * 365 * 24 * 3600 * 1000);
    expect((await getCurrentPlan(a.tenantId, farFuture)).isFree).toBe(true);
  });
});

describe("rejecting payments", () => {
  it("records the reason, cannot be repeated, and leaves the account on Free", async () => {
    const request = await createPaymentRequest(b.tenantId, b.userId, "pro", "MONTHLY");
    const result = await rejectPayment(admin.id, request.id, "  No money found  ");
    expect(result.reason).toBe("No money found");

    const mine = (await listMyRequests(b.tenantId)).find((r) => r.id === request.id);
    expect(mine).toMatchObject({ status: "REJECTED", rejectReason: "No money found" });
    expect((await getCurrentPlan(b.tenantId)).isFree).toBe(true);

    await expect(rejectPayment(admin.id, request.id)).rejects.toBeInstanceOf(ValidationError);
    await expect(approvePayment(admin.id, request.id)).rejects.toBeInstanceOf(ValidationError);
    await expect(rejectPayment(support.id, request.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("the admin's list", () => {
  it("shows waiting and decided payments with the account, and only to staff", async () => {
    const decided = await listPaymentRequests(support.id, "decided");
    const row = decided.find((r) => r.tenantId === b.tenantId);
    expect(row?.tenantName).toBe(`Billing Tenant B ${stamp}`);
    expect(row?.ownerEmail).toBe(`bill-owner-b-${stamp}@example.test`);

    const pending = await listPaymentRequests(admin.id, "pending");
    expect(pending.every((r) => r.status === "PENDING")).toBe(true);

    await expect(listPaymentRequests(plain.id, "pending")).rejects.toBeInstanceOf(ForbiddenError);
  });
});
