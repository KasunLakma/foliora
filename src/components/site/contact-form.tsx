"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { submitInquiryAction } from "@/modules/inquiries/actions";
import { INQUIRY_TYPES } from "@/modules/inquiries/schema";

const textareaClass =
  "min-h-36 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-foreground " +
  "placeholder:text-white/35 outline-none transition focus:border-brand focus:bg-white/8 focus:ring-4 focus:ring-brand/20";

export function ContactForm({ slug, token, ownerName }: { slug: string; token: string; ownerName: string }) {
  const { t } = useI18n();
  const c = t.contact;
  const [state, action, pending] = useActionState(submitInquiryAction, undefined);

  if (state?.done) {
    return (
      <div role="status" className="glass-card rounded-[1.75rem] p-8">
        <h3 className="font-display text-xl font-semibold tracking-[0.1em] uppercase">{c.thanks}</h3>
        <p className="mt-3 text-white/70">{format(c.thanksText, { name: ownerName })}</p>
      </div>
    );
  }

  return (
    <form action={action} className="glass-card flex flex-col gap-4 rounded-[1.75rem] p-6 sm:p-8">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="token" value={token} />

      {/* A trap for robots: people never see this field, so anything typed in it means "not a person". */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input name="contact_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field label={c.type}>
        <Select name="type" defaultValue="GENERAL">
          {INQUIRY_TYPES.map((type) => (
            <option key={type} value={type}>
              {t.inquiryTypes[type]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={c.name}>
          <Input name="senderName" required autoComplete="name" maxLength={100} />
        </Field>
        <Field label={c.email}>
          <Input name="senderEmail" type="email" required autoComplete="email" maxLength={200} />
        </Field>
        <Field label={c.phone}>
          <Input name="senderPhone" type="tel" autoComplete="tel" maxLength={30} />
        </Field>
        <Field label={c.company}>
          <Input name="company" autoComplete="organization" maxLength={100} />
        </Field>
      </div>
      <Field label={c.project}>
        <Input name="projectName" maxLength={120} />
      </Field>
      <Field label={c.message}>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={3000}
          placeholder={c.messagePlaceholder}
          className={textareaClass}
        />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" loading={pending}>
        {pending ? c.sending : c.send}
      </Button>
    </form>
  );
}
