import { tenantDb } from "../../lib/db/tenant";
import { LimitError, NotFoundError, ValidationError } from "../../lib/errors";
import { writeAudit } from "../audit/service";
import { ALLOWED_FORMATS, MAX_PHOTOS, MAX_PHOTO_BYTES, isOwnPublicId } from "./paths";

const ORDER = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];

export async function listPhotos(tenantId: string) {
  return tenantDb(tenantId).photo.findMany({ orderBy: ORDER });
}

export async function countPhotos(tenantId: string) {
  return tenantDb(tenantId).photo.count();
}

export type NewPhoto = { publicId: string; width: number; height: number; bytes: number; format: string };

/** Saves the details of an image the browser has just uploaded to Cloudinary. */
export async function registerPhoto(tenantId: string, actorUserId: string, input: NewPhoto) {
  const format = input.format.toLowerCase();
  if (
    !isOwnPublicId(tenantId, input.publicId) ||
    !(ALLOWED_FORMATS as readonly string[]).includes(format) ||
    !Number.isInteger(input.width) ||
    !Number.isInteger(input.height) ||
    input.width < 1 ||
    input.height < 1 ||
    input.width > 20000 ||
    input.height > 20000 ||
    input.bytes < 1 ||
    input.bytes > MAX_PHOTO_BYTES
  ) {
    throw new ValidationError("Invalid photo");
  }

  const db = tenantDb(tenantId);
  const profile = await db.talentProfile.findFirst({ select: { id: true } });
  if (!profile) throw new NotFoundError("Profile not found");

  const stats = await db.photo.aggregate({ _count: true, _max: { sortOrder: true } });
  if (stats._count >= MAX_PHOTOS) throw new LimitError("Too many photos");

  try {
    const created = await db.photo.create({
      data: {
        tenantId,
        profileId: profile.id,
        publicId: input.publicId,
        width: input.width,
        height: input.height,
        bytes: input.bytes,
        format,
        sortOrder: (stats._max.sortOrder ?? -1) + 1,
        isCover: stats._count === 0, // the first photo becomes the main photo
      },
    });
    await writeAudit({ tenantId, actorUserId, action: "photo.add", targetType: "Photo", targetId: created.id });
    return created.id;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new ValidationError("Photo already added");
    throw error;
  }
}

export async function setCoverPhoto(tenantId: string, actorUserId: string, id: string) {
  const db = tenantDb(tenantId);
  const target = await db.photo.findFirst({ where: { id }, select: { id: true } });
  if (!target) throw new NotFoundError("Photo not found");

  await db.photo.updateMany({ where: { isCover: true }, data: { isCover: false } });
  await db.photo.updateMany({ where: { id }, data: { isCover: true } });
  await writeAudit({ tenantId, actorUserId, action: "photo.cover", targetType: "Photo", targetId: id });
}

export async function movePhoto(
  tenantId: string,
  actorUserId: string,
  id: string,
  direction: "earlier" | "later",
) {
  const db = tenantDb(tenantId);
  const list = await db.photo.findMany({ orderBy: ORDER, select: { id: true, sortOrder: true } });
  const from = list.findIndex((p) => p.id === id);
  if (from < 0) throw new NotFoundError("Photo not found");

  const to = direction === "earlier" ? from - 1 : from + 1;
  if (to < 0 || to >= list.length) return; // already at the edge

  const a = list[from];
  const b = list[to];
  if (a.sortOrder !== b.sortOrder) {
    await db.photo.updateMany({ where: { id: a.id }, data: { sortOrder: b.sortOrder } });
    await db.photo.updateMany({ where: { id: b.id }, data: { sortOrder: a.sortOrder } });
  } else {
    // Equal numbers cannot be swapped, so number everything again in the new order.
    const reordered = [...list];
    reordered[from] = b;
    reordered[to] = a;
    for (const [index, photo] of reordered.entries()) {
      await db.photo.updateMany({ where: { id: photo.id }, data: { sortOrder: index } });
    }
  }
  await writeAudit({ tenantId, actorUserId, action: "photo.move", targetType: "Photo", targetId: id });
}

export async function updateCaption(tenantId: string, actorUserId: string, id: string, caption: string) {
  const text = caption.trim().slice(0, 140);
  const result = await tenantDb(tenantId).photo.updateMany({
    where: { id },
    data: { caption: text === "" ? null : text },
  });
  if (result.count === 0) throw new NotFoundError("Photo not found");
  await writeAudit({ tenantId, actorUserId, action: "photo.caption", targetType: "Photo", targetId: id });
}

/** Removes the record and returns the Cloudinary id so the caller can delete the image file too. */
export async function deletePhoto(tenantId: string, actorUserId: string, id: string) {
  const db = tenantDb(tenantId);
  const target = await db.photo.findFirst({ where: { id }, select: { id: true, publicId: true, isCover: true } });
  if (!target) throw new NotFoundError("Photo not found");

  await db.photo.deleteMany({ where: { id } });

  if (target.isCover) {
    const next = await db.photo.findFirst({ orderBy: ORDER, select: { id: true } });
    if (next) await db.photo.updateMany({ where: { id: next.id }, data: { isCover: true } });
  }
  await writeAudit({ tenantId, actorUserId, action: "photo.delete", targetType: "Photo", targetId: id });
  return target.publicId;
}
