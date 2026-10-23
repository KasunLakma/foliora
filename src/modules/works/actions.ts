"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getDictionary } from "@/lib/i18n/server";
import { requirePermission } from "@/modules/roles/permissions";
import { createWorkSchema } from "./schema";
import { deleteWork, saveWork } from "./service";

export type WorkFormState = { error?: string; saved?: boolean } | undefined;

function normalizeUrl(value: string) {
  const v = value.trim();
  if (v === "") return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export async function saveWorkAction(_prev: WorkFormState, fd: FormData): Promise<WorkFormState> {
  const { t } = await getDictionary();
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.activeTenantId; // from the session, never from the form
  if (!userId || !tenantId) return { error: t.portfolioErrors.signInAgain };

  try {
    await requirePermission(userId, tenantId, "works.manage");
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: t.portfolioErrors.noPermission };
    throw error;
  }

  const str = (key: string) => (fd.get(key) ?? "").toString();
  const parsed = createWorkSchema(t.portfolioErrors).safeParse({
    id: str("id"),
    title: str("title"),
    year: str("year"),
    type: str("type"),
    roleName: str("roleName"),
    roleType: str("roleType"),
    director: str("director"),
    company: str("company"),
    description: str("description"),
    link: normalizeUrl(str("link")),
    isFeatured: str("isFeatured") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t.portfolioErrors.generic };
  }

  try {
    await saveWork(tenantId, userId, parsed.data);
  } catch (error) {
    if (error instanceof NotFoundError) return { error: t.portfolioErrors.notFound };
    throw error;
  }

  revalidatePath("/portal", "layout");
  return { saved: true };
}

export async function deleteWorkAction(fd: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.activeTenantId;
  const id = (fd.get("id") ?? "").toString();
  if (!userId || !tenantId || !id) return;

  try {
    await requirePermission(userId, tenantId, "works.manage");
    await deleteWork(tenantId, userId, id);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) return;
    throw error;
  }
  revalidatePath("/portal", "layout");
}
