import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/db/prisma";
import { registerUser } from "../../src/modules/auth/service";
import type { ProfileInput } from "../../src/modules/profiles/schema";
import { ensureProfile, getProfile, updateProfile } from "../../src/modules/profiles/service";

const stamp = Date.now();
const password = "a-long-password-123";

let a: { userId: string; tenantId: string };
let b: { userId: string; tenantId: string };
let skillIds: string[] = [];

function input(overrides: Partial<ProfileInput> = {}): ProfileInput {
  return {
    stageName: "Test Name",
    legalName: null,
    taglineEn: null,
    taglineSi: null,
    bioEn: null,
    bioSi: null,
    gender: null,
    birthYear: null,
    location: null,
    nationality: null,
    heightCm: null,
    build: null,
    eyeColor: null,
    hairColor: null,
    languages: [],
    skillIds: [],
    socialLinks: [],
    ...overrides,
  };
}

beforeAll(async () => {
  a = await registerUser({
    name: "Profile A",
    email: `profile-a-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Profile Tenant A ${stamp}`,
  });
  b = await registerUser({
    name: "Profile B",
    email: `profile-b-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Profile Tenant B ${stamp}`,
  });
  skillIds = (await prisma.skill.findMany({ take: 2, orderBy: { sortOrder: "asc" } })).map((s) => s.id);
});

afterAll(async () => {
  const tenantIds = [a.tenantId, b.tenantId];
  await prisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [a.userId, b.userId] } } });
  await prisma.$disconnect();
});

describe("talent profile", () => {
  it("is created together with an individual account", async () => {
    const profile = await getProfile(a.tenantId);
    expect(profile?.stageName).toBe(`Profile Tenant A ${stamp}`);
    // ensureProfile must not create a second one
    await ensureProfile(a.tenantId);
    expect(await prisma.talentProfile.count({ where: { tenantId: a.tenantId } })).toBe(1);
  });

  it("saves details, skills and social links", async () => {
    await updateProfile(
      a.tenantId,
      a.userId,
      input({
        stageName: "Dinuka",
        bioEn: "Actor from Colombo",
        bioSi: "කොළඹ සිටින නළුවෙක්",
        heightCm: 175,
        languages: ["si", "en"],
        skillIds,
        socialLinks: [{ platform: "INSTAGRAM", url: "https://instagram.com/dinuka" }],
      }),
    );

    const profile = await getProfile(a.tenantId);
    expect(profile?.stageName).toBe("Dinuka");
    expect(profile?.bioSi).toBe("කොළඹ සිටින නළුවෙක්");
    expect(profile?.languages).toEqual(["si", "en"]);
    expect(profile?.skills).toHaveLength(2);
    expect(profile?.socialLinks).toHaveLength(1);
  });

  it("replaces skills and links when saved again", async () => {
    await updateProfile(a.tenantId, a.userId, input({ stageName: "Dinuka", skillIds: [skillIds[0]] }));
    const profile = await getProfile(a.tenantId);
    expect(profile?.skills).toHaveLength(1);
    expect(profile?.socialLinks).toHaveLength(0);
  });

  it("never changes another tenant's profile", async () => {
    const other = await getProfile(b.tenantId);
    expect(other?.stageName).toBe(`Profile Tenant B ${stamp}`);
    expect(other?.bioEn).toBeNull();
    expect(other?.skills).toHaveLength(0);
  });

  it("writes an audit entry for every save", async () => {
    const logs = await prisma.auditLog.findMany({
      where: { tenantId: a.tenantId, action: "profile.update" },
    });
    expect(logs.length).toBe(2);
  });
});
