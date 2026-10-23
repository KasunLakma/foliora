"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ForbiddenError, LimitError, NotFoundError, ValidationError } from "@/lib/errors";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePermission } from "@/modules/roles/permissions";
import { MAX_SHOWREELS, addShowreel, removeShowreel, setPrimaryShowreel } from "./service";

export type ShowreelFormState = { error?: string; saved?: boolean } | undefined;

export async function addShowreelAction(
  _prev: ShowreelFormState,
  fd: FormData,
): Promise<ShowreelFormState> {
  const { t } = await getDictionary();
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.activeTenantId; // from the session, never from the form
  if (!userId || !tenantId) return { error: t.portfolioErrors.signInAgain };

  try {
    await requirePermission(userId, tenantId, "media.upload");
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: t.portfolioErrors.noPermission };
    throw error;
  }

  const title = (fd.get("title") ?? "").toString().trim();
  const url = (fd.get("url") ?? "").toString().trim();
  if (title.length < 2) return { error: t.portfolioErrors.title };
  if (title.length > 120) return { error: format(t.portfolioErrors.max, { max: 120 }) };

  try {
    await addShowreel(tenantId, userId, { title, url });
  } catch (error) {
    if (error instanceof ValidationError) return { error: t.portfolioErrors.invalidVideo };
    if (error instanceof LimitError) return { error: format(t.portfolioErrors.tooMany, { max: MAX_SHOWREELS }) };
    if (error instanceof NotFoundError) return { error: t.portfolioErrors.notFound };
    throw error;
  }

  revalidatePath("/portal", "layout");
  return { saved: true };
}

async function runOnVideo(fd: FormData, work: (tenantId: string, userId: string, id: string) => Promise<void>) {
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.activeTenantId;
  const id = (fd.get("id") ?? "").toString();
  if (!userId || !tenantId || !id) return;

  try {
    await requirePermission(userId, tenantId, "media.upload");
    await work(tenantId, userId, id);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) return;
    throw error;
  }
  revalidatePath("/portal", "layout");
}

export async function setPrimaryShowreelAction(fd: FormData): Promise<void> {
  await runOnVideo(fd, setPrimaryShowreel);
}

export async function removeShowreelAction(fd: FormData): Promise<void> {
  await runOnVideo(fd, removeShowreel);
}
