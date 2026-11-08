import { prisma } from "../../lib/db/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "../../lib/errors";
import { writeAudit } from "../audit/service";
import { applyAction, type TenantAction, type TenantStatusName } from "./transitions";

export type PlatformRoleName = "SUPER_ADMIN" | "ADMIN" | "SUPPORT";
export const VIEW_ROLES: PlatformRoleName[] = ["SUPER_ADMIN", "ADMIN", "SUPPORT"];
export const MANAGE_ROLES: PlatformRoleName[] = ["SUPER_ADMIN", "ADMIN"];

/**
 * Checks the DATABASE (not the sign-in cookie), so a role that was taken away stops working at once.
 * Throws ForbiddenError for anyone who is not active platform staff with one of the allowed roles.
 */
export async function requirePlatformUser(userId: string, allowed: PlatformRoleName[]) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { platformRole: true, status: true, email: true },
  });
  if (!user || user.status !== "ACTIVE" || !user.platformRole || !allowed.includes(user.platformRole)) {
    throw new ForbiddenError("Platform access required");
  }
  return { role: user.platformRole, email: user.email };
}

/** The platform role of a user, or null. Used to decide whether /admin exists for them. */
export async function getPlatformRole(userId: string): Promise<PlatformRoleName | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { platformRole: true, status: true },
  });
  return user?.status === "ACTIVE" ? (user.platformRole ?? null) : null;
}

export async function getDashboardStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [byStatus, users, published, inquiriesWeek, newTenantsWeek] = await Promise.all([
    prisma.tenant.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.user.count(),
    prisma.portfolio.count({ where: { status: "PUBLISHED" } }),
    prisma.inquiry.count({ where: { createdAt: { gte: weekAgo }, status: { not: "SPAM" } } }),
    prisma.tenant.count({ where: { createdAt: { gte: weekAgo }, deletedAt: null } }),
  ]);

  const tenants: Record<TenantStatusName, number> = { PENDING: 0, ACTIVE: 0, SUSPENDED: 0, CLOSED: 0 };
  for (const group of byStatus) tenants[group.status] = group._count._all;
  return { tenants, users, published, inquiriesWeek, newTenantsWeek };
}

export type TenantFilter = { status?: TenantStatusName; q?: string };

export async function listTenants(filter: TenantFilter = {}, take = 100) {
  const q = filter.q?.trim();
  return prisma.tenant.findMany({
    where: {
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { members: { some: { user: { email: { contains: q, mode: "insensitive" as const } } } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      createdAt: true,
      members: {
        where: { role: { key: "owner" } },
        select: { user: { select: { email: true, name: true } } },
        take: 1,
      },
      profiles: { select: { portfolio: { select: { slug: true, status: true } } }, take: 1 },
    },
  });
}

export async function getTenantDetail(id: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      defaultLocale: true,
      createdAt: true,
      deletedAt: true,
      members: {
        where: { status: "ACTIVE" },
        select: {
          role: { select: { name: true, key: true } },
          user: { select: { email: true, name: true, lastLoginAt: true } },
        },
      },
      profiles: {
        select: { stageName: true, portfolio: { select: { slug: true, status: true, publishedAt: true } } },
        take: 1,
      },
    },
  });
  if (!tenant || tenant.deletedAt) return null;

  const [photos, works, showreels, inquiries, audit] = await Promise.all([
    prisma.photo.count({ where: { tenantId: id } }),
    prisma.work.count({ where: { tenantId: id } }),
    prisma.showreel.count({ where: { tenantId: id } }),
    prisma.inquiry.count({ where: { tenantId: id, status: { not: "SPAM" } } }),
    prisma.auditLog.findMany({
      where: { OR: [{ tenantId: id }, { tenantId: null, targetType: "Tenant", targetId: id }] },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { actor: { select: { email: true } } },
    }),
  ]);
  return { tenant, counts: { photos, works, showreels, inquiries }, audit };
}

/** Approve, reject, suspend or reactivate an account. Only ADMIN and SUPER_ADMIN may do it. */
export async function setTenantStatus(
  adminUserId: string,
  tenantId: string,
  action: TenantAction,
  reason?: string | null,
) {
  await requirePlatformUser(adminUserId, MANAGE_ROLES);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { status: true, deletedAt: true },
  });
  if (!tenant || tenant.deletedAt) throw new NotFoundError("Account not found");

  const next = applyAction(tenant.status, action);
  if (!next) throw new ValidationError("transition");

  // "where status = what we just read" stops two admins from overwriting each other's decision.
  const result = await prisma.tenant.updateMany({
    where: { id: tenantId, status: tenant.status },
    data: { status: next },
  });
  if (result.count === 0) throw new ValidationError("transition");

  const note = reason?.trim() ? reason.trim().slice(0, 500) : undefined;
  await writeAudit({
    tenantId: null, // a platform action, not an action of the account itself
    actorUserId: adminUserId,
    action: `tenant.${action}`,
    targetType: "Tenant",
    targetId: tenantId,
    before: { status: tenant.status },
    after: { status: next, reason: note },
  });
  return next;
}

export async function listPlatformAudit(adminUserId: string, take = 100) {
  await requirePlatformUser(adminUserId, VIEW_ROLES);
  return prisma.auditLog.findMany({
    where: { tenantId: null },
    orderBy: { createdAt: "desc" },
    take,
    include: { actor: { select: { email: true } } },
  });
}
