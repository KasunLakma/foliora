import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { ApplyForm } from "@/components/casting/apply-form";
import { ageText, dateFormatter } from "@/components/casting/format";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { withdrawAction } from "@/modules/casting/actions";
import { checkEligibility, getCallForTalent } from "@/modules/casting/service";

export const metadata = { title: "Casting" };

export default async function CastingCallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await getDictionary();
  const c = t.casting;
  const session = await auth();
  const tenantId = session!.user.activeTenantId;
  if (!tenantId) notFound();

  const found = await getCallForTalent(tenantId, id);
  if (!found) notFound();
  const { call, mine, isOpen } = found;
  const eligibility = await checkEligibility(tenantId);
  const date = dateFormatter(locale);
  const age = ageText(c, call.ageMin, call.ageMax);

  const facts = [
    call.company && { label: c.company, value: call.company },
    call.role && { label: c.role, value: call.role },
    call.location && { label: c.location, value: call.location },
    call.compensation && { label: c.pay, value: call.compensation },
    { label: c.lookingFor, value: [c.gender[call.gender], age].filter(Boolean).join(" · ") },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="flex flex-col gap-4">
      <Link href="/portal/casting" className="w-fit px-1 text-sm font-semibold text-brand underline-offset-4 hover:underline">
        ← {c.back}
      </Link>

      <Card className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-[0.08em] uppercase">{call.title}</h1>
          {!isOpen && <Badge>{c.closed}</Badge>}
        </div>
        <p className="text-sm text-white/55">{format(c.deadline, { date: date.format(call.deadline) })}</p>

        <dl className="grid gap-4 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs font-medium tracking-wider text-white/45 uppercase">{fact.label}</dt>
              <dd className="mt-1 font-semibold break-words">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <p className="leading-relaxed whitespace-pre-line text-white/80">{call.description}</p>
      </Card>

      {mine ? (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">{c.applied}</h2>
            <Badge tone={mine.status === "SHORTLISTED" ? "success" : "neutral"}>{c.status[mine.status]}</Badge>
          </div>
          {mine.message && <p className="text-sm whitespace-pre-line text-white/70">{mine.message}</p>}
          {(mine.status === "SUBMITTED" || mine.status === "SHORTLISTED") && (
            <form action={withdrawAction}>
              <input type="hidden" name="id" value={mine.id} />
              <Button type="submit" size="sm" variant="danger">
                {c.withdraw}
              </Button>
            </form>
          )}
        </Card>
      ) : isOpen ? (
        eligibility === "ok" ? (
          <ApplyForm callId={call.id} />
        ) : (
          <Card className="flex flex-col gap-3 ring-2 ring-warning/50">
            <p className="text-sm font-medium text-warning">{c.notEligible[eligibility]}</p>
            {eligibility === "unpublished" && (
              <Link href="/portal/portfolio/publish" className={buttonStyles({ size: "md", variant: "secondary" })}>
                {c.publishFirst}
              </Link>
            )}
          </Card>
        )
      ) : null}
    </div>
  );
}
