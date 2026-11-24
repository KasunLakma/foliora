"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import { applyAction } from "@/modules/casting/actions";

const textareaClass =
  "min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-foreground " +
  "placeholder:text-white/35 outline-none transition focus:border-brand focus:bg-white/8 focus:ring-4 focus:ring-brand/20";

export function ApplyForm({ callId }: { callId: string }) {
  const { t } = useI18n();
  const c = t.casting;
  const [state, action, pending] = useActionState(applyAction, undefined);

  if (state?.done) {
    return (
      <Card>
        <p role="status" className="font-semibold text-success">
          {c.sent}
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">{c.applyTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{c.applyHint}</p>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="callId" value={callId} />
        <Field label={c.message}>
          <textarea name="message" maxLength={1000} placeholder={c.messagePlaceholder} className={textareaClass} />
        </Field>
        {state?.error && (
          <p role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" loading={pending}>
          {c.send}
        </Button>
      </form>
    </Card>
  );
}
