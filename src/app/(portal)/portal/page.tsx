import { auth } from "@/auth";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icons";
import { prisma } from "@/lib/db/prisma";
import { getTenantPermissions } from "@/modules/roles/permissions";

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Waiting for approval", tone: "warning" },
  ACTIVE: { label: "Active", tone: "success" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

const NEXT_STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "user", title: "Build your profile", text: "Your bio, skills and details." },
  { icon: "image", title: "Add photos and a showreel", text: "Headshots, albums and video." },
  { icon: "film", title: "Find casting calls", text: "Apply with your portfolio." },
  { icon: "mail", title: "Answer inquiries", text: "Replies from directors and brands." },
];

export default async function PortalPage() {
  const session = await auth();
  const user = session!.user;
  const firstName = (user.name ?? "").trim().split(" ")[0] || "there";

  const tenant = user.activeTenantId
    ? await prisma.tenant.findUnique({
        where: { id: user.activeTenantId },
        select: { name: true, type: true, status: true },
      })
    : null;

  const permissions = user.activeTenantId
    ? [...(await getTenantPermissions(user.id, user.activeTenantId))].sort()
    : [];

  const status = tenant ? (STATUS[tenant.status] ?? STATUS.CLOSED) : null;

  return (
    <div className="flex flex-col gap-5">
      <section className="bg-velvet relative overflow-hidden rounded-[2rem] px-6 pt-24 pb-6 text-white shadow-xl">
        <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight">
          Welcome back, {firstName}
        </h1>
        {tenant ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-white/80">{tenant.name}</span>
            {status && <Badge tone={status.tone}>{status.label}</Badge>}
          </div>
        ) : (
          <p className="mt-3 text-sm text-white/70">
            No account is linked to this sign-in.
            {user.platformRole ? ` Platform role: ${user.platformRole}.` : ""}
          </p>
        )}
      </section>

      {tenant?.status === "PENDING" && (
        <p className="rounded-2xl bg-gilt/20 px-4 py-3 text-sm font-medium text-[#6b4a0e] dark:text-gilt">
          Your account is waiting for approval. We will let you know as soon as it is approved.
        </p>
      )}

      <Card className="p-2">
        <h2 className="px-3 pt-3 pb-1 font-display text-xl font-semibold">Get started</h2>
        <ul className="divide-y divide-border">
          {NEXT_STEPS.map((step) => (
            <li key={step.title} className="flex items-center gap-4 px-3 py-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-brand">
                <Icon name={step.icon} size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{step.title}</span>
                <span className="block text-sm text-muted-foreground">{step.text}</span>
              </span>
              <Badge>Coming soon</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <details className="group rounded-3xl border border-border bg-surface px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
          Your access
          <span className="text-sm font-medium text-muted-foreground">{permissions.length} permissions</span>
        </summary>
        <div className="mt-4 flex flex-wrap gap-2">
          {permissions.map((permission) => (
            <Badge key={permission}>{permission}</Badge>
          ))}
        </div>
      </details>
    </div>
  );
}
