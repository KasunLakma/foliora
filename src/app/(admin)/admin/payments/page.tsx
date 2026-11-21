import Link from "next/link";
import { formatDate, formatDateTime } from "@/components/admin/format";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminContext } from "@/modules/admin/guard";
import { listPaymentRequests } from "@/modules/billing/admin";
import { approvePaymentAction, rejectPaymentAction } from "@/modules/billing/admin-actions";

export const metadata = { title: "Payments" };

const TONE: Record<string, BadgeTone> = { PENDING: "warning", APPROVED: "success", REJECTED: "danger", CANCELED: "neutral" };

type Row = Awaited<ReturnType<typeof listPaymentRequests>>[number];

function PaymentRow({ row, canManage }: { row: Row; canManage: boolean }) {
  const detail = (label: string, value: string | null) =>
    value ? (
      <div>
        <dt className="text-xs font-medium tracking-wider text-white/45 uppercase">{label}</dt>
        <dd className="mt-0.5 font-semibold break-words">{value}</dd>
      </div>
    ) : null;

  return (
    <li className="glass-card flex flex-col gap-4 rounded-[1.75rem] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/admin/tenants/${row.tenantId}`}
            className="block truncate font-semibold underline-offset-4 hover:underline"
          >
            {row.tenantName}
          </Link>
          <p className="truncate text-sm text-white/55">{row.ownerEmail ?? "No owner"}</p>
        </div>
        <Badge tone={TONE[row.status] ?? "neutral"}>{row.status.toLowerCase()}</Badge>
      </div>

      <p className="text-lg font-semibold">
        {row.plan.name} · {row.period === "YEARLY" ? "yearly" : "monthly"} · LKR {row.amount.toLocaleString("en-US")}
      </p>

      <dl className="grid gap-3 sm:grid-cols-2">
        {detail("Code to find in the bank statement", row.code)}
        {detail("Requested", formatDateTime(row.createdAt))}
        {detail("Paid by", row.payerName)}
        {detail("Transfer date", row.transferDate ? formatDate(row.transferDate) : null)}
        {detail("Bank reference", row.bankReference)}
        {detail("Rejection reason", row.rejectReason)}
      </dl>

      {row.status === "PENDING" && !row.paidMarkedAt && (
        <p className="text-sm text-white/50">The account has not said that it has paid yet.</p>
      )}

      {canManage && row.status === "PENDING" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-white/8 pt-4">
          <form action={approvePaymentAction}>
            <input type="hidden" name="id" value={row.id} />
            <Button type="submit" size="sm">
              Approve: I saw the money
            </Button>
          </form>
          <form action={rejectPaymentAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={row.id} />
            <input
              name="reason"
              maxLength={500}
              placeholder="Reason (optional)"
              aria-label="Reason"
              className="h-10 w-44 rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none placeholder:text-white/35 focus:border-brand"
            />
            <Button type="submit" size="sm" variant="danger">
              Reject
            </Button>
          </form>
        </div>
      )}
    </li>
  );
}

export default async function PaymentsPage() {
  const { userId, canManage } = await adminContext();
  const [pending, decided] = await Promise.all([
    listPaymentRequests(userId, "pending"),
    listPaymentRequests(userId, "decided"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="px-1 font-display text-lg font-semibold tracking-[0.1em] uppercase">Waiting to be checked</h2>
        <p className="px-1 text-sm text-white/55">
          Open your bank account, find the money by its code, then approve. Approving starts the paid period at once.
        </p>
        {pending.length === 0 ? (
          <Card>
            <p className="text-muted-foreground">No payments are waiting.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((row) => (
              <PaymentRow key={row.id} row={row} canManage={canManage} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 font-display text-lg font-semibold tracking-[0.1em] uppercase">Decided</h2>
        {decided.length === 0 ? (
          <Card>
            <p className="text-muted-foreground">Nothing yet.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {decided.map((row) => (
              <PaymentRow key={row.id} row={row} canManage={false} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
