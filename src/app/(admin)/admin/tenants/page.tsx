import { TenantRow } from "@/components/admin/tenant-row";
import { STATUS_LABEL } from "@/components/admin/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminContext } from "@/modules/admin/guard";
import { listTenants } from "@/modules/admin/service";
import type { TenantStatusName } from "@/modules/admin/transitions";

export const metadata = { title: "Accounts" };

const STATUSES = ["PENDING", "ACTIVE", "SUSPENDED", "CLOSED"] as const;

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { canManage } = await adminContext();
  const { q, status } = await searchParams;
  const statusFilter = (STATUSES as readonly string[]).includes(status ?? "") ? (status as TenantStatusName) : undefined;
  const tenants = await listTenants({ status: statusFilter, q });

  return (
    <div className="flex flex-col gap-4">
      <form className="glass-card flex flex-col gap-3 rounded-[1.75rem] p-4 sm:flex-row" action="/admin/tenants">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or email"
          aria-label="Search"
          className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-base outline-none placeholder:text-white/35 focus:border-brand"
        />
        <select
          name="status"
          defaultValue={statusFilter ?? ""}
          aria-label="Status"
          className="h-12 rounded-2xl border border-white/10 bg-surface px-4 text-base outline-none focus:border-brand"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <Button type="submit">Search</Button>
      </form>

      <p className="px-1 text-sm text-white/45">
        {tenants.length} account{tenants.length === 1 ? "" : "s"}
        {tenants.length === 100 ? " (showing the newest 100)" : ""}
      </p>

      {tenants.length === 0 ? (
        <Card>
          <p className="text-muted-foreground">No accounts match.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {tenants.map((tenant) => (
            <TenantRow key={tenant.id} tenant={tenant} canManage={canManage} />
          ))}
        </ul>
      )}
    </div>
  );
}
