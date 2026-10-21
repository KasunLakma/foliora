import type { DefaultSession } from "next-auth";

type PlatformRoleName = "SUPER_ADMIN" | "ADMIN" | "SUPPORT";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            platformRole: PlatformRoleName | null;
            activeTenantId: string | null;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        platformRole?: PlatformRoleName | null;
        activeTenantId?: string | null;
    }
}