import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/db/prisma";
import { ConflictError, ForbiddenError, LimitError, NotFoundError, ValidationError } from "../../src/lib/errors";
import { registerUser } from "../../src/modules/auth/service";
import {
  createCall,
  getCallAdmin,
  listCallsAdmin,
  setApplicationStatus,
  setCallStatus,
  updateCall,
} from "../../src/modules/casting/admin";
import { dateFromDeadline } from "../../src/modules/casting/rules";
import type { CallInput } from "../../src/modules/casting/schema";
import {
  applicationsThisMonth,
  applyToCall,
  checkEligibility,
  getCallForTalent,
  listMyApplications,
  listOpenCalls,
  withdrawApplication,
} from "../../src/modules/casting/service";
import { saveSiteSettings, setPublished } from "../../src/modules/portfolio/service";

const stamp = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const password = "a-long-password-123";
const slugA = `cast-a-${stamp}`;
const day = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);

let a: { userId: string; tenantId: string }; // a published talent
let b: { userId: string; tenantId: string }; // a talent who has not published
let c: { userId: string; tenantId: string }; // an agency
let admin: { id: string };
let support: { id: string };
const callIds: string[] = [];

const callInput = (overrides: Partial<CallInput> = {}): CallInput => ({
  title: "Lead role in a new drama",
  company: "Studio X",
  role: null,
  description: "A lead role in a new drama series, shooting in Colombo.",
  gender: "ANY",
  ageMin: null,
  ageMax: null,
  location: "Colombo",
  compensation: null,
  deadline: day(10),
  ...overrides,
});

const openCall = async (overrides: Partial<CallInput> = {}) => {
  const id = await createCall(admin.id, callInput(overrides));
  callIds.push(id);
  await setCallStatus(admin.id, id, "OPEN");
  return id;
};

const makeUser = (label: string, extra: Record<string, unknown>) =>
  prisma.user.create({
    data: { email: `cast-${label}-${stamp}@example.test`, name: `Casting ${label}`, ...extra },
    select: { id: true },
  });

beforeAll(async () => {
  // The plans are shared data. Create them if they are missing, and add the casting allowance if an older row lacks it.
  const plans = [
    { key: "free", name: "Free", monthlyPrice: 0, yearlyPrice: 0, sortOrder: 0, limits: { photos: 15, showreels: 5, applications: 3 } },
    { key: "pro", name: "Pro", monthlyPrice: 2500, yearlyPrice: 25000, sortOrder: 1, limits: { photos: 200, showreels: 5, applications: null } },
    { key: "agency", name: "Agency", monthlyPrice: 12500, yearlyPrice: 125000, sortOrder: 2, limits: { photos: 2000, showreels: 5, applications: null } },
  ];
  for (const plan of plans) {
    const row = await prisma.plan.upsert({ where: { key: plan.key }, update: {}, create: plan });
    const limits = (row.limits ?? {}) as Record<string, unknown>;
    if (!("applications" in limits)) {
      await prisma.plan.update({
        where: { key: plan.key },
        data: { limits: { ...limits, applications: plan.limits.applications } },
      });
    }
  }

  const make = (label: string, accountType: "INDIVIDUAL" | "AGENCY") =>
    registerUser({
      name: `Casting ${label}`,
      email: `cast-${label}-owner-${stamp}@example.test`,
      password,
      accountType,
      tenantName: `Casting Tenant ${label} ${stamp}`,
    });
  a = await make("a", "INDIVIDUAL");
  b = await make("b", "INDIVIDUAL");
  c = await make("c", "AGENCY");
  await prisma.tenant.updateMany({ where: { id: { in: [a.tenantId, b.tenantId, c.tenantId] } }, data: { status: "ACTIVE" } });

  await saveSiteSettings(a.tenantId, a.userId, { slug: slugA, templateKey: "cinematic", seoTitle: null, seoDescription: null });
  await setPublished(a.tenantId, a.userId, true);

  admin = await makeUser("admin", { platformRole: "ADMIN" });
  support = await makeUser("support", { platformRole: "SUPPORT" });
});

