import Link from "next/link";
import { auth } from "@/auth";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icons";
import { prisma } from "@/lib/db/prisma";
import { ensureProfile, getProfile, scoreProfile } from "@/modules/profiles/service";
import { getTenantPermissions } from "@/modules/roles/permissions";

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Waiting for approval", tone: "warning" },
  ACTIVE: { label: "Active", tone: "success" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

const TILES = [
  { label: "Photos", icon: "image" },
  { label: "Works", icon: "film" },
  { label: "Inquiries", icon: "mail" },
  { label: "Profile views", icon: "eye" },
] satisfies { label: string; icon: IconName }[];

const NEXT_STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "image", title: "Add photos and a showreel", text: "Headshots, albums and video." },
  { icon: "film", title: "Find casting calls", text: "Apply with your portfolio." },
  { icon: "mail", title: "Answer inquiries", text: "Replies from directors and brands." },
];

export default async function PortalPage() {
  const session = await auth();
  const user = session!.user;
  const displayName = (user.name ?? "").trim() || "there";

  const tenant = user.activeTenantId
    ? await prisma.tenant.findUnique({
        where: { id: user.activeTenantId },
        select: { name: true, type: true, status: true },
      })
    : null;

  let completeness: { percent: number; missing: string[] } | null = null;
  if (user.activeTenantId && tenant?.type === "INDIVIDUAL") {
    await ensureProfile(user.activeTenantId);
    const profile = await getProfile(user.activeTenantId);
    if (profile) completeness = scoreProfile(profile);
  }

  const permissions = user.activeTenantId
    ? [...(await getTenantPermissions(user.id, user.activeTenantId))].sort()
    : [];

  const status = tenant ? (STATUS[tenant.status] ?? STATUS.CLOSED) : null;

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-[2rem] p-6">
        <div className="flex items-center gap-4">
          <span className="bg-brand-gradient rounded-full p-[3px]">
            <span className="grid size-20 place-items-center rounded-full bg-surface font-display text-3xl font-bold text-brand">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-semibold tracking-[0.08em] uppercase">
              {displayName}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {tenant ? tenant.name : "No account linked"}
            </p>
          </div>
        </div>

        {tenant ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone="brand">{tenant.type === "AGENCY" ? "Agency" : "Individual"}</Badge>
            {status && <Badge tone={status.tone}>{status.label}</Badge>}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No account is linked to this sign-in.
            {user.platformRole ? ` Platform role: ${user.platformRole}.` : ""}
          </p>
        )}

        <ul className="mt-5 grid grid-cols-2 gap-3">
          {TILES.map((tile) => (
            <li key={tile.label} className="rounded-2xl bg-white/5 p-4">
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Icon name={tile.icon} size={16} className="text-brand" />
                {tile.label}
              </span>
              <span className="mt-2 block font-display text-2xl font-semibold">—</span>
              <span className="text-xs text-white/40">Available soon</span>
            </li>
          ))}
        </ul>
      </Card>

      {tenant?.status === "PENDING" && (
        <p className="rounded-2xl bg-warning/12 px-4 py-3 text-sm font-medium text-warning">
          Your account is waiting for approval. We will let you know as soon as it is approved.
        </p>
      )}

      {completeness && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">Your profile</h2>
            <span className="font-display text-2xl font-semibold text-brand">{completeness.percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={completeness.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
          >
            <div className="bg-brand-gradient h-full rounded-full" style={{ width: `${completeness.percent}%` }} />
          </div>
          {completeness.missing.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              Next: {completeness.missing.slice(0, 3).join(", ").toLowerCase()}.
            </p>
          )}
          <Link href="/portal/profile" className={buttonStyles({ size: "md" }) + " mt-4"}>
            {completeness.percent === 100 ? "View your profile" : "Continue your profile"}
          </Link>
        </Card>
      )}

      <Card className="p-2">
        <h2 className="px-4 pt-4 pb-1 font-display text-lg font-semibold tracking-[0.1em] uppercase">
          Coming next
        </h2>
        <ul className="divide-y divide-white/8">
          {NEXT_STEPS.map((step) => (
            <li key={step.title} className="flex items-center gap-4 px-4 py-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand/12 text-brand">
                <Icon name={step.icon} size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{step.title}</span>
                <span className="block text-sm text-muted-foreground">{step.text}</span>
              </span>
              <Badge>Soon</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <details className="glass-card rounded-[1.75rem] px-5 py-4">
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
