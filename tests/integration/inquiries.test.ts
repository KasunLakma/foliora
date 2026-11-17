import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/db/prisma";
import { LimitError, NotFoundError, ValidationError } from "../../src/lib/errors";
import { registerUser } from "../../src/modules/auth/service";
import {
  LIMIT_PER_IP_PER_HOUR,
  addInquiryNote,
  countInbox,
  countNewInquiries,
  createInquiry,
  getInquiry,
  listInquiries,
  markRead,
  setInquiryStatus,
} from "../../src/modules/inquiries/service";
import { saveSiteSettings, setPublished } from "../../src/modules/portfolio/service";

const stamp = Date.now();
const password = "a-long-password-123";
const slugA = `inq-a-${stamp}`;
const slugB = `inq-b-${stamp}`;

let a: { userId: string; tenantId: string };
let b: { userId: string; tenantId: string };

const input = (overrides = {}) => ({
  type: "CASTING" as const,
  senderName: "Director D",
  senderEmail: "d@example.test",
  senderPhone: null,
  company: null,
  projectName: null,
  message: "We would like to invite you to an audition next week.",
  ...overrides,
});

const send = (slug: string, ipHash: string, overrides = {}) =>
  createInquiry({ slug, input: input(overrides), ipHash, locale: "en" });

beforeAll(async () => {
  a = await registerUser({
    name: "Inbox A",
    email: `inbox-a-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Inbox Tenant A ${stamp}`,
  });
  b = await registerUser({
    name: "Inbox B",
    email: `inbox-b-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Inbox Tenant B ${stamp}`,
  });
  await prisma.tenant.updateMany({ where: { id: { in: [a.tenantId, b.tenantId] } }, data: { status: "ACTIVE" } });

  const settings = (slug: string) => ({ slug, templateKey: "cinematic", seoTitle: null, seoDescription: null });
  await saveSiteSettings(a.tenantId, a.userId, settings(slugA));
  await saveSiteSettings(b.tenantId, b.userId, settings(slugB));
  await setPublished(a.tenantId, a.userId, true); // B stays a draft
});

afterAll(async () => {
  const tenantIds = [a.tenantId, b.tenantId];
  await prisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [a.userId, b.userId] } } });
  await prisma.$disconnect();
});

describe("receiving messages", () => {
  const ip = `ip-main-${stamp}`;
  let firstId: string;

  it("stores a message from a published page as NEW", async () => {
    const created = await send(slugA, ip);
    firstId = created.id;
    expect(created.spam).toBe(false);

    const inquiry = await getInquiry(a.tenantId, firstId);
    expect(inquiry?.status).toBe("NEW");
    expect(inquiry?.senderName).toBe("Director D");
    expect(inquiry?.ipHash).toBe(ip);
    expect(await countNewInquiries(a.tenantId)).toBe(1);
  });

  it("refuses a page that is a draft or does not exist", async () => {
    await expect(send(slugB, ip)).rejects.toBeInstanceOf(NotFoundError);
    await expect(send("no-such-page", ip)).rejects.toBeInstanceOf(NotFoundError);
    await expect(send("", ip)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("files a message full of links under Spam", async () => {
    const spam = await send(slugA, ip, { message: "buy now https://a.com https://b.com https://c.com" });
    expect(spam.spam).toBe(true);

    const inbox = await listInquiries(a.tenantId, "inbox");
    const spamList = await listInquiries(a.tenantId, "spam");
    expect(inbox.some((x) => x.id === spam.id)).toBe(false);
    expect(spamList.some((x) => x.id === spam.id)).toBe(true);
    expect(await countNewInquiries(a.tenantId)).toBe(1); // spam is not counted as new
  });

  it("opening a message marks it as read", async () => {
    await markRead(a.tenantId, firstId);
    expect((await getInquiry(a.tenantId, firstId))?.status).toBe("READ");
    expect(await countNewInquiries(a.tenantId)).toBe(0);
    expect(await countInbox(a.tenantId)).toBe(1);
  });

  it("changes status, filters by it and keeps notes", async () => {
    await setInquiryStatus(a.tenantId, a.userId, firstId, "REPLIED");
    expect((await listInquiries(a.tenantId, "replied")).map((x) => x.id)).toEqual([firstId]);

    await setInquiryStatus(a.tenantId, a.userId, firstId, "ARCHIVED");
    expect((await listInquiries(a.tenantId, "inbox")).some((x) => x.id === firstId)).toBe(false);
    expect((await listInquiries(a.tenantId, "archived")).map((x) => x.id)).toEqual([firstId]);

    await addInquiryNote(a.tenantId, a.userId, firstId, "  Call back on Monday  ");
    const inquiry = await getInquiry(a.tenantId, firstId);
    expect(inquiry?.notes.map((n) => n.body)).toEqual(["Call back on Monday"]);
    await expect(addInquiryNote(a.tenantId, a.userId, firstId, "   ")).rejects.toBeInstanceOf(ValidationError);
  });

  it("another account cannot see or change it", async () => {
    expect(await listInquiries(b.tenantId, "inbox")).toHaveLength(0);
    expect(await getInquiry(b.tenantId, firstId)).toBeNull();
    await expect(setInquiryStatus(b.tenantId, b.userId, firstId, "SPAM")).rejects.toBeInstanceOf(NotFoundError);
    await expect(addInquiryNote(b.tenantId, b.userId, firstId, "mine")).rejects.toBeInstanceOf(NotFoundError);
    expect((await getInquiry(a.tenantId, firstId))?.status).toBe("ARCHIVED");
  });
});

describe("flood protection", () => {
  it("stops one sender after the hourly limit", async () => {
    const ip = `ip-flood-${stamp}`;
    for (let i = 0; i < LIMIT_PER_IP_PER_HOUR; i += 1) {
      await send(slugA, ip, { message: `Message number ${i} about an audition.` });
    }
    await expect(send(slugA, ip)).rejects.toBeInstanceOf(LimitError);

    // a different sender is not affected
    await expect(send(slugA, `ip-other-${stamp}`)).resolves.toBeTruthy();
  });
});
