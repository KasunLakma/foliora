"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { saveProfileAction } from "@/modules/profiles/actions";
import {
  GENDERS,
  LANGUAGE_CODES,
  SOCIAL_LABELS,
  SOCIAL_PLATFORMS,
} from "@/modules/profiles/constants";
import type { ProfileFormValues, SkillOption } from "@/modules/profiles/types";

const textareaClass =
  "min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-foreground " +
  "placeholder:text-white/35 outline-none transition focus:border-brand focus:bg-white/8 focus:ring-4 focus:ring-brand/20";

const STEP_KEYS = ["basics", "look", "skills", "links"] as const;

function Chip({
  name,
  value,
  label,
  sub,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  sub?: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition peer-checked:border-brand peer-checked:bg-brand/15 peer-checked:text-brand peer-focus-visible:ring-4 peer-focus-visible:ring-brand/30">
        {label}
        {sub && <span className="text-xs opacity-60">{sub}</span>}
      </span>
    </label>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </Card>
  );
}

export function ProfileForm({
  values,
  skills,
  canEdit,
  mode = "full",
}: {
  values: ProfileFormValues;
  skills: SkillOption[];
  canEdit: boolean;
  mode?: "full" | "wizard";
}) {
  const { t, locale } = useI18n();
  const f = t.form;
  const wizard = mode === "wizard";
  const router = useRouter();
  const [state, action, pending] = useActionState(saveProfileAction, undefined);
  const [step, setStep] = useState(0);
  const last = STEP_KEYS.length - 1;

  // After the wizard is saved, go to the dashboard.
  useEffect(() => {
    if (wizard && state?.saved) router.push("/portal");
  }, [wizard, state, router]);

  function go(next: number) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const groups = skills.reduce<Record<string, SkillOption[]>>((acc, skill) => {
    (acc[skill.category] ??= []).push(skill);
    return acc;
  }, {});

  const categoryName = (category: string) =>
    (t.skillCategories as Record<string, string>)[category] ?? category;

  // Every step stays in the page (hidden when not shown), so all values are submitted together.
  const steps: React.ReactNode[] = [
    <>
      <Section title={f.sections.basics}>
        <Field label={f.fields.stageName} hint={f.fields.stageNameHint}>
          <Input name="stageName" required defaultValue={values.stageName} />
        </Field>
        <Field label={f.fields.legalName} hint={f.fields.legalNameHint}>
          <Input name="legalName" defaultValue={values.legalName} />
        </Field>
        <Field label={f.fields.taglineEn}>
          <Input name="taglineEn" defaultValue={values.taglineEn} placeholder={f.fields.taglineEnPlaceholder} />
        </Field>
        <Field label={f.fields.taglineSi}>
          <Input name="taglineSi" defaultValue={values.taglineSi} placeholder={f.fields.taglineSiPlaceholder} />
        </Field>
      </Section>
      <Section title={f.sections.about} hint={f.sections.aboutHint}>
        <Field label={f.fields.bioEn}>
          <textarea name="bioEn" defaultValue={values.bioEn} className={textareaClass} />
        </Field>
        <Field label={f.fields.bioSi}>
          <textarea name="bioSi" defaultValue={values.bioSi} className={textareaClass} />
        </Field>
      </Section>
    </>,

    <Section title={f.sections.details}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.fields.gender}>
          <Select name="gender" defaultValue={values.gender}>
            <option value="">{f.fields.genderNone}</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {t.genders[g]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={f.fields.birthYear}>
          <Input name="birthYear" inputMode="numeric" defaultValue={values.birthYear} placeholder="1995" />
        </Field>
        <Field label={f.fields.location}>
          <Input name="location" defaultValue={values.location} placeholder={f.fields.locationPlaceholder} />
        </Field>
        <Field label={f.fields.nationality}>
          <Input name="nationality" defaultValue={values.nationality} />
        </Field>
        <Field label={f.fields.height}>
          <Input name="heightCm" inputMode="numeric" defaultValue={values.heightCm} placeholder="175" />
        </Field>
        <Field label={f.fields.build}>
          <Input name="build" defaultValue={values.build} placeholder={f.fields.buildPlaceholder} />
        </Field>
        <Field label={f.fields.eyeColor}>
          <Input name="eyeColor" defaultValue={values.eyeColor} />
        </Field>
        <Field label={f.fields.hair}>
          <Input name="hairColor" defaultValue={values.hairColor} />
        </Field>
      </div>
    </Section>,

    <>
      <Section title={f.sections.languages}>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_CODES.map((code) => (
            <Chip
              key={code}
              name="languages"
              value={code}
              label={t.languages[code]}
              defaultChecked={values.languages.includes(code)}
            />
          ))}
        </div>
      </Section>
      <Section title={f.sections.skills} hint={f.sections.skillsHint}>
        {Object.entries(groups).map(([category, items]) => (
          <div key={category} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-white/70">{categoryName(category)}</h3>
            <div className="flex flex-wrap gap-2">
              {items.map((skill) => (
                <Chip
                  key={skill.id}
                  name="skillIds"
                  value={skill.id}
                  label={locale === "si" ? skill.nameSi : skill.nameEn}
                  sub={locale === "si" ? skill.nameEn : skill.nameSi}
                  defaultChecked={values.skillIds.includes(skill.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </Section>
    </>,

    <Section title={f.sections.social} hint={f.sections.socialHint}>
      <div className="grid gap-4 sm:grid-cols-2">
        {SOCIAL_PLATFORMS.map((platform) => (
          <Field key={platform} label={SOCIAL_LABELS[platform]}>
            <Input
              name={`social_${platform}`}
              defaultValue={values.social[platform] ?? ""}
              inputMode="url"
              placeholder="https://"
            />
          </Field>
        ))}
      </div>
    </Section>,
  ];

  const barClass = "sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 md:bottom-6";
  const barInner =
    "glass mx-auto flex items-center justify-between gap-3 rounded-full border border-white/10 p-2 shadow-2xl shadow-black/50";

  return (
    <form action={action} className="flex flex-col gap-4">
      {wizard && (
        <div className="flex flex-col gap-2 px-1">
          <ol className="flex gap-2" aria-hidden="true">
            {STEP_KEYS.map((key, i) => (
              <li
                key={key}
                className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-brand-gradient" : "bg-white/10")}
              />
            ))}
          </ol>
          <p className="text-sm font-semibold text-muted-foreground">
            {format(f.stepOf, {
              step: step + 1,
              total: STEP_KEYS.length,
              name: f.steps[STEP_KEYS[step]],
            })}
          </p>
        </div>
      )}

      <fieldset disabled={!canEdit} className="flex flex-col gap-4">
        {steps.map((content, i) => (
          <div key={i} hidden={wizard && i !== step} className="flex flex-col gap-4">
            {content}
          </div>
        ))}
      </fieldset>

      {wizard ? (
        <>
          {state?.error && (
            <p role="alert" className="rounded-2xl bg-danger/12 px-4 py-3 text-sm font-medium text-danger">
              {state.error}
            </p>
          )}
          <div className={barClass}>
            <div className={barInner}>
              <Button type="button" variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
                {t.common.back}
              </Button>
              {step < last ? (
                <Button type="button" onClick={() => go(step + 1)}>
                  {t.common.next}
                </Button>
              ) : (
                <Button type="submit" loading={pending} disabled={!canEdit}>
                  {t.common.finish}
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className={barClass}>
          <div className={cn(barInner, "pl-5")}>
            <p
              aria-live="polite"
              className={
                state?.error
                  ? "text-sm font-medium text-danger"
                  : state?.saved
                    ? "text-sm font-medium text-success"
                    : "text-sm text-muted-foreground"
              }
            >
              {state?.error ?? (state?.saved ? f.saved : canEdit ? f.saveHint : f.readOnly)}
            </p>
            <Button type="submit" loading={pending} disabled={!canEdit}>
              {f.save}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
