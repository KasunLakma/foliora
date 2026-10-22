import type { getProfile } from "./service";
import type { ProfileFormValues } from "./types";

type LoadedProfile = NonNullable<Awaited<ReturnType<typeof getProfile>>>;

export function toFormValues(profile: LoadedProfile): ProfileFormValues {
  return {
    stageName: profile.stageName,
    legalName: profile.legalName ?? "",
    taglineEn: profile.taglineEn ?? "",
    taglineSi: profile.taglineSi ?? "",
    bioEn: profile.bioEn ?? "",
    bioSi: profile.bioSi ?? "",
    gender: profile.gender ?? "",
    birthYear: profile.birthYear?.toString() ?? "",
    location: profile.location ?? "",
    nationality: profile.nationality ?? "",
    heightCm: profile.heightCm?.toString() ?? "",
    build: profile.build ?? "",
    eyeColor: profile.eyeColor ?? "",
    hairColor: profile.hairColor ?? "",
    languages: profile.languages,
    skillIds: profile.skills.map((s) => s.skillId),
    social: Object.fromEntries(profile.socialLinks.map((l) => [l.platform, l.url])),
  };
}
