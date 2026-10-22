import { auth } from "@/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card } from "@/components/ui/card";
import { ensureProfile, getProfile, listSkills, scoreProfile } from "@/modules/profiles/service";
import type { ProfileFormValues } from "@/modules/profiles/types";
import { hasPermission } from "@/modules/roles/permissions";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user;
  const tenantId = user.activeTenantId;

  if (!tenantId) {
    return (
      <Card>
        <p className="text-muted-foreground">No account is linked to this sign-in, so there is no profile to edit.</p>
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
        <h1 className="font-display text-lg font-semibold tracking-[0.1em] uppercase">Agency profiles</h1>
        <p className="mt-2 text-muted-foreground">
          Agencies will be able to add and manage several talents here in a later update.
        </p>
      </Card>
    );
  }

  const { percent } = scoreProfile(profile);

  const values: ProfileFormValues = {
    stageName: profile.stageName,
    legalName: profile.legalName ?? "",
    taglineEn: profile.taglineEn ?? "",
    taglineSi: profile.taglineSi ?? "",
    bioEn: profile.bioEn ?? "",
    bioSi: profile.bioSi ?? "",
    gender: profile.gender ?? "",
    birthYear: profile.birthYear?.toString() ?? "",
    location: profile.location ?? "",
    nationality: profile.nationality ?? "",
    heightCm: profile.heightCm?.toString() ?? "",
    build: profile.build ?? "",
    eyeColor: profile.eyeColor ?? "",
    hairColor: profile.hairColor ?? "",
    languages: profile.languages,
    skillIds: profile.skills.map((s) => s.skillId),
    social: Object.fromEntries(profile.socialLinks.map((l) => [l.platform, l.url])),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 px-1">
        <h1 className="font-display text-2xl font-semibold tracking-[0.1em] uppercase">Your profile</h1>
        <span className="text-sm font-semibold text-brand">{percent}% complete</span>
      </div>
      <ProfileForm
        values={values}
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