afterAll(async () => {
  const tenantIds = [a.tenantId, b.tenantId, c.tenantId];
  const staffIds = [admin.id, support.id];
  const applications = await prisma.castingApplication.findMany({ where: { callId: { in: callIds } }, select: { id: true } });

  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { actorUserId: { in: staffIds } },
        { tenantId: { in: tenantIds } },
        { targetId: { in: [...callIds, ...applications.map((x) => x.id)] } },
      ],
    },
  });
  await prisma.castingCall.deleteMany({ where: { id: { in: callIds } } }); // the applications go with them
  await prisma.subscription.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [...staffIds, a.userId, b.userId, c.userId] } } });
  await prisma.$disconnect();
});

describe("writing calls (staff)", () => {
  let call1: string;

  it("only an admin can write one, and it starts as a draft nobody can see", async () => {
    await expect(createCall(support.id, callInput())).rejects.toBeInstanceOf(ForbiddenError);

    call1 = await createCall(admin.id, callInput({ title: "First call" }));
    callIds.push(call1);
    expect((await listOpenCalls(a.tenantId)).map((x) => x.id)).not.toContain(call1);
    expect(await getCallForTalent(a.tenantId, call1)).toBeNull();
  });

  it("opening makes it visible, and it cannot be opened twice", async () => {
    await setCallStatus(admin.id, call1, "OPEN");
    expect((await listOpenCalls(a.tenantId)).map((x) => x.id)).toContain(call1);
    await expect(setCallStatus(admin.id, call1, "OPEN")).rejects.toBeInstanceOf(ValidationError);
    await expect(setCallStatus(support.id, call1, "CLOSED")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("will not open a call whose deadline has passed", async () => {
    const old = await createCall(admin.id, callInput({ title: "Old call", deadline: day(-2) }));
    callIds.push(old);
    await expect(setCallStatus(admin.id, old, "OPEN")).rejects.toBeInstanceOf(ValidationError);
  });

  it("can be changed", async () => {
    await updateCall(admin.id, call1, callInput({ title: "First call, changed", deadline: day(12) }));
    const detail = await getCallAdmin(admin.id, call1);
    expect(detail?.call.title).toBe("First call, changed");
    expect(dateFromDeadline(detail!.call.deadline)).toBe(day(12));
    await expect(updateCall(admin.id, "no-such-call", callInput())).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("who may apply", () => {
  it("only a published individual talent with an approved account", async () => {
    expect(await checkEligibility(a.tenantId)).toBe("ok");
    expect(await checkEligibility(b.tenantId)).toBe("unpublished");
    expect(await checkEligibility(c.tenantId)).toBe("agency");

    const id = callIds[0];
    await expect(applyToCall(b.tenantId, b.userId, id, null)).rejects.toThrow("unpublished");
    await expect(applyToCall(c.tenantId, c.userId, id, null)).rejects.toThrow("agency");

    await prisma.tenant.update({ where: { id: b.tenantId }, data: { status: "PENDING" } });
    expect(await checkEligibility(b.tenantId)).toBe("not_active");
    await prisma.tenant.update({ where: { id: b.tenantId }, data: { status: "ACTIVE" } });
  });
});

describe("applying", () => {
  let call2: string;
  let call3: string;
  let call4: string;
  let firstApplication: string;
  let secondApplication: string;

  it("sends an application once, and not twice", async () => {
    firstApplication = await applyToCall(a.tenantId, a.userId, callIds[0], "  I would love this role  ");
    await expect(applyToCall(a.tenantId, a.userId, callIds[0], null)).rejects.toBeInstanceOf(ConflictError);

    const mine = await getCallForTalent(a.tenantId, callIds[0]);
    expect(mine?.mine?.message).toBe("I would love this role");
    expect(mine?.isOpen).toBe(true);
    expect((await listOpenCalls(a.tenantId)).find((x) => x.id === callIds[0])?.myStatus).toBe("SUBMITTED");
  });

  it("is refused once the deadline has passed or when the call is a draft", async () => {
    const afterDeadline = new Date(Date.now() + 30 * DAY);
    await expect(applyToCall(a.tenantId, a.userId, callIds[0], null, afterDeadline)).rejects.toThrow("closed");

    const draft = await createCall(admin.id, callInput({ title: "A draft" }));
    callIds.push(draft);
    await expect(applyToCall(a.tenantId, a.userId, draft, null)).rejects.toThrow("closed");
  });

  it("the Free plan allows a few a month, and a paid plan allows any number", async () => {
    call2 = await openCall({ title: "Call 2" });
    call3 = await openCall({ title: "Call 3" });
    call4 = await openCall({ title: "Call 4" });

    secondApplication = await applyToCall(a.tenantId, a.userId, call2, null);
    await applyToCall(a.tenantId, a.userId, call3, null);
    expect(await applicationsThisMonth(a.tenantId)).toBe(3);
    await expect(applyToCall(a.tenantId, a.userId, call4, null)).rejects.toBeInstanceOf(LimitError);

    const pro = await prisma.plan.findUniqueOrThrow({ where: { key: "pro" } });
    await prisma.subscription.create({
      data: {
        tenantId: a.tenantId,
        planId: pro.id,
        period: "MONTHLY",
        startsAt: new Date(Date.now() - 3600 * 1000),
        endsAt: new Date(Date.now() + 30 * DAY),
      },
    });
    await expect(applyToCall(a.tenantId, a.userId, call4, null)).resolves.toBeTruthy();
  });

  it("withdrawing is allowed once, still counts for the month, and is private to the talent", async () => {
    await expect(withdrawApplication(b.tenantId, b.userId, secondApplication)).rejects.toBeInstanceOf(NotFoundError);

    await withdrawApplication(a.tenantId, a.userId, firstApplication);
    await expect(withdrawApplication(a.tenantId, a.userId, firstApplication)).rejects.toBeInstanceOf(NotFoundError);
    expect(await applicationsThisMonth(a.tenantId)).toBe(4);

    const mine = await listMyApplications(a.tenantId);
    expect(mine.find((x) => x.id === firstApplication)).toMatchObject({ status: "WITHDRAWN" });
    expect(await listMyApplications(b.tenantId)).toHaveLength(0);
  });

  it("a closed call stays visible only to those who applied", async () => {
    await setCallStatus(admin.id, callIds[0], "CLOSED");
    expect(await getCallForTalent(b.tenantId, callIds[0])).toBeNull();
    const seen = await getCallForTalent(a.tenantId, callIds[0]);
    expect(seen?.isOpen).toBe(false);
    expect((await listOpenCalls(a.tenantId)).map((x) => x.id)).not.toContain(callIds[0]);
  });

  it("staff see the applicants with their portfolio, and can shortlist them", async () => {
    const detail = await getCallAdmin(admin.id, call2);
    expect(detail?.applicants).toHaveLength(1);
    expect(detail?.applicants[0]).toMatchObject({
      stageName: `Casting Tenant a ${stamp}`,
      slug: slugA,
      email: `cast-a-owner-${stamp}@example.test`,
    });

    await setApplicationStatus(admin.id, secondApplication, "SHORTLISTED");
    expect((await getCallAdmin(admin.id, call2))?.applicants[0].status).toBe("SHORTLISTED");

    await expect(setApplicationStatus(admin.id, firstApplication, "SHORTLISTED")).rejects.toBeInstanceOf(ValidationError); // withdrawn
    await expect(setApplicationStatus(support.id, secondApplication, "NOT_SELECTED")).rejects.toBeInstanceOf(ForbiddenError);

    const list = await listCallsAdmin(support.id);
    expect(list.find((x) => x.id === call2)?._count.applications).toBe(1);
  });
});
