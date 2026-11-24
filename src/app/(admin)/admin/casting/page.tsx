import Link from "next/link";
import { formatDate } from "@/components/admin/format";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminContext } from "@/modules/admin/guard";
import { listCallsAdmin } from "@/modules/casting/admin";

export const metadata = { title: "Casting" };

const TONE: Record<string, BadgeTone> = { DRAFT: "neutral", OPEN: "success", CLOSED: "warning" };

export default async function AdminCastingPage() {
  const { userId, canManage } = await adminContext();
  const calls = await listCallsAdmin(userId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="px-1 text-sm text-white/55">Roles that productions are looking for. Talents apply from their portal.</p>
        {canManage && (
          <Link href="/admin/casting/new" className={buttonStyles({ size: "sm" })}>
            New casting call
          </Link>
        )}
      </div>

      {calls.length === 0 ? (
        <Card>
          <p className="text-muted-foreground">No casting calls yet.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {calls.map((call) => (
            <li key={call.id}>
              <Link
                href={`/admin/casting/${call.id}`}
                className="glass-card flex items-start justify-between gap-3 rounded-[1.75rem] p-5 transition hover:bg-white/8"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{call.title}</p>
                  <p className="mt-0.5 truncate text-sm text-white/55">
                    {call.company ?? "No production named"} · closes {formatDate(call.deadline)} ·{" "}
                    {call._count.applications} applicant{call._count.applications === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge tone={TONE[call.status] ?? "neutral"}>{call.status.toLowerCase()}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
