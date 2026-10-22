"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ForbiddenError } from "@/lib/errors";
import { getDictionary } from "@/lib/i18n/server";
import { requirePermission } from "@/modules/roles/permissions";
import { SOCIAL_PLATFORMS } from "./constants";
import { createProfileSchema } from "./schema";
import { updateProfile } from "./service";

export type ProfileFormState = { error?: string; saved?: boolean } | undefined;

function normalizeUrl(value: string) {
  const v = value.trim();
  if (v === "") return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function readForm(fd: FormData) {
  const str = (key: string) => (fd.get(key) ?? "").toString();
  return {
    stageName: str("stageName"),
    legalName: str("legalName"),
    taglineEn: str("taglineEn"),
    taglineSi: str("taglineSi"),
    bioEn: str("bioEn"),
    bioSi: str("bioSi"),
    gender: str("gender"),
    birthYear: str("birthYear"),
    location: str("location"),
    nationality: str("nationality"),
    heightCm: str("heightCm"),
    build: str("build"),
    eyeColor: str("eyeColor"),
    hairColor: str("hairColor"),
    languages: fd.getAll("languages").map(String),
    skillIds: fd.getAll("skillIds").map(String),
    socialLinks: SOCIAL_PLATFORMS.map((platform) => ({
      platform,
      url: normalizeUrl(str(`social_${platform}`)),
    })).filter((link) => link.url !== ""),
  };
}

export async function saveProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const { t } = await getDictionary();

  // The tenant always comes from the signed-in session, never from the form.
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.activeTenantId;
  if (!userId || !tenantId) return { error: t.profileErrors.signInAgain };

  try {
    await requirePermission(userId, tenantId, "profile.edit");
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: t.profileErrors.noPermission };
    throw error;
  }

  const parsed = createProfileSchema(t.profileErrors).safeParse(readForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t.profileErrors.generic };
  }

  await updateProfile(tenantId, userId, parsed.data);
  revalidatePath("/portal", "layout");
  return { saved: true };
}
