import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const TENANT_PERMISSIONS: Record<string, string> = {
    "profile.view": "View profile",
    "profile.edit": "Edit profile",
    "media.upload": "Upload media",
    "media.delete": "Delete media",
    "works.manage": "Manage works / filmography",
    "portfolio.design": "Design the portfolio",
    "portfolio.publish": "Publish the portfolio",
    "inquiries.view": "View inquiries",
    "inquiries.reply": "Reply to inquiries",
    "casting.apply": "Apply to casting calls",
    "casting.post": "Post casting calls",
    "casting.review": "Review casting submissions",
    "team.manage": "Manage team members",
    "roles.manage": "Manage custom roles",
    "billing.view": "View billing",
    "billing.manage": "Manage billing",
    "domain.manage": "Manage custom domain",
    "analytics.view": "View analytics",
    "audit.view": "View audit log",
};

const PLATFORM_PERMISSIONS: Record<string, string> = {
    "tenants.manage": "Manage tenants",
    "plans.manage": "Manage plans",
    "payments.review": "Review payments",
    "templates.manage": "Manage templates",
    "moderation.manage": "Moderate content",
    "casting.moderate": "Moderate casting calls",
    "platform.configure": "Configure the platform",
    "platform.audit.view": "View platform audit log",
};

const ALL_TENANT = Object.keys(TENANT_PERMISSIONS);

const SYSTEM_ROLES: Record<string, { name: string; permissions: string[] }> = {
    owner: { name: "Owner", permissions: ALL_TENANT },
    agency_admin: {
        name: "Agency Admin",
        permissions: ALL_TENANT.filter((p) => p !== "billing.manage"),
    },
    manager: {
        name: "Manager",
        permissions: [
            "profile.view",
            "profile.edit",
            "media.upload",
            "media.delete",
            "works.manage",
            "portfolio.design",
            "portfolio.publish",
            "inquiries.view",
            "inquiries.reply",
            "casting.apply",
            "analytics.view",
        ],
    },
    editor: {
        name: "Editor",
        permissions: [
            "profile.view",
            "profile.edit",
            "media.upload",
            "works.manage",
            "portfolio.design",
        ],
    },
    viewer: {
        name: "Viewer",
        permissions: ["profile.view", "inquiries.view", "analytics.view"],
    },
};

async function main() {
    // 1. Permissions
    for (const [key, description] of Object.entries(TENANT_PERMISSIONS)) {
        await prisma.permission.upsert({
            where: { key },
            update: { description, scope: "TENANT" },
            create: { key, description, scope: "TENANT" },
        });
    }
    for (const [key, description] of Object.entries(PLATFORM_PERMISSIONS)) {
        await prisma.permission.upsert({
            where: { key },
            update: { description, scope: "PLATFORM" },
            create: { key, description, scope: "PLATFORM" },
        });
    }

    // 2. System roles (tenantId = null)
    for (const [key, def] of Object.entries(SYSTEM_ROLES)) {
        let role = await prisma.role.findFirst({ where: { tenantId: null, key } });
        if (!role) {
            role = await prisma.role.create({
                data: { key, name: def.name, isSystem: true },
            });
        }
        const perms = await prisma.permission.findMany({
            where: { key: { in: def.permissions } },
        });
        await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
        await prisma.rolePermission.createMany({
            data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        });
    }

    // 3. Super admin
    const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
        console.log("Skipped super admin: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env");
    } else {
        if (password.length < 12) {
            throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");
        }
        const passwordHash = await bcrypt.hash(password, 12);
        await prisma.user.upsert({
            where: { email },
            update: { platformRole: "SUPER_ADMIN" },
            create: {
                email,
                name: "Super Admin",
                passwordHash,
                platformRole: "SUPER_ADMIN",
                emailVerifiedAt: new Date(),
            },
        });
        console.log("Super admin ready:", email);
    }

    const permCount = await prisma.permission.count();
    const roleCount = await prisma.role.count();
    console.log(`Done. Permissions: ${permCount}, system roles: ${roleCount}`);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });