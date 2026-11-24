import { prisma } from "../../lib/db/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { MANAGE_ROLES, VIEW_ROLES, requirePlatformUser } from "../admin/service";
import { writeAudit } from "../audit/service";
import { deadlineFromDate } from "./rules";
import type { CallInput } from "./schema";

export type CallStatusName = "DRAFT" | "OPEN" | "CLOSED";
export type ReviewStatus = "SUBMITTED" | "SHORTLISTED" | "NOT_SELECTED";
export const REVIEW_STATUSES: ReviewStatus[] = ["SUBMITTED", "SHORTLISTED", "NOT_SELECTED"];

const toData = (input: CallInput) => {
  const deadline = deadlineFromDate(input.deadline);
  if (!deadline) throw new ValidationError("deadline");
  return {
    title: input.title,
    company: input.company,
    role: input.role,
    description: input.description,
    gender: input.gender,
    ageMin: input.ageMin,
    ageMax: input.ageMax,
    location: input.location,
    compensation: input.compensation,
    deadline,
  };
};

export async function createCall(adminUserId: string, input: CallInput) {
  await requirePlatformUser(adminUserId, MANAGE_ROLES);
  const created = await prisma.castingCall.create({ data: { ...toData(input), createdById: adminUserId } });
  await writeAudit({
    tenantId: null,
    actorUserId: adminUserId,
    action: "casting.create",
    targetType: "CastingCall",
    targetId: created.id,
  });
  return created.id;
}

export async function updateCall(adminUserId: string, id: string, input: CallInput) {
  await requirePlatformUser(adminUserId, MANAGE_ROLES);
  const result = await prisma.castingCall.updateMany({ where: { id }, data: toData(input) });
  if (result.count === 0) throw new NotFoundError("Casting call not found");
  await writeAudit({ tenantId: null, actorUserId: adminUserId, action: "casting.update", targetType: "CastingCall", targetId: id });
}

/** Open it (it must still have a deadline in the future), close it, or reopen it. */
export async function setCallStatus(adminUserId: string, id: string, status: CallStatusName, now = new Date()) {
  await requirePlatformUser(adminUserId, MANAGE_ROLES);
  const call = await prisma.castingCall.findUnique({ where: { id }, select: { status: true, deadline: true, publishedAt: true } });
  if (!call) throw new NotFoundError("Casting call not found");

  const allowed: Record<CallStatusName, CallStatusName[]> = { DRAFT: ["OPEN"], OPEN: ["CLOSED"], CLOSED: ["OPEN"] };
  if (!allowed[call.status].includes(status)) throw new ValidationError("transition");
  if (status === "OPEN" && call.deadline < now) throw new ValidationError("deadline");

  await prisma.castingCall.update({
    where: { id },
    data: { status, publishedAt: status === "OPEN" && !call.publishedAt ? now : undefined },
  });
  await writeAudit({
    tenantId: null,
    actorUserId: adminUserId,
    action: `casting.${status.toLowerCase()}`,
    targetType: "CastingCall",
    targetId: id,
  });
}

export async function listCallsAdmin(adminUserId: string) {
  await requirePlatformUser(adminUserId, VIEW_ROLES);
  return prisma.castingCall.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { applications: true } } },
  });
}

/** One call with everyone who applied, and how to reach their portfolio. */
export async function getCallAdmin(adminUserId: string, id: string) {
  await requirePlatformUser(adminUserId, VIEW_ROLES);
  const call = await prisma.castingCall.findUnique({
    where: { id },
    include: { applications: { orderBy: { createdAt: "asc" } } },
  });
  if (!call) return null;

  const profiles = await prisma.talentProfile.findMany({
    where: { id: { in: call.applications.map((a) => a.profileId) } },
    select: {
      id: true,
      stageName: true,
      tenantId: true,
      portfolio: { select: { slug: true, status: true } },
    },
  });
  const owners = await prisma.tenantMember.findMany({
    where: { tenantId: { in: profiles.map((p) => p.tenantId) }, role: { key: "owner" }, status: "ACTIVE" },
    select: { tenantId: true, user: { select: { email: true } } },
  });
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const ownerByTenant = new Map(owners.map((o) => [o.tenantId, o.user.email]));

  return {
    call,
    applicants: call.applications.map((application) => {
      const profile = profileById.get(application.profileId);
      return {
        ...application,
        stageName: profile?.stageName ?? "(deleted profile)",
        slug: profile?.portfolio?.status === "PUBLISHED" ? profile.portfolio.slug : null,
        email: profile ? (ownerByTenant.get(profile.tenantId) ?? null) : null,
      };
    }),
  };
}

export async function setApplicationStatus(adminUserId: string, applicationId: string, status: ReviewStatus) {
  await requirePlatformUser(adminUserId, MANAGE_ROLES);
  if (!REVIEW_STATUSES.includes(status)) throw new ValidationError("status");

  // a withdrawn application is the talent's own decision, so it cannot be changed here
  const result = await prisma.castingApplication.updateMany({
    where: { id: applicationId, status: { not: "WITHDRAWN" } },
    data: { status },
  });
  if (result.count === 0) throw new ValidationError("status");
  await writeAudit({
    tenantId: null,
    actorUserId: adminUserId,
    action: "casting.review",
    targetType: "CastingApplication",
    targetId: applicationId,
    after: { status },
  });
}
