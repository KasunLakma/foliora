export type SkillOption = {
  id: string;
  key: string;
  category: string;
  nameEn: string;
  nameSi: string;
};

/** Plain values the profile form needs (safe to pass from server to browser). */
export type ProfileFormValues = {
  stageName: string;
  legalName: string;
  taglineEn: string;
  taglineSi: string;
  bioEn: string;
  bioSi: string;
  gender: string;
  birthYear: string;
  location: string;
  nationality: string;
  heightCm: string;
  build: string;
  eyeColor: string;
  hairColor: string;
  languages: string[];
  skillIds: string[];
  social: Record<string, string>;
};
