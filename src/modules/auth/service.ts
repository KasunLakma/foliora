import bcrypt from "bcryptjs";
import { prisma } from "../../lib/db/prisma";
import type { RegisterInput } from "./schema";

export class EmailTakenError extends Error {
    constructor() {
        super("This email is already registered");
        this.name = "EmailTakenError";
    }
}

type RequestMeta = { ip?: string; userAgent?: string };

/** Creates the user, the tenant and the Owner membership in ONE transaction. */
export async function registerUser(input: RegisterInput, meta: RequestMeta = {}) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const status = process.env.REGISTRATION_APPROVAL_MODE === "auto" ? "ACTIVE" : "PENDING";

    try {
        return await prisma.$transaction(async (tx) => {
            const ownerRole = await tx.role.findFirst({
                where: { tenantId: null, key: "owner" },
            });
            if (!ownerRole) {
                throw new Error("System roles are missing. Run: npx tsx prisma/seed.ts");
            }

            const user = await tx.user.create({
                data: { email: input.email, name: input.name, passwordHash },
            });
            const tenant = await tx.tenant.create({
                data: { type: input.accountType, name: input.tenantName, status },
            });
            await tx.tenantMember.create({
                data: { tenantId: tenant.id, userId: user.id, roleId: ownerRole.id },
            });
            await tx.auditLog.create({
                data: {
                    tenantId: tenant.id,
                    actorUserId: user.id,
                    action: "tenant.register",
                    targetType: "Tenant",
                    targetId: tenant.id,
                    ip: meta.ip,
                    userAgent: meta.userAgent,
                },
            });

            return { userId: user.id, tenantId: tenant.id };
        });
    } catch (error) {
        if ((error as { code?: string }).code === "P2002") throw new EmailTakenError();
        throw error;
    }
}