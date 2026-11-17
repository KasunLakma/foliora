import { prisma } from "../../lib/db/prisma";
import { tenantDb } from "../../lib/db/tenant";
import { LimitError, NotFoundError, ValidationError } from "../../lib/errors";
import { writeAudit } from "../audit/service";
import type { InquiryInput } from "./schema";
import { looksLikeSpam } from "./spam";

export const LIMIT_PER_IP_PER_HOUR = 8;
export const LIMIT_PER_IP_PER_TENANT_PER_DAY = 15;

export const INBOX_FILTERS = ["inbox", "new", "replied", "archived", "spam"] as const;
export type InboxFilter = (typeof INBOX_FILTERS)[number];

export const STATUSES = ["NEW", "READ", "REPLIED", "ARCHIVED", "SPAM"] as const;
export type InquiryStatusName = (typeof STATUSES)[number];

const INBOX_STATUSES: InquiryStatusName[] = ["NEW", "READ", "REPLIED"];

function filterWhere(filter: InboxFilter) {
  switch (filter) {
    case "new":
      return { status: "NEW" as const };
    case "replied":
      return { status: "REPLIED" as const };
    case "archived":
      return { status: "ARCHIVED" as const };
    case "spam":
      return { status: "SPAM" as const };
    default:
      return { status: { in: INBOX_STATUSES } };
  }
}

/**
 * Called for a message sent from a PUBLIC page. The visitor has no account, so the tenant is found
 * from the page's address, never from anything the visitor sends.
 */
export async function createInquiry(params: {
  slug: string;
  input: InquiryInput;
  ipHash: string;
  locale: string;
}) {
  const slug = params.slug.trim().toLowerCase();
  const portfolio = slug ? await prisma.portfolio.findUnique({ where: { slug } }) : null;
  if (!portfolio || portfolio.status !== "PUBLISHED") throw new NotFoundError("Page not found");

  const tenant = await prisma.tenant.findUnique({
    where: { id: portfolio.tenantId },
    select: { status: true, deletedAt: true },
  });
  if (tenant?.status !== "ACTIVE" || tenant.deletedAt) throw new NotFoundError("Page not found");

  // Flood protection. These counts look at ALL tenants on purpose: they are about the sender, not the talent.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [lastHour, lastDayHere] = await Promise.all([
    prisma.inquiry.count({ where: { ipHash: params.ipHash, createdAt: { gte: hourAgo } } }),
    prisma.inquiry.count({
      where: { ipHash: params.ipHash, tenantId: portfolio.tenantId, createdAt: { gte: dayAgo } },
    }),
  ]);
  if (lastHour >= LIMIT_PER_IP_PER_HOUR || lastDayHere >= LIMIT_PER_IP_PER_TENANT_PER_DAY) {
    throw new LimitError("Too many messages");
  }

  const spam = looksLikeSpam(params.input.message);
  const created = await tenantDb(portfolio.tenantId).inquiry.create({
    data: {
      tenantId: portfolio.tenantId,
      profileId: portfolio.profileId,
      type: params.input.type,
      status: spam ? "SPAM" : "NEW",
      senderName: params.input.senderName,
      senderEmail: params.input.senderEmail,
      senderPhone: params.input.senderPhone,
      company: params.input.company,
      projectName: params.input.projectName,
      message: params.input.message,
      locale: params.locale,
      ipHash: params.ipHash,
    },
  });
  return { id: created.id, tenantId: portfolio.tenantId, spam };
}

export async function listInquiries(tenantId: string, filter: InboxFilter = "inbox") {
  return tenantDb(tenantId).inquiry.findMany({
    where: filterWhere(filter),
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function countNewInquiries(tenantId: string) {
  return tenantDb(tenantId).inquiry.count({ where: { status: "NEW" } });
}

export async function countInbox(tenantId: string) {
  return tenantDb(tenantId).inquiry.count({ where: { status: { in: INBOX_STATUSES } } });
}

export async function getInquiry(tenantId: string, id: string) {
  return tenantDb(tenantId).inquiry.findFirst({
    where: { id },
    include: { notes: { orderBy: { createdAt: "asc" } } },
  });
}

/** Opening a new message marks it as read. */
export async function markRead(tenantId: string, id: string) {
  await tenantDb(tenantId).inquiry.updateMany({
    where: { id, status: "NEW" },
    data: { status: "READ", readAt: new Date() },
  });
}

export async function setInquiryStatus(
  tenantId: string,
  actorUserId: string,
  id: string,
  status: InquiryStatusName,
) {
  if (!(STATUSES as readonly string[]).includes(status)) throw new ValidationError("status");

  const result = await tenantDb(tenantId).inquiry.updateMany({ where: { id }, data: { status } });
  if (result.count === 0) throw new NotFoundError("Inquiry not found");
  await writeAudit({
    tenantId,
    actorUserId,
    action: "inquiry.status",
    targetType: "Inquiry",
    targetId: id,
    after: { status },
  });
}

export async function addInquiryNote(tenantId: string, actorUserId: string, id: string, body: string) {
  const text = body.trim();
  if (text.length < 1 || text.length > 2000) throw new ValidationError("note");

  const db = tenantDb(tenantId);
  const inquiry = await db.inquiry.findFirst({ where: { id }, select: { id: true } });
  if (!inquiry) throw new NotFoundError("Inquiry not found");

  await db.inquiryNote.create({
    data: { tenantId, inquiryId: id, authorUserId: actorUserId, body: text },
  });
  await writeAudit({ tenantId, actorUserId, action: "inquiry.note", targetType: "Inquiry", targetId: id });
}
