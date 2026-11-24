"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { saveCallAction } from "@/modules/casting/admin-actions";

export type CallFormValues = {
  id: string;
  title: string;
  company: string;
  role: string;
  description: string;
  gender: string;
  ageMin: string;
  ageMax: string;
  location: string;
  compensation: string;
  deadline: string; // 2026-12-31
};

const textareaClass =
  "min-h-36 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-foreground " +
  "placeholder:text-white/35 outline-none transition focus:border-brand focus:bg-white/8 focus:ring-4 focus:ring-brand/20";

export function CallForm({ call }: { call?: CallFormValues }) {
  const [state, action, pending] = useActionState(saveCallAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      {call && <input type="hidden" name="id" value={call.id} />}

      <Field label="Title">
        <Input name="title" required maxLength={150} defaultValue={call?.title} placeholder="Lead actress for a TV drama" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Production or company">
          <Input name="company" maxLength={120} defaultValue={call?.company} />
        </Field>
        <Field label="Role">
          <Input name="role" maxLength={150} defaultValue={call?.role} placeholder="Nimali, 25, a young doctor" />
        </Field>
      </div>
      <Field label="Description" hint="What the production is looking for, the story, the dates, how to prepare.">
        <textarea name="description" required minLength={20} maxLength={5000} defaultValue={call?.description} className={textareaClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Looking for">
          <Select name="gender" defaultValue={call?.gender ?? "ANY"}>
            <option value="ANY">Any gender</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
          </Select>
        </Field>
        <Field label="Age from">
          <Input name="ageMin" inputMode="numeric" defaultValue={call?.ageMin} />
        </Field>
        <Field label="Age to">
          <Input name="ageMax" inputMode="numeric" defaultValue={call?.ageMax} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location">
          <Input name="location" maxLength={120} defaultValue={call?.location} placeholder="Colombo" />
        </Field>
        <Field label="Pay">
          <Input name="compensation" maxLength={200} defaultValue={call?.compensation} placeholder="LKR 15,000 per day" />
        </Field>
      </div>
      <Field label="Last day to apply" hint="Applications close at the end of this day, Sri Lanka time.">
        <Input name="deadline" type="date" required defaultValue={call?.deadline} />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" loading={pending}>
        {call ? "Save changes" : "Create casting call"}
      </Button>
    </form>
  );
}
