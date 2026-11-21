import { prisma } from "../../lib/db/prisma";
import { tenantDb } from "../../lib/db/tenant";
import { ConflictError, NotApprovedError, NotFoundError, ValidationError } from "../../lib/errors";
import { writeAudit } from "../audit/service";
import { getCurrentPlan } from "../billing/service";
import { visiblePhotos } from "../billing/rules";
import type { PublicPortfolio } from "./public-types";
import { validateSlug } from "./slug";
import { TEMPLATE_KEYS } from "./templates";

/** Every individual talent has exactly one website settings row. Agencies get theirs in a later phase. */
export async function ensurePortfolio(tenantId: string) {
  const db = tenantDb(tenantId);
  const profile = await db.talentProfile.findFirst({ select: { id: true } });
  if (!profile) return null;

  const existing = await db.portfolio.findFirst();
  if (existing) return existing;

  try {
    return await db.portfolio.create({ data: { tenantId, profileId: profile.id } });
  } catch (error) {
    // two pages opened at once: the other one created it first
    if ((error as { code?: string }).code === "P2002") return db.portfolio.findFirst();
    throw error;
  }
}

export type SiteSettingsInput = {
  slug: string;
  templateKey: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export async function saveSiteSettings(tenantId: string, actorUserId: string, input: SiteSettingsInput) {
  const checked = validateSlug(input.slug);
  if (!checked.ok) throw new ValidationError(checked.problem);
  if (!(TEMPLATE_KEYS as readonly string[]).includes(input.templateKey)) {
    throw new ValidationError("template");
  }

  const portfolio = await ensurePortfolio(tenantId);
  if (!portfolio) throw new NotFoundError("Profile not found");

  try {
    await tenantDb(tenantId).portfolio.updateMany({
      where: { id: portfolio.id },
      data: {
        slug: checked.slug,
        templateKey: input.templateKey,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new ConflictError("Address taken");
    throw error;
  }

  await writeAudit({
    tenantId,
    actorUserId,
    action: "portfolio.settings",
    targetType: "Portfolio",
    targetId: portfolio.id,
    after: { slug: checked.slug, templateKey: input.templateKey },
  });
}

/** Publishing needs an address, and an approved account (new accounts wait for approval). */
export async function setPublished(tenantId: string, actorUserId: string, publish: boolean) {
  const portfolio = await ensurePortfolio(tenantId);
  if (!portfolio) throw new NotFoundError("Profile not found");

  if (publish) {
    if (!portfolio.slug) throw new ValidationError("address");
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { status: true } });
    if (tenant?.status !== "ACTIVE") throw new NotApprovedError();
  }

  await tenantDb(tenantId).portfolio.updateMany({
    where: { id: portfolio.id },
    data: publish ? { status: "PUBLISHED", publishedAt: new Date() } : { status: "DRAFT" },
  });
  await writeAudit({
    tenantId,
    actorUserId,
    action: publish ? "portfolio.publish" : "portfolio.unpublish",
    targetType: "Portfolio",
    targetId: portfolio.id,
  });
}

/**
 * The data of a public page. Returns null when the page must not be shown:
 * unknown address, not published, or the account is not active.
 * The owner may also see their own unpublished draft (previewTenantId).
 *
 * The tenant is taken from the address record itself, never from the visitor.
 */
export async function getPublicPortfolio(
  rawSlug: string,
  options: { previewTenantId?: string } = {},
): Promise<PublicPortfolio | null> {
  const slug = rawSlug.trim().toLowerCase();
  if (!slug) return null;

  const portfolio = await prisma.portfolio.findUnique({
    where: { slug },
    include: { profile: true },
  });
  if (!portfolio || !portfolio.slug) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: portfolio.tenantId },
    select: { status: true, deletedAt: true },
  });

  const live =
    portfolio.status === "PUBLISHED" &&
    tenant?.status === "ACTIVE" &&
    !tenant.deletedAt &&
    !portfolio.profile.deletedAt;
  const ownerPreview = options.previewTenantId === portfolio.tenantId;
  if (!live && !ownerPreview) return null;

  const db = tenantDb(portfolio.tenantId);
  const [photos, works, showreels, profileSkills, socialLinks, plan] = await Promise.all([
    db.photo.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    db.work.findMany({ orderBy: [{ isFeatured: "desc" }, { year: "desc" }, { createdAt: "desc" }] }),
    db.showreel.findMany({ orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] }),
    db.profileSkill.findMany({ include: { skill: true }, orderBy: { skill: { sortOrder: "asc" } } }),
    db.socialLink.findMany({ orderBy: { sortOrder: "asc" } }),
    getCurrentPlan(portfolio.tenantId),
  ]);

  const p = portfolio.profile;
  return {
    live,
    showBadge: plan.isFree,
    slug: portfolio.slug,
    templateKey: portfolio.templateKey,
    stageName: p.stageName,
    taglineEn: p.taglineEn,
    taglineSi: p.taglineSi,
    bioEn: p.bioEn,
    bioSi: p.bioSi,
    location: p.location,
    nationality: p.nationality,
    heightCm: p.heightCm,
    build: p.build,
    eyeColor: p.eyeColor,
    hairColor: p.hairColor,
    languages: p.languages,
    skills: profileSkills.map((ps) => ({ nameEn: ps.skill.nameEn, nameSi: ps.skill.nameSi })),
    socialLinks: socialLinks.map((l) => ({ platform: l.platform, url: l.url })),
    photos: visiblePhotos(photos, plan.limits.photos).map((x) => ({
      publicId: x.publicId,
      caption: x.caption,
      isCover: x.isCover,
    })),
    works: works.map((w) => ({
      title: w.title,
      year: w.year,
      type: w.type,
      roleName: w.roleName,
      roleType: w.roleType,
      director: w.director,
      company: w.company,
      description: w.description,
      link: w.link,
      isFeatured: w.isFeatured,
    })),
    showreels: showreels.map((v) => ({
      title: v.title,
      provider: v.provider,
      videoId: v.videoId,
      isPrimary: v.isPrimary,
    })),
    seoTitle: portfolio.seoTitle,
    seoDescription: portfolio.seoDescription,
  };
}
