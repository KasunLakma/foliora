import { TenantRow } from "@/components/admin/tenant-row";
import { Card } from "@/components/ui/card";
import { adminContext } from "@/modules/admin/guard";
import { getDashboardStats, listTenants } from "@/modules/admin/service";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const { canManage } = await adminContext();
  const [stats, pending] = await Promise.all([getDashboardStats(), listTenants({ status: "PENDING" }, 10)]);

  const tiles = [
    { label: "Waiting for approval", value: stats.tenants.PENDING, highlight: stats.tenants.PENDING > 0 },
    { label: "Active accounts", value: stats.tenants.ACTIVE },
    { label: "Suspended", value: stats.tenants.SUSPENDED },
    { label: "Published pages", value: stats.published },
    { label: "New accounts (7 days)", value: stats.newTenantsWeek },
    { label: "Messages sent (7 days)", value: stats.inquiriesWeek },
    { label: "People", value: stats.users },
    { label: "Closed", value: stats.tenants.CLOSED },
  ];

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <li
            key={tile.label}
            className={`glass-card rounded-[1.5rem] p-5 ${tile.highlight ? "ring-2 ring-warning/60" : ""}`}
          >
            <p className="text-xs font-medium text-white/50">{tile.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{tile.value}</p>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 font-display text-lg font-semibold tracking-[0.1em] uppercase">Waiting for approval</h2>
        {pending.length === 0 ? (
          <Card>
            <p className="text-muted-foreground">Nothing is waiting. New accounts appear here.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((tenant) => (
              <TenantRow key={tenant.id} tenant={tenant} canManage={canManage} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
