"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { saveProfileAction } from "@/modules/profiles/actions";
import {
  GENDERS,
  GENDER_LABELS,
  LANGUAGES,
  SKILL_CATEGORY_LABELS,
  SOCIAL_LABELS,
  SOCIAL_PLATFORMS,
} from "@/modules/profiles/constants";
import type { ProfileFormValues, SkillOption } from "@/modules/profiles/types";

const textareaClass =
  "min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-foreground " +
  "placeholder:text-white/35 outline-none transition focus:border-brand focus:bg-white/8 focus:ring-4 focus:ring-brand/20";

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
}: {
  values: ProfileFormValues;
  skills: SkillOption[];
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState(saveProfileAction, undefined);

  const groups = skills.reduce<Record<string, SkillOption[]>>((acc, skill) => {
    (acc[skill.category] ??= []).push(skill);
    return acc;
  }, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <fieldset disabled={!canEdit} className="flex flex-col gap-4">
        <Section title="Basics">
          <Field label="Stage name" hint="This is the name shown on your portfolio.">
            <Input name="stageName" required defaultValue={values.stageName} />
          </Field>
          <Field label="Legal name" hint="Private. Never shown publicly.">
            <Input name="legalName" defaultValue={values.legalName} />
          </Field>
          <Field label="Tagline (English)">
            <Input name="taglineEn" defaultValue={values.taglineEn} placeholder="One line about you" />
          </Field>
          <Field label="Tagline (Sinhala)">
            <Input name="taglineSi" defaultValue={values.taglineSi} placeholder="ඔබ ගැන එක් පේළියක්" />
          </Field>
        </Section>

        <Section title="About you" hint="Write in one language or both. Visitors see the one that matches their language.">
          <Field label="Bio (English)">
            <textarea name="bioEn" defaultValue={values.bioEn} className={textareaClass} />
          </Field>
          <Field label="Bio (Sinhala)">
            <textarea name="bioSi" defaultValue={values.bioSi} className={textareaClass} />
          </Field>
        </Section>

        <Section title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Gender">
              <Select name="gender" defaultValue={values.gender}>
                <option value="">Prefer not to say</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {GENDER_LABELS[g]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Birth year">
              <Input name="birthYear" inputMode="numeric" defaultValue={values.birthYear} placeholder="1995" />
            </Field>
            <Field label="Location">
              <Input name="location" defaultValue={values.location} placeholder="Colombo, Sri Lanka" />
            </Field>
            <Field label="Nationality">
              <Input name="nationality" defaultValue={values.nationality} />
            </Field>
            <Field label="Height (cm)">
              <Input name="heightCm" inputMode="numeric" defaultValue={values.heightCm} placeholder="175" />
            </Field>
            <Field label="Build">
              <Input name="build" defaultValue={values.build} placeholder="Athletic" />
            </Field>
            <Field label="Eye colour">
              <Input name="eyeColor" defaultValue={values.eyeColor} />
            </Field>
            <Field label="Hair">
              <Input name="hairColor" defaultValue={values.hairColor} />
            </Field>
          </div>
        </Section>

        <Section title="Languages">
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <Chip
                key={lang.code}
                name="languages"
                value={lang.code}
                label={lang.label}
                defaultChecked={values.languages.includes(lang.code)}
              />
            ))}
          </div>
        </Section>

        <Section title="Skills" hint="Choose everything you can do. Casting directors can search by skill.">
          {Object.entries(groups).map(([category, items]) => (
            <div key={category} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-white/70">
                {SKILL_CATEGORY_LABELS[category] ?? category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <Chip
                    key={skill.id}
                    name="skillIds"
                    value={skill.id}
                    label={skill.nameEn}
                    sub={skill.nameSi}
                    defaultChecked={values.skillIds.includes(skill.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section title="Social links" hint="Paste a link or a web address. Leave blank what you do not use.">
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
        </Section>
      </fieldset>

      <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 md:bottom-6">
        <div className="glass mx-auto flex items-center justify-between gap-3 rounded-full border border-white/10 p-2 pl-5 shadow-2xl shadow-black/50">
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
            {state?.error ?? (state?.saved ? "Profile saved." : canEdit ? "Press Save to keep your changes." : "You can view this profile but not edit it.")}
          </p>
          <Button type="submit" loading={pending} disabled={!canEdit}>
            Save profile
          </Button>
        </div>
      </div>
    </form>
  );
}
