import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { getDictionary } from "@/lib/i18n/server";
import { toFormValues } from "@/modules/profiles/form-values";
import { ensureProfile, getProfile, listSkills } from "@/modules/profiles/service";
import { hasPermission } from "@/modules/roles/permissions";

export const metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const { t } = await getDictionary();
  const session = await auth();
  const user = session!.user;
  const tenantId = user.activeTenantId;
  if (!tenantId) redirect("/portal");

  await ensureProfile(tenantId);
  const profile = await getProfile(tenantId);
  if (!profile) redirect("/portal"); // agencies do not have a personal profile to set up

  const [skills, canEdit] = await Promise.all([
    listSkills(),
    hasPermission(user.id, tenantId, "profile.edit"),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 px-1">
        <h1 className="font-display text-2xl font-semibold tracking-[0.1em] uppercase">{t.welcome.title}</h1>
        <p className="text-muted-foreground">{t.welcome.text}</p>
        <Link href="/portal" className="w-fit text-sm font-semibold text-brand underline-offset-4 hover:underline">
          {t.common.skip}
        </Link>
      </div>
      <ProfileForm
        mode="wizard"
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
