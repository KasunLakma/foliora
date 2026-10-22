export const GENDERS = ["MALE", "FEMALE", "NON_BINARY", "OTHER"] as const;

export const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  MALE: "Male",
  FEMALE: "Female",
  NON_BINARY: "Non-binary",
  OTHER: "Other",
};

export const SOCIAL_PLATFORMS = [
  "INSTAGRAM",
  "FACEBOOK",
  "TIKTOK",
  "YOUTUBE",
  "IMDB",
  "LINKEDIN",
  "X",
  "WEBSITE",
] as const;

export const SOCIAL_LABELS: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  IMDB: "IMDb",
  LINKEDIN: "LinkedIn",
  X: "X",
  WEBSITE: "Website",
};

export const LANGUAGES = [
  { code: "si", label: "Sinhala" },
  { code: "en", label: "English" },
  { code: "ta", label: "Tamil" },
  { code: "hi", label: "Hindi" },
  { code: "fr", label: "French" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
] as const;

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as [
  (typeof LANGUAGES)[number]["code"],
  ...(typeof LANGUAGES)[number]["code"][],
];

export const SKILL_CATEGORY_LABELS: Record<string, string> = {
  performance: "Performance",
  modelling: "Modelling",
  movement: "Movement",
  sport: "Sport",
  vehicles: "Vehicles",
  music: "Music",
};
