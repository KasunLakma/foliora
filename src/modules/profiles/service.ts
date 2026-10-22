import { prisma } from "../../lib/db/prisma";
import { tenantDb } from "../../lib/db/tenant";
import { writeAudit } from "../audit/service";
import { profileCompleteness } from "./completeness";
import type { ProfileInput } from "./schema";

/** Individual accounts get exactly one profile. Agencies add talents in a later phase. */
export async function ensureProfile(tenantId: string) {
  const db = tenantDb(tenantId);
  const existing = await db.talentProfile.findFirst({ select: { id: true } });
  if (existing) return existing;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, type: true },
  });
  if (!tenant || tenant.type !== "INDIVIDUAL") return null;

  return db.talentProfile.create({ data: { tenantId, stageName: tenant.name } });
}

export async function getProfile(tenantId: string) {
  return tenantDb(tenantId).talentProfile.findFirst({
    include: {
      skills: { select: { skillId: true } },
      socialLinks: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function listSkills() {
  return prisma.skill.findMany({ orderBy: { sortOrder: "asc" } });
}

/** Saves the whole profile in one atomic write (nested writes run in one transaction). */
export async function updateProfile(tenantId: string, actorUserId: string, input: ProfileInput) {
  const db = tenantDb(tenantId);
  const profile = await db.talentProfile.findFirst({ select: { id: true } });
  if (!profile) throw new Error("Profile not found");

  const validSkills = input.skillIds.length
    ? await prisma.skill.findMany({ where: { id: { in: input.skillIds } }, select: { id: true } })
    : [];

  await db.talentProfile.update({
    where: { id: profile.id },
    data: {
      stageName: input.stageName,
      legalName: input.legalName,
      taglineEn: input.taglineEn,
      taglineSi: input.taglineSi,
      bioEn: input.bioEn,
      bioSi: input.bioSi,
      gender: input.gender,
      birthYear: input.birthYear,
      location: input.location,
      nationality: input.nationality,
      heightCm: input.heightCm,
      build: input.build,
      eyeColor: input.eyeColor,
      hairColor: input.hairColor,
      languages: input.languages,
      socialLinks: {
        deleteMany: {},
        create: input.socialLinks.map((link, index) => ({
          tenantId,
          platform: link.platform,
          url: link.url,
          sortOrder: index,
        })),
      },
      skills: {
        deleteMany: {},
        create: validSkills.map((skill) => ({ tenantId, skillId: skill.id })),
      },
    },
  });

  await writeAudit({
    tenantId,
    actorUserId,
    action: "profile.update",
    targetType: "TalentProfile",
    targetId: profile.id,
  });
}

export function scoreProfile(profile: NonNullable<Awaited<ReturnType<typeof getProfile>>>) {
  return profileCompleteness({
    taglineEn: profile.taglineEn,
    taglineSi: profile.taglineSi,
    bioEn: profile.bioEn,
    bioSi: profile.bioSi,
    gender: profile.gender,
    birthYear: profile.birthYear,
    location: profile.location,
    heightCm: profile.heightCm,
    build: profile.build,
    eyeColor: profile.eyeColor,
    hairColor: profile.hairColor,
    languageCount: profile.languages.length,
    skillCount: profile.skills.length,
    socialCount: profile.socialLinks.length,
  });
}
