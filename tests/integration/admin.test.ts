import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/db/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "../../src/lib/errors";
import {
  MANAGE_ROLES,
  VIEW_ROLES,
  getDashboardStats,
  getPlatformRole,
  getTenantDetail,
  listPlatformAudit,
  listTenants,
  requirePlatformUser,
  setTenantStatus,
} from "../../src/modules/admin/service";
import { registerUser } from "../../src/modules/auth/service";
import { getPublicPortfolio, saveSiteSettings, setPublished } from "../../src/modules/portfolio/service";

const stamp = Date.now();
const password = "a-long-password-123";
const slugA = `adm-a-${stamp}`;

let a: { userId: string; tenantId: string };
let b: { userId: string; tenantId: string };
let admin: { id: string };
let support: { id: string };
let plain: { id: string };
let disabled: { id: string };

const makeUser = (label: string, extra: Record<string, unknown>) =>
  prisma.user.create({
    data: { email: `adm-${label}-${stamp}@example.test`, name: `Staff ${label}`, ...extra },
    select: { id: true },
  });

beforeAll(async () => {
  a = await registerUser({
    name: "Admin Test A",
    email: `adm-owner-a-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Admin Tenant A ${stamp}`,
  });
  b = await registerUser({
    name: "Admin Test B",
    email: `adm-owner-b-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Admin Tenant B ${stamp}`,
  });
  await prisma.tenant.updateMany({ where: { id: { in: [a.tenantId, b.tenantId] } }, data: { status: "PENDING" } });

  admin = await makeUser("admin", { platformRole: "ADMIN" });
  support = await makeUser("support", { platformRole: "SUPPORT" });
  plain = await makeUser("plain", {});
  disabled = await makeUser("disabled", { platformRole: "SUPER_ADMIN", status: "DISABLED" });
});

afterAll(async () => {
  const staffIds = [admin.id, support.id, plain.id, disabled.id];
  const tenantIds = [a.tenantId, b.tenantId];
  await prisma.auditLog.deleteMany({
    where: { OR: [{ actorUserId: { in: staffIds } }, { tenantId: { in: tenantIds } }, { targetId: { in: tenantIds } }] },
  });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [...staffIds, a.userId, b.userId] } } });
  await prisma.$disconnect();
});

describe("who counts as platform staff", () => {
  it("checks the database and the allowed roles", async () => {
    await expect(requirePlatformUser(admin.id, MANAGE_ROLES)).resolves.toMatchObject({ role: "ADMIN" });
    await expect(requirePlatformUser(support.id, VIEW_ROLES)).resolves.toMatchObject({ role: "SUPPORT" });
    await expect(requirePlatformUser(support.id, MANAGE_ROLES)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requirePlatformUser(plain.id, VIEW_ROLES)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requirePlatformUser(disabled.id, VIEW_ROLES)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requirePlatformUser("no-such-user", VIEW_ROLES)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("tells whether the admin area exists for someone", async () => {
    expect(await getPlatformRole(admin.id)).toBe("ADMIN");
    expect(await getPlatformRole(plain.id)).toBeNull();
    expect(await getPlatformRole(disabled.id)).toBeNull();
  });
});

describe("deciding about accounts", () => {
  it("support staff and ordinary users cannot decide", async () => {
    await expect(setTenantStatus(support.id, a.tenantId, "approve")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(setTenantStatus(plain.id, a.tenantId, "approve")).rejects.toBeInstanceOf(ForbiddenError);
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: a.tenantId } });
    expect(tenant.status).toBe("PENDING");
  });

  it("an admin approves, and it is recorded as a staff action", async () => {
    expect(await setTenantStatus(admin.id, a.tenantId, "approve")).toBe("ACTIVE");

    const entry = await prisma.auditLog.findFirst({
      where: { action: "tenant.approve", targetId: a.tenantId },
    });
    expect(entry?.tenantId).toBeNull();
    expect(entry?.actorUserId).toBe(admin.id);
    expect(entry?.before).toEqual({ status: "PENDING" });

    await expect(setTenantStatus(admin.id, a.tenantId, "approve")).rejects.toBeInstanceOf(ValidationError);
    await expect(setTenantStatus(admin.id, "no-such-account", "approve")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("suspending hides the public page and reactivating brings it back", async () => {
    await saveSiteSettings(a.tenantId, a.userId, {
      slug: slugA,
      templateKey: "cinematic",
      seoTitle: null,
      seoDescription: null,
    });
    await setPublished(a.tenantId, a.userId, true);
    expect(await getPublicPortfolio(slugA)).not.toBeNull();

    await setTenantStatus(admin.id, a.tenantId, "suspend", "  Fake photos  ");
    expect(await getPublicPortfolio(slugA)).toBeNull();
    const suspended = await prisma.auditLog.findFirst({ where: { action: "tenant.suspend", targetId: a.tenantId } });
    expect(suspended?.after).toMatchObject({ status: "SUSPENDED", reason: "Fake photos" });

    await setTenantStatus(admin.id, a.tenantId, "reactivate");
    expect(await getPublicPortfolio(slugA)).not.toBeNull();
  });

  it("rejecting closes an account that was waiting, and it can be reopened", async () => {
    expect(await setTenantStatus(admin.id, b.tenantId, "reject", "Not a real person")).toBe("CLOSED");
    await expect(setTenantStatus(admin.id, b.tenantId, "suspend")).rejects.toBeInstanceOf(ValidationError);
    expect(await setTenantStatus(admin.id, b.tenantId, "reactivate")).toBe("ACTIVE");
  });
});

describe("looking at accounts", () => {
  it("finds accounts by name, by owner email and by status", async () => {
    const byEmail = await listTenants({ q: `adm-owner-a-${stamp}` });
    expect(byEmail.map((t) => t.id)).toContain(a.tenantId);
    expect(byEmail.find((t) => t.id === a.tenantId)?.members[0]?.user.email).toBe(`adm-owner-a-${stamp}@example.test`);

    const byName = await listTenants({ q: `Admin Tenant B ${stamp}` });
    expect(byName.map((t) => t.id)).toEqual([b.tenantId]);

    const closedOrPending = await listTenants({ status: "PENDING", q: String(stamp) });
    expect(closedOrPending.some((t) => t.id === a.tenantId || t.id === b.tenantId)).toBe(false);
  });

  it("gives an account's details and its history", async () => {
    const detail = await getTenantDetail(a.tenantId);
    expect(detail?.tenant.members[0].user.email).toBe(`adm-owner-a-${stamp}@example.test`);
    expect(detail?.counts).toEqual({ photos: 0, works: 0, showreels: 0, inquiries: 0 });
    expect(detail?.audit.map((e) => e.action)).toEqual(
      expect.arrayContaining(["tenant.approve", "tenant.suspend", "tenant.reactivate"]),
    );
    expect(await getTenantDetail("no-such-account")).toBeNull();
  });

  it("counts for the dashboard", async () => {
    const stats = await getDashboardStats();
    expect(stats.tenants.ACTIVE).toBeGreaterThanOrEqual(2);
    expect(stats.users).toBeGreaterThanOrEqual(6);
    expect(stats.published).toBeGreaterThanOrEqual(1);
    expect(stats.newTenantsWeek).toBeGreaterThanOrEqual(2);
  });

  it("shows the audit log to staff only", async () => {
    const entries = await listPlatformAudit(support.id);
    expect(entries.some((e) => e.action === "tenant.approve" && e.targetId === a.tenantId)).toBe(true);
    expect(entries.every((e) => e.tenantId === null)).toBe(true);
    await expect(listPlatformAudit(plain.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
