import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/modules/auth/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
    session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
    pages: { signIn: "/login" },
    providers: [
        Credentials({
            credentials: { email: {}, password: {} },
            async authorize(raw) {
                const parsed = loginSchema.safeParse(raw);
                if (!parsed.success) return null;
                const { email, password } = parsed.data;

                const user = await prisma.user.findUnique({ where: { email } });
                if (!user || user.status !== "ACTIVE" || !user.passwordHash) return null;

                const valid = await bcrypt.compare(password, user.passwordHash);
                if (!valid) return null;

                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLoginAt: new Date() },
                });
                return { id: user.id, email: user.email, name: user.name };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Runs at sign-in: store the user id, platform role and first active tenant.
            if (user?.id) {
                token.id = user.id;
                const details = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: {
                        platformRole: true,
                        memberships: {
                            where: { status: "ACTIVE", tenant: { deletedAt: null } },
                            orderBy: { createdAt: "asc" },
                            select: { tenantId: true },
                            take: 1,
                        },
                    },
                });
                token.platformRole = details?.platformRole ?? null;
                token.activeTenantId = details?.memberships[0]?.tenantId ?? null;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id as string;
            session.user.platformRole =
                (token.platformRole as "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | null | undefined) ?? null;
            session.user.activeTenantId = (token.activeTenantId as string | null | undefined) ?? null;
            return session;
        },
    },
});