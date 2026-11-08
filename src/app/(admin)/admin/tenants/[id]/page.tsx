import Link from "next/link";
import { notFound } from "next/navigation";
import { STATUS_LABEL, TENANT_TONE, formatDate, formatDateTime } from "@/components/admin/format";
import { TenantActions } from "@/components/admin/tenant-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { adminContext } from "@/modules/admin/guard";
import { getTenantDetail } from "@/modules/admin/service";
import type { TenantStatusName } from "@/modules/admin/transitions";

export const metadata = { title: "Account" };

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { canManage } = await adminContext();
  const { id } = await params;
  const detail = await getTenantDetail(id);
  if (!detail) notFound();

  const { tenant, counts, audit } = detail;
  const profile = tenant.profiles[0];
  const portfolio = profile?.portfolio;

  const stats = [
    { label: "Photos", value: counts.photos },
    { label: "Works", value: counts.works },
    { label: "Showreels", value: counts.showreels },
    { label: "Messages", value: counts.inquiries },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/tenants" className="w-fit px-1 text-sm font-semibold text-brand underline-offset-4 hover:underline">
        ← Accounts
      </Link>

      <Card className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold tracking-[0.08em] uppercase">{tenant.name}</h1>
            <p className="mt-1 text-sm text-white/55">
              {tenant.type === "AGENCY" ? "Agency" : "Individual"} · joined {formatDate(tenant.createdAt)} · language{" "}
              {tenant.defaultLocale}
            </p>
          </div>
          <Badge tone={TENANT_TONE[tenant.status] ?? "neutral"}>{STATUS_LABEL[tenant.status] ?? tenant.status}</Badge>
        </div>

        {canManage && <TenantActions tenantId={tenant.id} status={tenant.status as TenantStatusName} />}

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium tracking-wider text-white/45 uppercase">Public page</dt>
            <dd className="mt-1 font-semibold">
              {portfolio?.slug ? (
                <>
                  <Link href={`/${portfolio.slug}`} className="text-brand underline-offset-4 hover:underline">
                    /{portfolio.slug}
                  </Link>{" "}
                  <span className="text-sm font-normal text-white/50">
                    {portfolio.status === "PUBLISHED" ? "published" : "draft"}
                  </span>
                </>
              ) : (
                <span className="text-white/50">No address chosen</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wider text-white/45 uppercase">Stage name</dt>
            <dd className="mt-1 font-semibold">{profile?.stageName ?? "No profile"}</dd>
          </div>
        </dl>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <li key={stat.label} className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-white/50">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold">{stat.value}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">People</h2>
        <ul className="flex flex-col gap-3">
          {tenant.members.map((member) => (
            <li key={member.user.email} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/5 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{member.user.name}</p>
                <p className="truncate text-sm text-white/55">{member.user.email}</p>
              </div>
              <div className="text-right text-xs text-white/45">
                <p>{member.role.name}</p>
                <p>
                  {member.user.lastLoginAt ? `last seen ${formatDateTime(member.user.lastLoginAt)}` : "never signed in"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">History</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-white/55">Nothing recorded yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {audit.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{entry.action}</span>
                <span className="text-xs text-white/45">
                  {entry.actor?.email ?? "system"} · {formatDateTime(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
