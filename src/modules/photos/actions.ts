"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { createUploadSignature, destroyImage } from "@/lib/cloudinary";
import { ForbiddenError, LimitError, NotFoundError, ValidationError } from "@/lib/errors";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePermission } from "@/modules/roles/permissions";
import { ALLOWED_FORMATS, MAX_PHOTOS, MAX_PHOTO_BYTES, photoFolder } from "./paths";
import {
  countPhotos,
  deletePhoto,
  movePhoto,
  registerPhoto,
  setCoverPhoto,
  updateCaption,
} from "./service";

export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
};

/** The tenant always comes from the session, never from anything the browser sends. */
async function sessionContext() {
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.activeTenantId;
  if (!userId || !tenantId) return null;
  return { userId, tenantId };
}

/** Step 1 of an upload: the browser asks for permission to put ONE image in this tenant's folder. */
export async function getUploadSignatureAction(): Promise<UploadSignature | { error: string }> {
  const { t } = await getDictionary();
  const ctx = await sessionContext();
  if (!ctx) return { error: t.portfolioErrors.signInAgain };

  try {
    await requirePermission(ctx.userId, ctx.tenantId, "media.upload");
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: t.portfolioErrors.noPermission };
    throw error;
  }

  if ((await countPhotos(ctx.tenantId)) >= MAX_PHOTOS) {
    return { error: format(t.photos.limit, { max: MAX_PHOTOS }) };
  }

  const signature = createUploadSignature(photoFolder(ctx.tenantId), ALLOWED_FORMATS.join(","));
  if (!signature) return { error: t.photos.notConfigured };
  return signature;
}

const registerSchema = z.object({
  publicId: z.string().min(1).max(200),
  width: z.number().int().min(1).max(20000),
  height: z.number().int().min(1).max(20000),
  bytes: z.number().int().min(1).max(MAX_PHOTO_BYTES),
  format: z.string().min(2).max(10),
});

/** Step 2 of an upload: the browser tells us the image is on Cloudinary, and we record it. */
export async function registerPhotoAction(input: unknown): Promise<{ error?: string; ok?: boolean }> {
  const { t } = await getDictionary();
  const ctx = await sessionContext();
  if (!ctx) return { error: t.portfolioErrors.signInAgain };

  try {
    await requirePermission(ctx.userId, ctx.tenantId, "media.upload");
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: t.portfolioErrors.noPermission };
    throw error;
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { error: t.portfolioErrors.generic };

  try {
    await registerPhoto(ctx.tenantId, ctx.userId, parsed.data);
  } catch (error) {
    if (error instanceof ValidationError) return { error: t.portfolioErrors.generic };
    if (error instanceof LimitError) return { error: format(t.photos.limit, { max: MAX_PHOTOS }) };
    if (error instanceof NotFoundError) return { error: t.portfolioErrors.notFound };
    throw error;
  }

  revalidatePath("/portal", "layout");
  return { ok: true };
}

async function runOnPhoto(
  fd: FormData,
  work: (tenantId: string, userId: string, id: string, fd: FormData) => Promise<unknown>,
) {
  const ctx = await sessionContext();
  const id = (fd.get("id") ?? "").toString();
  if (!ctx || !id) return;

  try {
    await requirePermission(ctx.userId, ctx.tenantId, "media.upload");
    await work(ctx.tenantId, ctx.userId, id, fd);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof NotFoundError) return;
    throw error;
  }
  revalidatePath("/portal", "layout");
}

export async function setCoverPhotoAction(fd: FormData): Promise<void> {
  await runOnPhoto(fd, (tenantId, userId, id) => setCoverPhoto(tenantId, userId, id));
}

export async function movePhotoAction(fd: FormData): Promise<void> {
  await runOnPhoto(fd, (tenantId, userId, id, form) =>
    movePhoto(tenantId, userId, id, form.get("direction") === "later" ? "later" : "earlier"),
  );
}

export async function saveCaptionAction(fd: FormData): Promise<void> {
  await runOnPhoto(fd, (tenantId, userId, id, form) =>
    updateCaption(tenantId, userId, id, (form.get("caption") ?? "").toString()),
  );
}

export async function deletePhotoAction(fd: FormData): Promise<void> {
  await runOnPhoto(fd, async (tenantId, userId, id) => {
    const publicId = await deletePhoto(tenantId, userId, id);
    // The record is already gone. If Cloudinary cannot be reached the file just stays there unused.
    const removed = await destroyImage(publicId);
    if (!removed) console.warn(`Could not remove ${publicId} from Cloudinary`);
  });
}
