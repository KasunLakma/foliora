import { tenantDb } from "../../lib/db/tenant";
import { NotFoundError } from "../../lib/errors";
import { writeAudit } from "../audit/service";
import type { WorkInput } from "./schema";

export async function listWorks(tenantId: string) {
  return tenantDb(tenantId).work.findMany({
    orderBy: [{ isFeatured: "desc" }, { year: "desc" }, { createdAt: "desc" }],
  });
}

export async function countWorks(tenantId: string) {
  return tenantDb(tenantId).work.count();
}

/** Creates a work, or updates it when `input.id` is given. Only works of this tenant can be touched. */
export async function saveWork(tenantId: string, actorUserId: string, input: WorkInput) {
  const db = tenantDb(tenantId);
  const profile = await db.talentProfile.findFirst({ select: { id: true } });
  if (!profile) throw new NotFoundError("Profile not found");

  const data = {
    title: input.title,
    year: input.year,
    type: input.type,
    roleName: input.roleName,
    roleType: input.roleType,
    director: input.director,
    company: input.company,
    description: input.description,
    link: input.link,
    isFeatured: input.isFeatured,
  };

  if (input.id) {
    const result = await db.work.updateMany({ where: { id: input.id }, data });
    if (result.count === 0) throw new NotFoundError("Work not found");
    await writeAudit({ tenantId, actorUserId, action: "work.update", targetType: "Work", targetId: input.id });
    return input.id;
  }

  const created = await db.work.create({ data: { tenantId, profileId: profile.id, ...data } });
  await writeAudit({ tenantId, actorUserId, action: "work.create", targetType: "Work", targetId: created.id });
  return created.id;
}

export async function deleteWork(tenantId: string, actorUserId: string, id: string) {
  const result = await tenantDb(tenantId).work.deleteMany({ where: { id } });
  if (result.count === 0) throw new NotFoundError("Work not found");
  await writeAudit({ tenantId, actorUserId, action: "work.delete", targetType: "Work", targetId: id });
}
