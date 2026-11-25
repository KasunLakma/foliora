export type StartStepKey = "profile" | "photo" | "work" | "publish";

/**
 * The four things a new talent should do before anyone can find them.
 * "profile" is done once there is a tagline and a bio, because those are what a visitor reads first.
 */
export function onboardingSteps(input: {
  profileMissing: string[];
  photos: number;
  works: number;
  showreels: number;
  published: boolean;
}): { key: StartStepKey; done: boolean }[] {
  return [
    { key: "profile", done: !input.profileMissing.includes("tagline") && !input.profileMissing.includes("bio") },
    { key: "photo", done: input.photos > 0 },
    { key: "work", done: input.works + input.showreels > 0 },
    { key: "publish", done: input.published },
  ];
}
