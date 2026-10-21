import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/db/prisma";
import { tenantDb } from "../../src/lib/db/tenant";
import { writeAudit } from "../../src/modules/audit/service";
import {
  getTenantPermissions,
  requirePermission,
} from "../../src/modules/roles/permissions";

const stamp = Date.now();

let tenantA: { id: string };
let tenantB: { id: string };
let userA: { id: string };
let userB: { id: string };
let userViewer: { id: string };
let memberB: { id: string };

beforeAll(async () => {
  const owner = await prisma.role.findFirstOrThrow({ where: { tenantId: null, key: "owner" } });
  const viewer = await prisma.role.findFirstOrThrow({ where: { tenantId: null, key: "viewer" } });

  tenantA = await prisma.tenant.create({
    data: { type: "INDIVIDUAL", name: `Isolation A ${stamp}`, status: "ACTIVE" },
  });
  tenantB = await prisma.tenant.create({
    data: { type: "INDIVIDUAL", name: `Isolation B ${stamp}`, status: "ACTIVE" },
  });

  userA = await prisma.user.create({
    data: { email: `iso-a-${stamp}@example.test`, name: "Owner A" },
  });
  userB = await prisma.user.create({
    data: { email: `iso-b-${stamp}@example.test`, name: "Owner B" },
  });
  userViewer = await prisma.user.create({
    data: { email: `iso-v-${stamp}@example.test`, name: "Viewer A" },
  });

  await prisma.tenantMember.create({
    data: { tenantId: tenantA.id, userId: userA.id, roleId: owner.id },
  });
  memberB = await prisma.tenantMember.create({
    data: { tenantId: tenantB.id, userId: userB.id, roleId: owner.id },
  });
  await prisma.tenantMember.create({
    data: { tenantId: tenantA.id, userId: userViewer.id, roleId: viewer.id },
  });

  await writeAudit({ tenantId: tenantA.id, actorUserId: userA.id, action: "test.a" });
  await writeAudit({ tenantId: tenantB.id, actorUserId: userB.id, action: "test.b" });
});

afterAll(async () => {
  const tenantIds = [tenantA.id, tenantB.id];
  await prisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await prisma.user.deleteMany({
    where: { id: { in: [userA.id, userB.id, userViewer.id] } },
  });
  await prisma.$disconnect();
});

describe("tenant isolation (data layer)", () => {
  it("lists only the members of its own tenant", async () => {
    const members = await tenantDb(tenantA.id).tenantMember.findMany();
    expect(members).toHaveLength(2);
    expect(members.every((m) => m.tenantId === tenantA.id)).toBe(true);
    expect(members.some((m) => m.id === memberB.id)).toBe(false);
  });

  it("ignores an attempt to filter by another tenant's id", async () => {
    const result = await tenantDb(tenantA.id).tenantMember.findFirst({
      where: { tenantId: tenantB.id },
    });
    expect(result?.tenantId).not.toBe(tenantB.id);
  });

  it("cannot read another tenant's row by id", async () => {
    const result = await tenantDb(tenantA.id).tenantMember.findUnique({
      where: { id: memberB.id },
    });
    expect(result).toBeNull();
  });

  it("cannot update another tenant's row", async () => {
    await expect(
      tenantDb(tenantA.id).tenantMember.update({
        where: { id: memberB.id },
        data: { status: "REMOVED" },
      }),
    ).rejects.toThrow();

    const untouched = await prisma.tenantMember.findUniqueOrThrow({ where: { id: memberB.id } });
    expect(untouched.status).toBe("ACTIVE");
  });

  it("updateMany does not touch another tenant's rows", async () => {
    const result = await tenantDb(tenantA.id).tenantMember.updateMany({
      where: { id: memberB.id },
      data: { status: "REMOVED" },
    });
    expect(result.count).toBe(0);
  });

  it("deleteMany does not delete another tenant's rows", async () => {
    const result = await tenantDb(tenantA.id).tenantMember.deleteMany({
      where: { id: memberB.id },
    });
    expect(result.count).toBe(0);
    const stillThere = await prisma.tenantMember.findUnique({ where: { id: memberB.id } });
    expect(stillThere).not.toBeNull();
  });

  it("forces its own tenantId when creating rows", async () => {
    const created = await tenantDb(tenantA.id).auditLog.create({
      data: { action: "test.create", tenantId: tenantB.id },
    });
    expect(created.tenantId).toBe(tenantA.id);
  });

  it("reads only its own audit logs", async () => {
    const logs = await tenantDb(tenantA.id).auditLog.findMany();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.every((log) => log.tenantId === tenantA.id)).toBe(true);
  });

  it("refuses to move a row to another tenant", async () => {
    await expect(
      tenantDb(tenantA.id).auditLog.updateMany({
        where: { action: "test.a" },
        data: { tenantId: tenantB.id },
      }),
    ).rejects.toThrow(/tenantId/);
  });
});

describe("permissions (RBAC)", () => {
  it("gives an owner permissions in their own tenant only", async () => {
    const inA = await getTenantPermissions(userA.id, tenantA.id);
    const inB = await getTenantPermissions(userA.id, tenantB.id);
    expect(inA.has("profile.edit")).toBe(true);
    expect(inB.size).toBe(0);
    await expect(requirePermission(userA.id, tenantB.id, "profile.view")).rejects.toThrow();
  });

  it("limits a viewer to read-only permissions", async () => {
    await expect(requirePermission(userViewer.id, tenantA.id, "profile.view")).resolves.toBeUndefined();
    await expect(requirePermission(userViewer.id, tenantA.id, "media.upload")).rejects.toThrow();
  });
});
