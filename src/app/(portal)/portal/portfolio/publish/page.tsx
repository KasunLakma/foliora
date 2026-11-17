import { auth } from "@/auth";
import { PortfolioTabs } from "@/components/portfolio/portfolio-tabs";
import { PublishManager, type PublishView } from "@/components/portfolio/publish-manager";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { getDictionary } from "@/lib/i18n/server";
import { countPhotos } from "@/modules/photos/service";
import { ensurePortfolio } from "@/modules/portfolio/service";
import { slugify } from "@/modules/portfolio/slug";
import { getProfile } from "@/modules/profiles/service";
import { hasPermission } from "@/modules/roles/permissions";

export const metadata = { title: "Publish" };

export default async function PublishPage() {
  const { t } = await getDictionary();
  const session = await auth();
  const user = session!.user;
  const tenantId = user.activeTenantId;

  if (!tenantId) {
    return (
      <Card>
        <p className="text-muted-foreground">{t.profile.noAccount}</p>
      </Card>
    );
  }

  const portfolio = await ensurePortfolio(tenantId);
  if (!portfolio) {
    return (
      <Card>
        <h1 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">{t.profile.agencyTitle}</h1>
        <p className="mt-2 text-muted-foreground">{t.profile.agencyText}</p>
      </Card>
    );
  }

  const [profile, photoCount, tenant, canDesign, canPublish] = await Promise.all([
    getProfile(tenantId),
    countPhotos(tenantId),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { status: true } }),
    hasPermission(user.id, tenantId, "portfolio.design"),
    hasPermission(user.id, tenantId, "portfolio.publish"),
  ]);

  const view: PublishView = {
    slug: portfolio.slug ?? slugify(profile?.stageName ?? ""),
    hasSavedSlug: Boolean(portfolio.slug),
    templateKey: portfolio.templateKey,
    seoTitle: portfolio.seoTitle ?? "",
    seoDescription: portfolio.seoDescription ?? "",
    published: portfolio.status === "PUBLISHED",
    host: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").host,
    hasPhoto: photoCount > 0,
    hasBio: Boolean(profile?.bioEn?.trim() || profile?.bioSi?.trim()),
    approved: tenant?.status === "ACTIVE",
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 font-display text-2xl font-semibold tracking-[0.1em] uppercase">{t.portfolio.title}</h1>
      <PortfolioTabs />
      <PublishManager view={view} canDesign={canDesign} canPublish={canPublish} />
    </div>
  );
}
