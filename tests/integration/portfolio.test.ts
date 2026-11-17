import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/db/prisma";
import { ConflictError, NotApprovedError, ValidationError } from "../../src/lib/errors";
import { registerUser } from "../../src/modules/auth/service";
import { photoFolder } from "../../src/modules/photos/paths";
import { registerPhoto } from "../../src/modules/photos/service";
import {
  ensurePortfolio,
  getPublicPortfolio,
  saveSiteSettings,
  setPublished,
} from "../../src/modules/portfolio/service";
import { addShowreel } from "../../src/modules/showreel/service";
import { saveWork } from "../../src/modules/works/service";

const stamp = Date.now();
const password = "a-long-password-123";
const slugA = `test-a-${stamp}`;
const slugB = `test-b-${stamp}`;
const SECRET_NAME = "Secret Legal Name";

let a: { userId: string; tenantId: string };
let b: { userId: string; tenantId: string };

const settings = (slug: string) => ({
  slug,
  templateKey: "cinematic",
  seoTitle: null,
  seoDescription: null,
});

beforeAll(async () => {
  a = await registerUser({
    name: "Site A",
    email: `site-a-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Site Tenant A ${stamp}`,
  });
  b = await registerUser({
    name: "Site B",
    email: `site-b-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Site Tenant B ${stamp}`,
  });
  // A is waiting for approval, B is approved.
  await prisma.tenant.update({ where: { id: a.tenantId }, data: { status: "PENDING" } });
  await prisma.tenant.update({ where: { id: b.tenantId }, data: { status: "ACTIVE" } });
});

afterAll(async () => {
  const tenantIds = [a.tenantId, b.tenantId];
  await prisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [a.userId, b.userId] } } });
  await prisma.$disconnect();
});

describe("website settings", () => {
  it("creates one draft per talent, only once", async () => {
    const first = await ensurePortfolio(a.tenantId);
    const second = await ensurePortfolio(a.tenantId);
    expect(first?.id).toBe(second?.id);
    expect(first?.status).toBe("DRAFT");
    expect(first?.slug).toBeNull();
    await ensurePortfolio(b.tenantId);
  });

  it("rejects bad, reserved and unknown choices", async () => {
    await expect(saveSiteSettings(a.tenantId, a.userId, settings("ab"))).rejects.toBeInstanceOf(ValidationError);
    await expect(saveSiteSettings(a.tenantId, a.userId, settings("portal"))).rejects.toBeInstanceOf(ValidationError);
    await expect(
      saveSiteSettings(a.tenantId, a.userId, { ...settings(slugA), templateKey: "nope" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("will not publish before an address is chosen", async () => {
    await expect(setPublished(b.tenantId, b.userId, true)).rejects.toBeInstanceOf(ValidationError);
  });

  it("keeps every address unique", async () => {
    await saveSiteSettings(a.tenantId, a.userId, settings(slugA));
    await expect(saveSiteSettings(b.tenantId, b.userId, settings(slugA))).rejects.toBeInstanceOf(ConflictError);
    await saveSiteSettings(b.tenantId, b.userId, settings(slugB));
  });

  it("will not publish an account that is still waiting for approval", async () => {
    await expect(setPublished(a.tenantId, a.userId, true)).rejects.toBeInstanceOf(NotApprovedError);
  });
});

describe("public page data", () => {
  beforeAll(async () => {
    await prisma.talentProfile.updateMany({
      where: { tenantId: b.tenantId },
      data: { legalName: SECRET_NAME, birthYear: 1990, bioEn: "Actor and dancer", heightCm: 175 },
    });
    await registerPhoto(b.tenantId, b.userId, {
      publicId: `${photoFolder(b.tenantId)}/hero`,
      width: 1200,
      height: 1500,
      bytes: 300_000,
      format: "jpg",
    });
    await saveWork(b.tenantId, b.userId, {
      id: undefined,
      title: "The Silent Guest",
      year: 2024,
      type: "FILM",
      roleName: null,
      roleType: null,
      director: null,
      company: null,
      description: null,
      link: null,
      isFeatured: false,
    });
    await addShowreel(b.tenantId, b.userId, { title: "Reel", url: "https://youtu.be/dQw4w9WgXcQ" });
  });

  it("shows nothing while it is a draft", async () => {
    expect(await getPublicPortfolio(slugB)).toBeNull();
  });

  it("shows the content once published, and never the private details", async () => {
    await setPublished(b.tenantId, b.userId, true);
    const data = await getPublicPortfolio(slugB);

    expect(data?.live).toBe(true);
    expect(data?.stageName).toBe(`Site Tenant B ${stamp}`);
    expect(data?.bioEn).toBe("Actor and dancer");
    expect(data?.photos).toHaveLength(1);
    expect(data?.photos[0].isCover).toBe(true);
    expect(data?.works[0].title).toBe("The Silent Guest");
    expect(data?.showreels[0].isPrimary).toBe(true);

    const text = JSON.stringify(data);
    expect(text).not.toContain(SECRET_NAME);
    expect(data).not.toHaveProperty("legalName");
    expect(data).not.toHaveProperty("birthYear");
    expect(data).not.toHaveProperty("tenantId");
  });

  it("finds the page whatever the letter case of the address", async () => {
    expect((await getPublicPortfolio(slugB.toUpperCase()))?.slug).toBe(slugB);
    expect(await getPublicPortfolio("no-such-address")).toBeNull();
    expect(await getPublicPortfolio("   ")).toBeNull();
  });

  it("lets only the owner preview a draft", async () => {
    expect(await getPublicPortfolio(slugA)).toBeNull();
    expect((await getPublicPortfolio(slugA, { previewTenantId: a.tenantId }))?.live).toBe(false);
    expect(await getPublicPortfolio(slugA, { previewTenantId: b.tenantId })).toBeNull();
  });

  it("hides the page when unpublished or when the account is suspended", async () => {
    await setPublished(b.tenantId, b.userId, false);
    expect(await getPublicPortfolio(slugB)).toBeNull();

    await setPublished(b.tenantId, b.userId, true);
    expect(await getPublicPortfolio(slugB)).not.toBeNull();

    await prisma.tenant.update({ where: { id: b.tenantId }, data: { status: "SUSPENDED" } });
    expect(await getPublicPortfolio(slugB)).toBeNull();
    await prisma.tenant.update({ where: { id: b.tenantId }, data: { status: "ACTIVE" } });
  });
});
