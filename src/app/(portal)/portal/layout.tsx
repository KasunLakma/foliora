import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PortalShell } from "@/components/app/portal-shell";
import { prisma } from "@/lib/db/prisma";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = session.user.activeTenantId
    ? await prisma.tenant.findUnique({
        where: { id: session.user.activeTenantId },
        select: { name: true },
      })
    : null;

  return (
    <PortalShell
      userName={session.user.name ?? session.user.email ?? "You"}
      tenantName={tenant?.name ?? null}
    >
      {children}
    </PortalShell>
  );
}
