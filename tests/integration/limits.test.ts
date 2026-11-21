import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/db/prisma";
import { registerUser } from "../../src/modules/auth/service";
import { photoFolder } from "../../src/modules/photos/paths";
import { getPublicPortfolio, saveSiteSettings, setPublished } from "../../src/modules/portfolio/service";

const stamp = Date.now();
const slug = `lim-${stamp}`;

let owner: { userId: string; tenantId: string };
let freeLimit: number;
let proLimit: number;

beforeAll(async () => {
  const plans = [
    { key: "free", name: "Free", monthlyPrice: 0, yearlyPrice: 0, sortOrder: 0, limits: { photos: 15, showreels: 5 } },
    { key: "pro", name: "Pro", monthlyPrice: 2500, yearlyPrice: 25000, sortOrder: 1, limits: { photos: 200, showreels: 5 } },
    { key: "agency", name: "Agency", monthlyPrice: 12500, yearlyPrice: 125000, sortOrder: 2, limits: { photos: 2000, showreels: 5 } },
  ];
  for (const plan of plans) await prisma.plan.upsert({ where: { key: plan.key }, update: {}, create: plan });
  const free = await prisma.plan.findUniqueOrThrow({ where: { key: "free" } });
  const pro = await prisma.plan.findUniqueOrThrow({ where: { key: "pro" } });
  freeLimit = (free.limits as { photos: number }).photos;
  proLimit = (pro.limits as { photos: number }).photos;

  owner = await registerUser({
    name: "Limits Owner",
    email: `limits-${stamp}@example.test`,
    password: "a-long-password-123",
    accountType: "INDIVIDUAL",
    tenantName: `Limits Tenant ${stamp}`,
  });
  await prisma.tenant.update({ where: { id: owner.tenantId }, data: { status: "ACTIVE" } });
  await saveSiteSettings(owner.tenantId, owner.userId, {
    slug,
    templateKey: "cinematic",
    seoTitle: null,
    seoDescription: null,
  });
  await setPublished(owner.tenantId, owner.userId, true);

  // More photos than the Free plan allows, put in directly. The main photo is far down the list.
  const profile = await prisma.talentProfile.findFirstOrThrow({ where: { tenantId: owner.tenantId } });
  const total = freeLimit + 5;
  await prisma.photo.createMany({
    data: Array.from({ length: total }, (_, i) => ({
      tenantId: owner.tenantId,
      profileId: profile.id,
      publicId: `${photoFolder(owner.tenantId)}/p${i}`,
      width: 1200,
      height: 1500,
      bytes: 100_000,
      format: "jpg",
      sortOrder: i,
      isCover: i === total - 2,
    })),
  });
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { tenantId: owner.tenantId } });
  await prisma.subscription.deleteMany({ where: { tenantId: owner.tenantId } });
  await prisma.tenant.deleteMany({ where: { id: owner.tenantId } });
  await prisma.user.deleteMany({ where: { id: owner.userId } });
  await prisma.$disconnect();
});

describe("what the public page shows for each plan", () => {
  it("on the Free plan: only as many photos as the plan allows, the main one included, and the badge", async () => {
    const data = await getPublicPortfolio(slug);
    expect(data?.photos).toHaveLength(freeLimit);
    expect(data?.photos.some((p) => p.isCover)).toBe(true);
    expect(data?.showBadge).toBe(true);
  });

  it("an ended paid period changes nothing", async () => {
    const pro = await prisma.plan.findUniqueOrThrow({ where: { key: "pro" } });
    await prisma.subscription.create({
      data: {
        tenantId: owner.tenantId,
        planId: pro.id,
        period: "MONTHLY",
        startsAt: new Date(Date.now() - 40 * 24 * 3600 * 1000),
        endsAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      },
    });
    const data = await getPublicPortfolio(slug);
    expect(data?.photos).toHaveLength(freeLimit);
    expect(data?.showBadge).toBe(true);
  });

  it("on a paid plan: all the photos and no badge", async () => {
    const pro = await prisma.plan.findUniqueOrThrow({ where: { key: "pro" } });
    await prisma.subscription.create({
      data: {
        tenantId: owner.tenantId,
        planId: pro.id,
        period: "MONTHLY",
        startsAt: new Date(Date.now() - 3600 * 1000),
        endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
    });
    const data = await getPublicPortfolio(slug);
    expect(proLimit).toBeGreaterThan(freeLimit + 5);
    expect(data?.photos).toHaveLength(freeLimit + 5);
    expect(data?.showBadge).toBe(false);
  });

  it("nothing was deleted along the way", async () => {
    expect(await prisma.photo.count({ where: { tenantId: owner.tenantId } })).toBe(freeLimit + 5);
  });
});
