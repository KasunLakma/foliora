import Link from "next/link";
import { formatDateTime } from "@/components/admin/format";
import { Card } from "@/components/ui/card";
import { adminContext } from "@/modules/admin/guard";
import { listPlatformAudit } from "@/modules/admin/service";

export const metadata = { title: "Audit log" };

function reasonOf(after: unknown) {
  if (after && typeof after === "object" && "reason" in after) {
    const reason = (after as { reason?: unknown }).reason;
    return typeof reason === "string" ? reason : null;
  }
  return null;
}

export default async function AuditPage() {
  const { userId } = await adminContext();
  const entries = await listPlatformAudit(userId);

  return (
    <div className="flex flex-col gap-4">
      <p className="px-1 text-sm text-white/55">
        Everything staff did to accounts. Entries cannot be changed or deleted.
      </p>

      {entries.length === 0 ? (
        <Card>
          <p className="text-muted-foreground">No staff actions yet.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => {
            const reason = reasonOf(entry.after);
            return (
              <li key={entry.id} className="glass-card flex flex-col gap-1 rounded-[1.5rem] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{entry.action}</span>
                  <span className="text-xs text-white/45">{formatDateTime(entry.createdAt)}</span>
                </div>
                <p className="text-sm text-white/60">
                  by {entry.actor?.email ?? "system"}
                  {entry.targetType === "Tenant" && entry.targetId && (
                    <>
                      {" · "}
                      <Link href={`/admin/tenants/${entry.targetId}`} className="text-brand underline-offset-4 hover:underline">
                        open account
                      </Link>
                    </>
                  )}
                </p>
                {reason && <p className="text-sm text-white/75">Reason: {reason}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
