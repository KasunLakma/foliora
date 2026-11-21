"use client";

import { useActionState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { cancelRequestAction, markPaidAction, requestPlanAction } from "@/modules/billing/actions";

export type PlanView = { key: string; name: string; monthly: number; yearly: number; photos: number; showreels: number };

export type RequestView = {
  id: string;
  code: string;
  planName: string;
  period: "MONTHLY" | "YEARLY";
  amount: number;
  status: string;
  paid: boolean;
  rejectReason: string | null;
  createdAt: string;
};

export type BankDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
} | null;

const STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELED: "neutral",
};

function useMoney() {
  const { locale } = useI18n();
  const formatter = new Intl.NumberFormat(locale === "si" ? "si-LK" : "en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  });
  return (value: number) => formatter.format(value);
}

export function PlanPicker({ plans, canManage }: { plans: PlanView[]; canManage: boolean }) {
  const { t } = useI18n();
  const b = t.billing;
  const money = useMoney();
  const [state, action, pending] = useActionState(requestPlanAction, undefined);

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">{b.choose}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{b.chooseHint}</p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        <fieldset disabled={!canManage} className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold text-white/85">{b.period}</legend>
            <div className="grid grid-cols-2 gap-3">
              {(["MONTHLY", "YEARLY"] as const).map((period) => (
                <label key={period} className="cursor-pointer">
                  <input
                    type="radio"
                    name="period"
                    value={period}
                    defaultChecked={period === "MONTHLY"}
                    className="peer sr-only"
                  />
                  <span className="flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold transition peer-checked:border-brand peer-checked:bg-brand/10 peer-checked:text-brand peer-focus-visible:ring-4 peer-focus-visible:ring-brand/30">
                    {period === "MONTHLY" ? b.monthly : b.yearly}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <ul className="flex flex-col gap-3">
            {plans.map((plan) => (
              <li key={plan.key} className="flex flex-col gap-3 rounded-2xl bg-white/5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold tracking-[0.1em] uppercase">{plan.name}</h3>
                  <div className="text-right text-sm">
                    <p className="font-semibold">{format(b.perMonth, { price: money(plan.monthly) })}</p>
                    <p className="text-white/50">{format(b.perYear, { price: money(plan.yearly) })}</p>
                  </div>
                </div>
                <p className="text-sm text-white/65">
                  {format(b.limitPhotos, { count: plan.photos })} · {format(b.limitShowreels, { count: plan.showreels })}
                </p>
                <Button type="submit" name="planKey" value={plan.key} loading={pending}>
                  {format(b.request, { plan: plan.name })}
                </Button>
              </li>
            ))}
          </ul>
        </fieldset>

        {state?.error && (
          <p role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
            {state.error}
          </p>
        )}
      </form>
    </Card>
  );
}

export function PendingRequestCard({ request, bank }: { request: RequestView; bank: BankDetails }) {
  const { t } = useI18n();
  const b = t.billing;
  const money = useMoney();
  const [state, action, pending] = useActionState(markPaidAction, undefined);
  const today = new Date().toISOString().slice(0, 10);

  const bankRows = bank
    ? [
        { label: b.bankName, value: bank.bankName },
        { label: b.accountName, value: bank.accountName },
        { label: b.accountNumber, value: bank.accountNumber },
        { label: b.branch, value: bank.branch },
      ].filter((row) => row.value)
    : [];

  return (
    <Card className="flex flex-col gap-5 ring-2 ring-warning/50">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">
          {b.waitingTitle}: {request.planName}
        </h2>
        <Badge tone="warning">{request.period === "YEARLY" ? b.yearly : b.monthly}</Badge>
      </div>

      <div className="rounded-2xl bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-white/70">{b.bankTitle}</h3>
        <p className="mt-2 font-semibold">{format(b.transferAmount, { amount: money(request.amount) })}</p>
        <p className="mt-1 text-sm">
          {format(b.transferCode, { code: "" })}
          <span className="font-mono text-lg font-bold tracking-wider text-brand">{request.code}</span>
        </p>
        {bankRows.length > 0 ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {bankRows.map((row) => (
              <div key={row.label}>
                <dt className="text-xs font-medium tracking-wider text-white/45 uppercase">{row.label}</dt>
                <dd className="mt-0.5 font-semibold break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-sm text-warning">{b.bankMissing}</p>
        )}
      </div>

      {request.paid || state?.done ? (
        <p role="status" className="rounded-2xl bg-success/12 px-4 py-3 text-sm font-medium text-success">
          {b.checking}
        </p>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={request.id} />
          <div>
            <h3 className="font-semibold">{b.paidTitle}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.paidHint}</p>
          </div>
          <Field label={b.payerName}>
            <Input name="payerName" required maxLength={100} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={b.transferDate}>
              <Input name="transferDate" type="date" required max={today} defaultValue={today} />
            </Field>
            <Field label={b.bankReference}>
              <Input name="bankReference" maxLength={60} />
            </Field>
          </div>
          {state?.error && (
            <p role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" loading={pending}>
            {b.markPaid}
          </Button>
        </form>
      )}

      <form action={cancelRequestAction}>
        <input type="hidden" name="id" value={request.id} />
        <Button
          type="submit"
          size="sm"
          variant="danger"
          onClick={(event) => {
            if (!window.confirm(b.confirmCancel)) event.preventDefault();
          }}
        >
          {b.cancel}
        </Button>
      </form>
    </Card>
  );
}

export function RequestHistory({ requests }: { requests: RequestView[] }) {
  const { t, locale } = useI18n();
  const b = t.billing;
  const money = useMoney();
  const date = new Intl.DateTimeFormat(locale === "si" ? "si-LK" : "en-GB", { dateStyle: "medium" });

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">{b.history}</h2>
      {requests.length === 0 ? (
        <p className="text-sm text-white/55">{b.noHistory}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => (
            <li key={request.id} className="flex flex-col gap-1 rounded-2xl bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">
                  {request.planName} · {request.period === "YEARLY" ? b.yearly : b.monthly}
                </span>
                <Badge tone={STATUS_TONE[request.status] ?? "neutral"}>
                  {b.status[request.status as keyof typeof b.status]}
                </Badge>
              </div>
              <p className="text-xs text-white/45">
                {money(request.amount)} · {request.code} · {date.format(new Date(request.createdAt))}
              </p>
              {request.rejectReason && (
                <p className="text-sm text-danger">{format(b.reason, { reason: request.rejectReason })}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
