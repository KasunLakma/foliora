import { prisma } from "../../lib/db/prisma";
import { tenantDb } from "../../lib/db/tenant";
import { ConflictError, LimitError, NotFoundError, ValidationError } from "../../lib/errors";
import { getCurrentPlan } from "../billing/service";
import { writeAudit } from "../audit/service";
import { monthStartSriLanka } from "./rules";

export type Eligibility = "ok" | "agency" | "not_active" | "no_profile" | "unpublished";

/** Only individual talents with an approved account and a published portfolio page can apply. */
export async function checkEligibility(tenantId: string): Promise<Eligibility> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { type: true, status: true } });
  if (!tenant || tenant.type === "AGENCY") return "agency";
  if (tenant.status !== "ACTIVE") return "not_active";

  const db = tenantDb(tenantId);
  const profile = await db.talentProfile.findFirst({ select: { id: true } });
  if (!profile) return "no_profile";
  const portfolio = await db.portfolio.findFirst({ select: { status: true, slug: true } });
  if (!portfolio || portfolio.status !== "PUBLISHED" || !portfolio.slug) return "unpublished";
  return "ok";
}

/** Open calls whose deadline has not passed, soonest deadline first, with this account's own application to each. */
export async function listOpenCalls(tenantId: string, now = new Date()) {
  const calls = await prisma.castingCall.findMany({
    where: { status: "OPEN", deadline: { gte: now } },
    orderBy: { deadline: "asc" },
    take: 100,
  });
  const mine = await tenantDb(tenantId).castingApplication.findMany({
    where: { callId: { in: calls.map((c) => c.id) } },
    select: { callId: true, status: true },
  });
  const byCall = new Map(mine.map((m) => [m.callId, m.status]));
  return calls.map((call) => ({ ...call, myStatus: byCall.get(call.id) ?? null }));
}

/** A call is visible to a talent while it is open, and afterwards only to those who applied. Drafts are never visible. */
export async function getCallForTalent(tenantId: string, id: string, now = new Date()) {
  const call = await prisma.castingCall.findUnique({ where: { id } });
  if (!call || call.status === "DRAFT") return null;

  const mine = await tenantDb(tenantId).castingApplication.findFirst({ where: { callId: id } });
  if (call.status !== "OPEN" && !mine) return null;
  return { call, mine, isOpen: call.status === "OPEN" && call.deadline >= now };
}

export async function applicationsThisMonth(tenantId: string, now = new Date()) {
  // withdrawn ones count too, so that withdrawing and applying again is not a way around the limit
  return tenantDb(tenantId).castingApplication.count({ where: { createdAt: { gte: monthStartSriLanka(now) } } });
}

export async function listMyApplications(tenantId: string) {
  return tenantDb(tenantId).castingApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { call: { select: { id: true, title: true, company: true, status: true } } },
  });
}

export async function applyToCall(
  tenantId: string,
  actorUserId: string,
  callId: string,
  message: string | null,
  now = new Date(),
) {
  const eligibility = await checkEligibility(tenantId);
  if (eligibility !== "ok") throw new ValidationError(eligibility);

  const call = await prisma.castingCall.findUnique({ where: { id: callId }, select: { status: true, deadline: true } });
  if (!call || call.status !== "OPEN" || call.deadline < now) throw new ValidationError("closed");

  const db = tenantDb(tenantId);
  if (await db.castingApplication.findFirst({ where: { callId }, select: { id: true } })) {
    throw new ConflictError("Already applied");
  }

  const { limits } = await getCurrentPlan(tenantId, now);
  if (limits.applications !== null && (await applicationsThisMonth(tenantId, now)) >= limits.applications) {
    throw new LimitError("Application limit reached");
  }

  const profile = await db.talentProfile.findFirst({ select: { id: true } });
  if (!profile) throw new NotFoundError("Profile not found");

  try {
    const created = await db.castingApplication.create({
      data: { tenantId, callId, profileId: profile.id, message: message?.trim().slice(0, 1000) || null },
    });
    await writeAudit({ tenantId, actorUserId, action: "casting.apply", targetType: "CastingApplication", targetId: created.id });
    return created.id;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new ConflictError("Already applied");
    throw error;
  }
}

export async function withdrawApplication(tenantId: string, actorUserId: string, applicationId: string) {
  const result = await tenantDb(tenantId).castingApplication.updateMany({
    where: { id: applicationId, status: { in: ["SUBMITTED", "SHORTLISTED"] } },
    data: { status: "WITHDRAWN" },
  });
  if (result.count === 0) throw new NotFoundError("Application not found");
  await writeAudit({ tenantId, actorUserId, action: "casting.withdraw", targetType: "CastingApplication", targetId: applicationId });
}
