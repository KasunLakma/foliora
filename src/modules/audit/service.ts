import { prisma } from "../../lib/db/prisma";

type AuditEntry = {
  tenantId?: string | null; // null = platform-level action
  actorUserId?: string | null;
  action: string; // for example "portfolio.publish"
  targetType?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
};

const toJson = (value: unknown) =>
  value === undefined ? undefined : JSON.parse(JSON.stringify(value));

export async function writeAudit(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId: entry.tenantId ?? null,
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      before: toJson(entry.before),
      after: toJson(entry.after),
      ip: entry.ip,
      userAgent: entry.userAgent,
    },
  });
}
