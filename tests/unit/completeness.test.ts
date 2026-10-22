import { describe, expect, it } from "vitest";
import { profileCompleteness } from "../../src/modules/profiles/completeness";

const empty = {
  taglineEn: null,
  taglineSi: null,
  bioEn: null,
  bioSi: null,
  gender: null,
  birthYear: null,
  location: null,
  heightCm: null,
  build: null,
  eyeColor: null,
  hairColor: null,
  languageCount: 0,
  skillCount: 0,
  socialCount: 0,
};

describe("profile completeness", () => {
  it("scores an empty profile as 0 and lists what is missing", () => {
    const result = profileCompleteness(empty);
    expect(result.percent).toBe(0);
    expect(result.missing).toHaveLength(10);
  });

  it("scores a full profile as 100", () => {
    const result = profileCompleteness({
      taglineEn: "Actor",
      taglineSi: null,
      bioEn: null,
      bioSi: "ඉතිහාසය",
      gender: "MALE",
      birthYear: 1995,
      location: "Colombo",
      heightCm: 175,
      build: "Athletic",
      eyeColor: null,
      hairColor: null,
      languageCount: 2,
      skillCount: 3,
      socialCount: 1,
    });
    expect(result.percent).toBe(100);
    expect(result.missing).toHaveLength(0);
  });
});
