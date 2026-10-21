import { prisma } from "../../lib/db/prisma";
import { ForbiddenError } from "../../lib/errors";

export type PlatformRoleName = "SUPER_ADMIN" | "ADMIN" | "SUPPORT";

/** All permission keys the user has inside one tenant (empty set if not a member). */
export async function getTenantPermissions(
  userId: string,
  tenantId: string,
): Promise<Set<string>> {
  const member = await prisma.tenantMember.findFirst({
    where: {
      userId,
      tenantId,
      status: "ACTIVE",
      user: { status: "ACTIVE" },
      tenant: { status: { in: ["ACTIVE", "PENDING"] }, deletedAt: null },
    },
    select: {
      role: {
        select: {
          permissions: { select: { permission: { select: { key: true } } } },
        },
      },
    },
  });

  const keys = member?.role.permissions.map((rp) => rp.permission.key) ?? [];
  return new Set(keys);
}

export async function hasPermission(
  userId: string,
  tenantId: string,
  permission: string,
): Promise<boolean> {
  const permissions = await getTenantPermissions(userId, tenantId);
  return permissions.has(permission);
}

export async function requirePermission(
  userId: string,
  tenantId: string,
  permission: string,
): Promise<void> {
  if (!(await hasPermission(userId, tenantId, permission))) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
}

export function hasPlatformRole(
  role: PlatformRoleName | null | undefined,
  allowed: PlatformRoleName[],
): boolean {
  return !!role && allowed.includes(role);
}

export function requirePlatformRole(
  role: PlatformRoleName | null | undefined,
  allowed: PlatformRoleName[],
): void {
  if (!hasPlatformRole(role, allowed)) {
    throw new ForbiddenError("Platform permission required");
  }
}
