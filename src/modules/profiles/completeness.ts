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

export type TodoKey =
  | "tagline"
  | "bio"
  | "gender"
  | "birthYear"
  | "location"
  | "height"
  | "look"
  | "languages"
  | "skills"
  | "social";

const has = (v: string | null) => !!v && v.trim().length > 0;

/** 10 checks, 10 points each. `missing` holds keys; the screen translates them. */
export function profileCompleteness(p: CompletenessInput) {
  const checks: { done: boolean; key: TodoKey }[] = [
    { done: has(p.taglineEn) || has(p.taglineSi), key: "tagline" },
    { done: has(p.bioEn) || has(p.bioSi), key: "bio" },
    { done: has(p.gender), key: "gender" },
    { done: p.birthYear !== null, key: "birthYear" },
    { done: has(p.location), key: "location" },
    { done: p.heightCm !== null, key: "height" },
    { done: has(p.build) || has(p.eyeColor) || has(p.hairColor), key: "look" },
    { done: p.languageCount > 0, key: "languages" },
    { done: p.skillCount > 0, key: "skills" },
    { done: p.socialCount > 0, key: "social" },
  ];

  const done = checks.filter((c) => c.done).length;
  return {
    percent: done * 10,
    missing: checks.filter((c) => !c.done).map((c) => c.key),
  };
}
