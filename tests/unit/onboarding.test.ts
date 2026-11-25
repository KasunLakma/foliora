import { describe, expect, it } from "vitest";
import { onboardingSteps } from "../../src/modules/profiles/onboarding";

const base = { profileMissing: ["tagline", "bio", "gender"], photos: 0, works: 0, showreels: 0, published: false };
const done = (input: Parameters<typeof onboardingSteps>[0]) =>
  Object.fromEntries(onboardingSteps(input).map((s) => [s.key, s.done]));

describe("the getting-started checklist", () => {
  it("starts with nothing done", () => {
    expect(done(base)).toEqual({ profile: false, photo: false, work: false, publish: false });
  });

  it("counts the profile as done only when both a tagline and a bio exist", () => {
    expect(done({ ...base, profileMissing: ["bio"] }).profile).toBe(false);
    expect(done({ ...base, profileMissing: ["tagline"] }).profile).toBe(false);
    expect(done({ ...base, profileMissing: ["gender", "skills"] }).profile).toBe(true);
  });

  it("counts a photo, a work or a showreel, and publishing", () => {
    expect(done({ ...base, photos: 1 }).photo).toBe(true);
    expect(done({ ...base, works: 1 }).work).toBe(true);
    expect(done({ ...base, showreels: 1 }).work).toBe(true);
    expect(done({ ...base, published: true }).publish).toBe(true);
  });

  it("keeps the order: profile, photo, work, publish", () => {
    expect(onboardingSteps(base).map((s) => s.key)).toEqual(["profile", "photo", "work", "publish"]);
  });
});
