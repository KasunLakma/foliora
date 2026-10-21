"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
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
      <span className="flex h-full flex-col gap-0.5 rounded-2xl border border-border bg-surface p-4 transition peer-checked:border-brand peer-checked:bg-brand/5 peer-checked:ring-4 peer-checked:ring-brand/10 peer-focus-visible:ring-4 peer-focus-visible:ring-brand/30">
        <span className="font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{text}</span>
      </span>
    </label>
  );
}

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground">Set up your portfolio in a few minutes.</p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold">I am registering as</legend>
          <div className="grid grid-cols-2 gap-3">
            <AccountType value="INDIVIDUAL" title="Individual" text="Actor, actress or model" defaultChecked />
            <AccountType value="AGENCY" title="Agency" text="Manage several talents" />
          </div>
        </fieldset>

        <Field label="Your name">
          <Input name="name" required autoComplete="name" placeholder="Full name" />
        </Field>
        <Field label="Stage name or agency name" hint="This is shown on your portfolio.">
          <Input name="tenantName" required placeholder="How you want to be known" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        </Field>
        <Field label="Password" hint="At least 10 characters.">
          <Input
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            placeholder="Create a password"
          />
        </Field>

        {state?.error && (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" full loading={pending}>
          {pending ? "Creating your account" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
