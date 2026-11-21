import { prisma } from "../../lib/db/prisma";
import { tenantDb } from "../../lib/db/tenant";
import { LimitError, NotFoundError, ValidationError } from "../../lib/errors";
import { writeAudit } from "../audit/service";
import {
  DEFAULT_LIMITS,
  makeCode,
  pickActive,
  priceFor,
  readLimits,
  type BillingPeriodName,
  type PlanLimits,
} from "./rules";

export const MAX_PENDING_REQUESTS = 3;

export type CurrentPlan = {
  key: string;
  name: string;
  limits: PlanLimits;
  endsAt: Date | null;
  isFree: boolean;
};

export async function listPaidPlans() {
  return prisma.plan.findMany({
    where: { isActive: true, key: { not: "free" } },
    orderBy: { sortOrder: "asc" },
  });
}

/** The plan an account has right now. Without a paid period that is still running, it is the Free plan. */
export async function getCurrentPlan(tenantId: string, now = new Date()): Promise<CurrentPlan> {
  const subscriptions = await tenantDb(tenantId).subscription.findMany({
    where: { status: "ACTIVE", startsAt: { lte: now }, endsAt: { gt: now } },
    include: { plan: true },
  });
  const active = pickActive(subscriptions);
  if (active) {
    return {
      key: active.plan.key,
      name: active.plan.name,
      limits: readLimits(active.plan.limits),
      endsAt: active.endsAt,
      isFree: false,
    };
  }

  const free = await prisma.plan.findUnique({ where: { key: "free" } });
  return {
    key: "free",
    name: free?.name ?? "Free",
    limits: free ? readLimits(free.limits) : DEFAULT_LIMITS,
    endsAt: null,
    isFree: true,
  };
}

export async function listMyRequests(tenantId: string) {
  return tenantDb(tenantId).paymentRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { plan: { select: { name: true } } },
  });
}

/** "I want this plan." Creates a request with a code for the bank transfer. */
export async function createPaymentRequest(
  tenantId: string,
  actorUserId: string,
  planKey: string,
  period: BillingPeriodName,
) {
  if (period !== "MONTHLY" && period !== "YEARLY") throw new ValidationError("period");

  const plan = await prisma.plan.findFirst({ where: { key: planKey, isActive: true } });
  if (!plan || plan.key === "free") throw new ValidationError("plan");
  const amount = priceFor(plan, period);
  if (amount <= 0) throw new ValidationError("plan");

  const db = tenantDb(tenantId);
  const waiting = await db.paymentRequest.count({ where: { status: "PENDING" } });
  if (waiting >= MAX_PENDING_REQUESTS) throw new LimitError("Too many waiting requests");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const created = await db.paymentRequest.create({
        data: { tenantId, planId: plan.id, period, amount, code: makeCode() },
      });
      await writeAudit({
        tenantId,
        actorUserId,
        action: "payment.request",
        targetType: "PaymentRequest",
        targetId: created.id,
        after: { plan: plan.key, period, amount },
      });
      return created;
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002") throw error; // a clash on the code: try another one
    }
  }
  throw new Error("Could not make a payment code");
}

/** "I have paid": tells the admin whom to look for in the bank statement. */
export async function markPaid(
  tenantId: string,
  actorUserId: string,
  requestId: string,
  details: { payerName: string; bankReference: string | null; transferDate: Date },
) {
  const payerName = details.payerName.trim();
  if (payerName.length < 2 || payerName.length > 100) throw new ValidationError("name");
  if (Number.isNaN(details.transferDate.getTime())) throw new ValidationError("date");
  const reference = details.bankReference?.trim().slice(0, 60) || null;

  const result = await tenantDb(tenantId).paymentRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { payerName, bankReference: reference, transferDate: details.transferDate, paidMarkedAt: new Date() },
  });
  if (result.count === 0) throw new NotFoundError("Request not found");
  await writeAudit({ tenantId, actorUserId, action: "payment.paid", targetType: "PaymentRequest", targetId: requestId });
}

export async function cancelRequest(tenantId: string, actorUserId: string, requestId: string) {
  const result = await tenantDb(tenantId).paymentRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { status: "CANCELED" },
  });
  if (result.count === 0) throw new NotFoundError("Request not found");
  await writeAudit({ tenantId, actorUserId, action: "payment.cancel", targetType: "PaymentRequest", targetId: requestId });
}
