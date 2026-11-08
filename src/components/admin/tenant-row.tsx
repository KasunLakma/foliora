import Link from "next/link";
import { STATUS_LABEL, TENANT_TONE, formatDate } from "@/components/admin/format";
import { TenantActions } from "@/components/admin/tenant-actions";
import { Badge } from "@/components/ui/badge";
import type { listTenants } from "@/modules/admin/service";
import type { TenantStatusName } from "@/modules/admin/transitions";

type Row = Awaited<ReturnType<typeof listTenants>>[number];

export function TenantRow({ tenant, canManage }: { tenant: Row; canManage: boolean }) {
  const owner = tenant.members[0]?.user;
  const portfolio = tenant.profiles[0]?.portfolio;

  return (
    <li className="glass-card flex flex-col gap-3 rounded-[1.75rem] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/admin/tenants/${tenant.id}`}
            className="block truncate font-semibold underline-offset-4 hover:underline"
          >
            {tenant.name}
          </Link>
          <p className="mt-0.5 truncate text-sm text-white/55">
            {owner ? `${owner.name} · ${owner.email}` : "No owner"}
          </p>
        </div>
        <Badge tone={TENANT_TONE[tenant.status] ?? "neutral"}>{STATUS_LABEL[tenant.status] ?? tenant.status}</Badge>
      </div>

      <p className="text-xs text-white/40">
        {tenant.type === "AGENCY" ? "Agency" : "Individual"} · joined {formatDate(tenant.createdAt)}
        {portfolio?.slug && (
          <>
            {" · "}
            {portfolio.status === "PUBLISHED" ? (
              <Link href={`/${portfolio.slug}`} className="text-brand underline-offset-4 hover:underline">
                /{portfolio.slug}
              </Link>
            ) : (
              <span>/{portfolio.slug} (draft)</span>
            )}
          </>
        )}
      </p>

      {canManage && <TenantActions tenantId={tenant.id} status={tenant.status as TenantStatusName} />}
    </li>
  );
}
