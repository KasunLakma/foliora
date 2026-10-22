import { auth } from "@/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card } from "@/components/ui/card";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { toFormValues } from "@/modules/profiles/form-values";
import { ensureProfile, getProfile, listSkills, scoreProfile } from "@/modules/profiles/service";
import { hasPermission } from "@/modules/roles/permissions";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
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

  await ensureProfile(tenantId);
  const [profile, skills, canEdit] = await Promise.all([
    getProfile(tenantId),
    listSkills(),
    hasPermission(user.id, tenantId, "profile.edit"),
  ]);

  if (!profile) {
    return (
      <Card>
        <h1 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">{t.profile.agencyTitle}</h1>
        <p className="mt-2 text-muted-foreground">{t.profile.agencyText}</p>
      </Card>
    );
  }

  const { percent } = scoreProfile(profile);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 px-1">
        <h1 className="font-display text-2xl font-semibold tracking-[0.1em] uppercase">{t.profile.title}</h1>
        <span className="text-sm font-semibold text-brand">{format(t.profile.percent, { percent })}</span>
      </div>
      <ProfileForm
        values={toFormValues(profile)}
        skills={skills.map((s) => ({
          id: s.id,
          key: s.key,
          category: s.category,
          nameEn: s.nameEn,
          nameSi: s.nameSi,
        }))}
        canEdit={canEdit}
      />
    </div>
  );
}
