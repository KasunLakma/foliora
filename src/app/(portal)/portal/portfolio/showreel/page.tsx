import { auth } from "@/auth";
import { PortfolioTabs } from "@/components/portfolio/portfolio-tabs";
import { ShowreelManager, type ShowreelView } from "@/components/portfolio/showreel-manager";
import { Card } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/server";
import { ensureProfile } from "@/modules/profiles/service";
import { hasPermission } from "@/modules/roles/permissions";
import { listShowreels } from "@/modules/showreel/service";
import { thumbnailUrl, watchUrl } from "@/modules/showreel/video";

export const metadata = { title: "Showreel" };

export default async function ShowreelPage() {
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

  const profile = await ensureProfile(tenantId);
  if (!profile) {
    return (
      <Card>
        <h1 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">{t.profile.agencyTitle}</h1>
        <p className="mt-2 text-muted-foreground">{t.profile.agencyText}</p>
      </Card>
    );
  }

  const [videos, canEdit] = await Promise.all([
    listShowreels(tenantId),
    hasPermission(user.id, tenantId, "media.upload"),
  ]);

  const views: ShowreelView[] = videos.map((v) => ({
    id: v.id,
    title: v.title,
    provider: v.provider,
    isPrimary: v.isPrimary,
    watchUrl: watchUrl(v.provider, v.videoId),
    thumbnail: thumbnailUrl(v.provider, v.videoId),
  }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 font-display text-2xl font-semibold tracking-[0.1em] uppercase">{t.portfolio.title}</h1>
      <PortfolioTabs />
      <ShowreelManager videos={views} canEdit={canEdit} />
    </div>
  );
}
