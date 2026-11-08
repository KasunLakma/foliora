import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PortalShell } from "@/components/app/portal-shell";
import { prisma } from "@/lib/db/prisma";
import { countNewInquiries } from "@/modules/inquiries/service";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = session.user.activeTenantId
    ? await prisma.tenant.findUnique({
        where: { id: session.user.activeTenantId },
        select: { name: true },
      })
    : null;
  const unread = session.user.activeTenantId ? await countNewInquiries(session.user.activeTenantId) : 0;

  return (
    <PortalShell
      userName={session.user.name ?? session.user.email ?? "You"}
      tenantName={tenant?.name ?? null}
      inboxUnread={unread}
      isPlatformUser={Boolean(session.user.platformRole)}
    >
      {children}
    </PortalShell>
  );
}
