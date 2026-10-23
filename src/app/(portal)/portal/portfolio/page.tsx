import { auth } from "@/auth";
import { PortfolioTabs } from "@/components/portfolio/portfolio-tabs";
import { WorksManager, type WorkView } from "@/components/portfolio/works-manager";
import { Card } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/server";
import { ensureProfile } from "@/modules/profiles/service";
import { hasPermission } from "@/modules/roles/permissions";
import { listWorks } from "@/modules/works/service";

export const metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
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

  const [works, canEdit] = await Promise.all([
    listWorks(tenantId),
    hasPermission(user.id, tenantId, "works.manage"),
  ]);

  const views: WorkView[] = works.map((w) => ({
    id: w.id,
    title: w.title,
    year: w.year,
    type: w.type,
    roleName: w.roleName ?? "",
    roleType: w.roleType ?? "",
    director: w.director ?? "",
    company: w.company ?? "",
    description: w.description ?? "",
    link: w.link ?? "",
    isFeatured: w.isFeatured,
  }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 font-display text-2xl font-semibold tracking-[0.1em] uppercase">{t.portfolio.title}</h1>
      <PortfolioTabs />
      <WorksManager works={views} canEdit={canEdit} />
    </div>
  );
}
