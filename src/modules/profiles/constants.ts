export const GENDERS = ["MALE", "FEMALE", "NON_BINARY", "OTHER"] as const;

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

/** Brand names are not translated. */
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

/** Language names are translated through the dictionary (dictionary.languages). */
export const LANGUAGE_CODES = ["si", "en", "ta", "hi", "fr", "ja", "zh"] as const;
