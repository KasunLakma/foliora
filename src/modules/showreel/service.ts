import { tenantDb } from "../../lib/db/tenant";
import { LimitError, NotFoundError, ValidationError } from "../../lib/errors";
import { writeAudit } from "../audit/service";
import { parseVideoUrl } from "./video";

export const MAX_SHOWREELS = 5;

export async function listShowreels(tenantId: string) {
  return tenantDb(tenantId).showreel.findMany({
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

export async function countShowreels(tenantId: string) {
  return tenantDb(tenantId).showreel.count();
}

export async function addShowreel(
  tenantId: string,
  actorUserId: string,
  input: { title: string; url: string },
) {
  const parsed = parseVideoUrl(input.url);
  if (!parsed) throw new ValidationError("Not a YouTube or Vimeo link");

  const db = tenantDb(tenantId);
  const profile = await db.talentProfile.findFirst({ select: { id: true } });
  if (!profile) throw new NotFoundError("Profile not found");

  const count = await db.showreel.count();
  if (count >= MAX_SHOWREELS) throw new LimitError("Too many videos");

  const created = await db.showreel.create({
    data: {
      tenantId,
      profileId: profile.id,
      title: input.title,
      url: input.url,
      provider: parsed.provider,
      videoId: parsed.videoId,
      isPrimary: count === 0, // the first video becomes the main showreel
    },
  });
  await writeAudit({ tenantId, actorUserId, action: "showreel.add", targetType: "Showreel", targetId: created.id });
  return created.id;
}

export async function setPrimaryShowreel(tenantId: string, actorUserId: string, id: string) {
  const db = tenantDb(tenantId);
  const target = await db.showreel.findFirst({ where: { id }, select: { id: true } });
  if (!target) throw new NotFoundError("Video not found");

  await db.showreel.updateMany({ where: { isPrimary: true }, data: { isPrimary: false } });
  await db.showreel.updateMany({ where: { id }, data: { isPrimary: true } });
  await writeAudit({ tenantId, actorUserId, action: "showreel.primary", targetType: "Showreel", targetId: id });
}

export async function removeShowreel(tenantId: string, actorUserId: string, id: string) {
  const db = tenantDb(tenantId);
  const target = await db.showreel.findFirst({ where: { id }, select: { id: true, isPrimary: true } });
  if (!target) throw new NotFoundError("Video not found");

  await db.showreel.deleteMany({ where: { id } });

  if (target.isPrimary) {
    const next = await db.showreel.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
    if (next) await db.showreel.updateMany({ where: { id: next.id }, data: { isPrimary: true } });
  }
  await writeAudit({ tenantId, actorUserId, action: "showreel.remove", targetType: "Showreel", targetId: id });
}
