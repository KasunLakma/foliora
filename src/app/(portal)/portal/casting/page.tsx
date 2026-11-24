import Link from "next/link";
import { auth } from "@/auth";
import { ageText, dateFormatter } from "@/components/casting/format";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentPlan } from "@/modules/billing/service";
import {
  applicationsThisMonth,
  checkEligibility,
  listMyApplications,
  listOpenCalls,
} from "@/modules/casting/service";

export const metadata = { title: "Casting" };

const STATUS_TONE: Record<string, BadgeTone> = {
  SUBMITTED: "brand",
  SHORTLISTED: "success",
  NOT_SELECTED: "neutral",
  WITHDRAWN: "neutral",
};

export default async function CastingPage() {
  const { t, locale } = await getDictionary();
  const c = t.casting;
  const session = await auth();
  const tenantId = session!.user.activeTenantId;

  if (!tenantId) {
    return (
      <Card>
        <p className="text-muted-foreground">{t.profile.noAccount}</p>
      </Card>
    );
  }

  const [calls, applications, eligibility, plan, used] = await Promise.all([
    listOpenCalls(tenantId),
    listMyApplications(tenantId),
    checkEligibility(tenantId),
    getCurrentPlan(tenantId),
    applicationsThisMonth(tenantId),
  ]);
  const date = dateFormatter(locale);
  const max = plan.limits.applications;

  return (
    <div className="flex flex-col gap-4">
      <div className="px-1">
        <h1 className="font-display text-2xl font-semibold tracking-[0.1em] uppercase">{c.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{c.intro}</p>
      </div>

      {eligibility !== "ok" && eligibility !== "agency" && (
        <Card className="flex flex-col gap-3 ring-2 ring-warning/50">
          <p className="text-sm font-medium text-warning">{c.notEligible[eligibility]}</p>
          {eligibility === "unpublished" && (
            <Link href="/portal/portfolio/publish" className={buttonStyles({ size: "md", variant: "secondary" })}>
              {c.publishFirst}
            </Link>
          )}
        </Card>
      )}
      {eligibility === "agency" && (
        <Card>
          <p className="text-sm text-muted-foreground">{c.notEligible.agency}</p>
        </Card>
      )}

      <p className="px-1 text-sm text-white/55">
        {max === null ? c.unlimited : format(c.usedThisMonth, { used, max })}
        {max !== null && used >= max && (
          <>
            {" · "}
            <Link href="/portal/billing" className="font-semibold text-brand underline-offset-4 hover:underline">
              {c.upgrade}
            </Link>
          </>
        )}
      </p>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 font-display text-lg font-semibold tracking-[0.1em] uppercase">{c.open}</h2>
        {calls.length === 0 ? (
          <Card>
            <p className="text-muted-foreground">{c.empty}</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {calls.map((call) => {
              const age = ageText(c, call.ageMin, call.ageMax);
              return (
                <li key={call.id}>
                  <Link
                    href={`/portal/casting/${call.id}`}
                    className="glass-card flex flex-col gap-3 rounded-[1.75rem] p-5 transition hover:bg-white/8"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{call.title}</h3>
                        {call.company && <p className="truncate text-sm text-white/55">{call.company}</p>}
                      </div>
                      {call.myStatus && <Badge tone="success">{c.applied}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{c.gender[call.gender]}</Badge>
                      {age && <Badge>{age}</Badge>}
                      {call.location && <Badge>{call.location}</Badge>}
                    </div>
                    <p className="text-xs text-white/45">{format(c.deadline, { date: date.format(call.deadline) })}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 font-display text-lg font-semibold tracking-[0.1em] uppercase">{c.mine}</h2>
        {applications.length === 0 ? (
          <Card>
            <p className="text-sm text-white/55">{c.noApplications}</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {applications.map((application) => (
              <li key={application.id}>
                <Link
                  href={`/portal/casting/${application.call.id}`}
                  className="glass-card flex items-center justify-between gap-3 rounded-[1.5rem] p-5 transition hover:bg-white/8"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{application.call.title}</p>
                    <p className="text-xs text-white/45">{date.format(application.createdAt)}</p>
                  </div>
                  <Badge tone={STATUS_TONE[application.status] ?? "neutral"}>{c.status[application.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
