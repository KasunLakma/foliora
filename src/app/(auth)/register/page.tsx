"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import { registerAction } from "@/modules/auth/actions";

function AccountType({
  value,
  title,
  text,
  defaultChecked,
}: {
  value: string;
  title: string;
  text: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="accountType"
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="flex h-full flex-col gap-0.5 rounded-2xl border border-white/10 bg-white/5 p-4 transition peer-checked:border-brand peer-checked:bg-brand/10 peer-checked:ring-4 peer-checked:ring-brand/15 peer-focus-visible:ring-4 peer-focus-visible:ring-brand/30">
        <span className="font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{text}</span>
      </span>
    </label>
  );
}

export default function RegisterPage() {
  const { t } = useI18n();
  const r = t.auth.register;
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-[0.12em] uppercase">{r.title}</h1>
        <p className="text-muted-foreground">{r.subtitle}</p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold text-white/85">{r.registeringAs}</legend>
          <div className="grid grid-cols-2 gap-3">
            <AccountType value="INDIVIDUAL" title={r.individual} text={r.individualText} defaultChecked />
            <AccountType value="AGENCY" title={r.agency} text={r.agencyText} />
          </div>
        </fieldset>

        <Field label={r.name}>
          <Input name="name" required autoComplete="name" placeholder={r.namePlaceholder} />
        </Field>
        <Field label={r.tenantName} hint={r.tenantNameHint}>
          <Input name="tenantName" required placeholder={r.tenantNamePlaceholder} />
        </Field>
        <Field label={r.email}>
          <Input name="email" type="email" required autoComplete="email" placeholder={r.emailPlaceholder} />
        </Field>
        <Field label={r.password} hint={r.passwordHint}>
          <Input
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            placeholder={r.passwordPlaceholder}
          />
        </Field>

        {state?.error && (
          <p role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" full loading={pending}>
          {pending ? r.submitting : r.submit}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {r.already}{" "}
        <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
          {r.signInLink}
        </Link>
      </p>
    </div>
  );
}
