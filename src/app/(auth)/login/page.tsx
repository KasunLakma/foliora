"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import { loginAction } from "@/modules/auth/actions";

export default function LoginPage() {
  const { t } = useI18n();
  const l = t.auth.login;
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-[0.12em] uppercase">{l.title}</h1>
        <p className="text-muted-foreground">{l.subtitle}</p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <Field label={l.email}>
          <Input name="email" type="email" required autoComplete="email" placeholder={l.emailPlaceholder} />
        </Field>
        <Field label={l.password}>
          <Input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder={l.passwordPlaceholder}
          />
        </Field>

        {state?.error && (
          <p role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" full loading={pending}>
          {pending ? l.submitting : l.submit}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {l.newHere}{" "}
        <Link href="/register" className="font-semibold text-brand underline-offset-4 hover:underline">
          {l.create}
        </Link>
      </p>
    </div>
  );
}
