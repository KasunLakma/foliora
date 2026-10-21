import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { signOutAction } from "@/modules/auth/actions";
import { getTenantPermissions } from "@/modules/roles/permissions";

export default async function PortalPage() {
    const session = await auth();
    const user = session!.user;

    const tenant = user.activeTenantId
        ? await prisma.tenant.findUnique({
            where: { id: user.activeTenantId },
            select: { name: true, type: true, status: true },
        })
        : null;

    const permissions = user.activeTenantId
        ? [...(await getTenantPermissions(user.id, user.activeTenantId))].sort()
        : [];

    return (
        <main className="mx-auto max-w-2xl p-6">
            <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
            <p className="mt-1 text-sm text-gray-600">{user.email}</p>

            {tenant ? (
                <section className="mt-6 rounded border p-4">
                    <p><strong>{tenant.name}</strong> ({tenant.type.toLowerCase()})</p>
                    <p className="text-sm">Status: {tenant.status}</p>
                    <p className="mt-3 text-sm font-medium">Your permissions ({permissions.length}):</p>
                    <p className="text-xs text-gray-600">{permissions.join(", ")}</p>
                </section>
            ) : (
                <p className="mt-6 text-sm">
                    No tenant is linked to this account.
                    {user.platformRole ? ` Platform role: ${user.platformRole}.` : ""}
                </p>
            )}

            <form action={signOutAction} className="mt-6">
                <button className="rounded border px-4 py-2">Sign out</button>
            </form>
        </main>
    );
}