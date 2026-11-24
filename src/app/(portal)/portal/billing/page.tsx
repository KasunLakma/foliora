import { auth } from "@/auth";
import {
  PendingRequestCard,
  PlanPicker,
  RequestHistory,
  type BankDetails,
  type PlanView,
  type RequestView,
} from "@/components/billing/billing-view";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentPlan, listMyRequests, listPaidPlans } from "@/modules/billing/service";
import { readLimits } from "@/modules/billing/rules";
import { hasPermission } from "@/modules/roles/permissions";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const { t, locale } = await getDictionary();
  const b = t.billing;
  const session = await auth();
  const user = session!.user;
  const tenantId = user.activeTenantId;

  if (!tenantId) {
    return (
      <Card>
        <p className="text-muted-foreground">{t.profile.noAccount}</p>
      </Card>
    );
  }

  const [plan, paidPlans, requests, canView, canManage] = await Promise.all([
    getCurrentPlan(tenantId),
    listPaidPlans(),
    listMyRequests(tenantId),
    hasPermission(user.id, tenantId, "billing.view"),
    hasPermission(user.id, tenantId, "billing.manage"),
  ]);
  if (!canView && !canManage) {
    return (
      <Card>
        <p className="text-muted-foreground">{b.errors.noPermission}</p>
      </Card>
    );
  }

  const plans: PlanView[] = paidPlans.map((p) => {
    const limits = readLimits(p.limits);
    return {
      key: p.key,
      name: p.name,
      monthly: p.monthlyPrice,
      yearly: p.yearlyPrice,
      photos: limits.photos,
      showreels: limits.showreels,
      applications: limits.applications,
    };
  });

  const views: RequestView[] = requests.map((r) => ({
    id: r.id,
    code: r.code,
    planName: r.plan.name,
    period: r.period,
    amount: r.amount,
    status: r.status,
    paid: r.paidMarkedAt !== null,
    rejectReason: r.rejectReason,
    createdAt: r.createdAt.toISOString(),
  }));

  const env = process.env;
  const bank: BankDetails =
    env.BILLING_ACCOUNT_NUMBER && env.BILLING_ACCOUNT_NAME
      ? {
          bankName: env.BILLING_BANK_NAME ?? "",
          accountName: env.BILLING_ACCOUNT_NAME,
          accountNumber: env.BILLING_ACCOUNT_NUMBER,
          branch: env.BILLING_BANK_BRANCH ?? "",
        }
      : null;

  const date = new Intl.DateTimeFormat(locale === "si" ? "si-LK" : "en-GB", { dateStyle: "medium" });
  const pending = views.filter((r) => r.status === "PENDING");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 font-display text-2xl font-semibold tracking-[0.1em] uppercase">{b.title}</h1>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">{b.yourPlan}</h2>
          <Badge tone={plan.isFree ? "neutral" : "success"}>{plan.name}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {plan.endsAt ? format(b.activeUntil, { date: date.format(plan.endsAt) }) : b.freePlan}
        </p>
        <p className="text-sm text-white/65">
          {format(b.limitPhotos, { count: plan.limits.photos })} · {format(b.limitShowreels, { count: plan.limits.showreels })} ·{" "}
          {plan.limits.applications === null
            ? b.applicationsUnlimited
            : format(b.applicationsPerMonth, { count: plan.limits.applications })}
        </p>
      </Card>

      {pending.map((request) => (
        <PendingRequestCard key={request.id} request={request} bank={bank} />
      ))}

      {plans.length > 0 && <PlanPicker plans={plans} canManage={canManage} />}

      <RequestHistory requests={views} />
    </div>
  );
}
