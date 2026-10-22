export type CompletenessInput = {
  taglineEn: string | null;
  taglineSi: string | null;
  bioEn: string | null;
  bioSi: string | null;
  gender: string | null;
  birthYear: number | null;
  location: string | null;
  heightCm: number | null;
  build: string | null;
  eyeColor: string | null;
  hairColor: string | null;
  languageCount: number;
  skillCount: number;
  socialCount: number;
};

const has = (v: string | null) => !!v && v.trim().length > 0;

/** 10 checks, 10 points each. */
export function profileCompleteness(p: CompletenessInput) {
  const checks: { done: boolean; todo: string }[] = [
    { done: has(p.taglineEn) || has(p.taglineSi), todo: "Add a short tagline" },
    { done: has(p.bioEn) || has(p.bioSi), todo: "Write your bio" },
    { done: has(p.gender), todo: "Add your gender" },
    { done: p.birthYear !== null, todo: "Add your birth year" },
    { done: has(p.location), todo: "Add your location" },
    { done: p.heightCm !== null, todo: "Add your height" },
    { done: has(p.build) || has(p.eyeColor) || has(p.hairColor), todo: "Describe your look" },
    { done: p.languageCount > 0, todo: "Choose the languages you speak" },
    { done: p.skillCount > 0, todo: "Pick your skills" },
    { done: p.socialCount > 0, todo: "Link a social profile" },
  ];

  const done = checks.filter((c) => c.done).length;
  return {
    percent: done * 10,
    missing: checks.filter((c) => !c.done).map((c) => c.todo),
  };
}
