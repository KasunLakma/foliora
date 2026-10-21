import bcrypt from "bcryptjs";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/db/prisma";
import { EmailTakenError, registerUser } from "../../src/modules/auth/service";
import { requirePermission } from "../../src/modules/roles/permissions";

const stamp = Date.now();
const input = {
    name: "Reg Test",
    email: `reg-${stamp}@example.test`,
    password: "a-long-password-123",
    accountType: "INDIVIDUAL" as const,
    tenantName: `Reg Tenant ${stamp}`,
};
const created: { userId?: string; tenantId?: string } = {};

afterAll(async () => {
    if (created.tenantId) {
        await prisma.auditLog.deleteMany({ where: { tenantId: created.tenantId } });
        await prisma.tenant.deleteMany({ where: { id: created.tenantId } });
    }
    if (created.userId) await prisma.user.deleteMany({ where: { id: created.userId } });
    await prisma.$disconnect();
});

describe("registration", () => {
    it("creates a user, a tenant and an owner membership", async () => {
        const result = await registerUser(input);
        created.userId = result.userId;
        created.tenantId = result.tenantId;

        const user = await prisma.user.findUniqueOrThrow({ where: { id: result.userId } });
        expect(user.passwordHash).not.toBe(input.password);
        expect(await bcrypt.compare(input.password, user.passwordHash!)).toBe(true);

        await expect(
            requirePermission(result.userId, result.tenantId, "profile.edit"),
        ).resolves.toBeUndefined();

        const logs = await prisma.auditLog.findMany({
            where: { tenantId: result.tenantId, action: "tenant.register" },
        });
        expect(logs).toHaveLength(1);
    });

    it("rejects a duplicate email", async () => {
        await expect(registerUser(input)).rejects.toBeInstanceOf(EmailTakenError);
    });
});