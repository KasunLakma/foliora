import { prisma } from "../../lib/db/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { MANAGE_ROLES, VIEW_ROLES, requirePlatformUser } from "../admin/service";
import { writeAudit } from "../audit/service";
import { addPeriod } from "./rules";

export type PaymentFilter = "pending" | "decided";

export async function listPaymentRequests(adminUserId: string, filter: PaymentFilter) {
  await requirePlatformUser(adminUserId, VIEW_ROLES);

  const rows = await prisma.paymentRequest.findMany({
    where: filter === "pending" ? { status: "PENDING" } : { status: { not: "PENDING" } },
    orderBy: { createdAt: filter === "pending" ? "asc" : "desc" },
    take: 100,
    include: { plan: { select: { name: true, key: true } } },
  });
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: rows.map((r) => r.tenantId) } },
    select: {
      id: true,
      name: true,
      members: { where: { role: { key: "owner" } }, select: { user: { select: { email: true } } }, take: 1 },
    },
  });
  const byId = new Map(tenants.map((t) => [t.id, t]));
  return rows.map((row) => ({
    ...row,
    tenantName: byId.get(row.tenantId)?.name ?? "(deleted account)",
    ownerEmail: byId.get(row.tenantId)?.members[0]?.user.email ?? null,
  }));
}

export async function countPendingPayments() {
  return prisma.paymentRequest.count({ where: { status: "PENDING" } });
}

/**
 * The admin has seen the money in the bank account. This starts the paid period.
 * A renewal of the same plan starts when the current period ends, so no paid days are lost.
 */
export async function approvePayment(adminUserId: string, requestId: string) {
  await requirePlatformUser(adminUserId, MANAGE_ROLES);

  const request = await prisma.paymentRequest.findUnique({ where: { id: requestId }, include: { plan: true } });
  if (!request) throw new NotFoundError("Payment request not found");
  if (request.status !== "PENDING") throw new ValidationError("status");

  const now = new Date();
  const sameRunning = await prisma.subscription.findFirst({
    where: { tenantId: request.tenantId, planId: request.planId, status: "ACTIVE", endsAt: { gt: now } },
    orderBy: { endsAt: "desc" },
    select: { endsAt: true },
  });
  const startsAt = sameRunning?.endsAt ?? now;
  const endsAt = addPeriod(startsAt, request.period);

  await prisma.$transaction(
    async (tx) => {
      // "still pending" in the WHERE stops two admins from approving the same payment twice
      const updated = await tx.paymentRequest.updateMany({
        where: { id: requestId, status: "PENDING" },
        data: { status: "APPROVED", reviewedById: adminUserId, reviewedAt: now },
      });
      if (updated.count !== 1) throw new ValidationError("status");
      await tx.subscription.create({
        data: {
          tenantId: request.tenantId,
          planId: request.planId,
          period: request.period,
          startsAt,
          endsAt,
          paymentRequestId: requestId,
        },
      });
    },
    { maxWait: 20_000, timeout: 30_000 },
  );

  await writeAudit({
    tenantId: null,
    actorUserId: adminUserId,
    action: "payment.approve",
    targetType: "PaymentRequest",
    targetId: requestId,
    after: { tenantId: request.tenantId, plan: request.plan.key, period: request.period, endsAt: endsAt.toISOString() },
  });
  return { tenantId: request.tenantId, planName: request.plan.name, amount: request.amount, endsAt };
}

export async function rejectPayment(adminUserId: string, requestId: string, reason?: string | null) {
  await requirePlatformUser(adminUserId, MANAGE_ROLES);

  const request = await prisma.paymentRequest.findUnique({ where: { id: requestId }, include: { plan: true } });
  if (!request) throw new NotFoundError("Payment request not found");

  const note = reason?.trim() ? reason.trim().slice(0, 500) : null;
  const updated = await prisma.paymentRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { status: "REJECTED", reviewedById: adminUserId, reviewedAt: new Date(), rejectReason: note },
  });
  if (updated.count !== 1) throw new ValidationError("status");

  await writeAudit({
    tenantId: null,
    actorUserId: adminUserId,
    action: "payment.reject",
    targetType: "PaymentRequest",
    targetId: requestId,
    after: { tenantId: request.tenantId, reason: note ?? undefined },
  });
  return { tenantId: request.tenantId, planName: request.plan.name, amount: request.amount, reason: note };
}
