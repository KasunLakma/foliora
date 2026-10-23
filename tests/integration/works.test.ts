import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/db/prisma";
import { LimitError, NotFoundError, ValidationError } from "../../src/lib/errors";
import { registerUser } from "../../src/modules/auth/service";
import {
  MAX_SHOWREELS,
  addShowreel,
  listShowreels,
  removeShowreel,
  setPrimaryShowreel,
} from "../../src/modules/showreel/service";
import type { WorkInput } from "../../src/modules/works/schema";
import { deleteWork, listWorks, saveWork } from "../../src/modules/works/service";

const stamp = Date.now();
const password = "a-long-password-123";

let a: { userId: string; tenantId: string };
let b: { userId: string; tenantId: string };

function work(overrides: Partial<WorkInput> = {}): WorkInput {
  return {
    id: undefined,
    title: "The Silent Guest",
    year: 2024,
    type: "FILM",
    roleName: null,
    roleType: null,
    director: null,
    company: null,
    description: null,
    link: null,
    isFeatured: false,
    ...overrides,
  };
}

beforeAll(async () => {
  a = await registerUser({
    name: "Works A",
    email: `works-a-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Works Tenant A ${stamp}`,
  });
  b = await registerUser({
    name: "Works B",
    email: `works-b-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Works Tenant B ${stamp}`,
  });
});

afterAll(async () => {
  const tenantIds = [a.tenantId, b.tenantId];
  await prisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [a.userId, b.userId] } } });
  await prisma.$disconnect();
});

describe("works (filmography)", () => {
  let workId: string;

  it("creates works and lists the newest year first", async () => {
    await saveWork(a.tenantId, a.userId, work({ title: "Old Film", year: 2019 }));
    workId = await saveWork(a.tenantId, a.userId, work({ title: "New Film", year: 2025, roleName: "Kaelen" }));

    const list = await listWorks(a.tenantId);
    expect(list.map((w) => w.title)).toEqual(["New Film", "Old Film"]);
    expect(list[0].roleName).toBe("Kaelen");
  });

  it("puts featured works first", async () => {
    const [first] = await listWorks(a.tenantId);
    const oldFilm = (await listWorks(a.tenantId)).find((w) => w.title === "Old Film")!;
    await saveWork(a.tenantId, a.userId, work({ id: oldFilm.id, title: "Old Film", year: 2019, isFeatured: true }));
    expect(first.title).toBe("New Film");

    const list = await listWorks(a.tenantId);
    expect(list[0].title).toBe("Old Film");
    expect(list[0].isFeatured).toBe(true);
  });

  it("updates a work", async () => {
    await saveWork(a.tenantId, a.userId, work({ id: workId, title: "New Film (Director's Cut)", year: 2025 }));
    const list = await listWorks(a.tenantId);
    expect(list.some((w) => w.title === "New Film (Director's Cut)")).toBe(true);
  });

  it("another tenant cannot see, edit or delete it", async () => {
    expect(await listWorks(b.tenantId)).toHaveLength(0);
    await expect(
      saveWork(b.tenantId, b.userId, work({ id: workId, title: "Hijacked" })),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteWork(b.tenantId, b.userId, workId)).rejects.toBeInstanceOf(NotFoundError);

    const untouched = await prisma.work.findUniqueOrThrow({ where: { id: workId } });
    expect(untouched.title).not.toBe("Hijacked");
  });

  it("deletes a work and writes audit entries", async () => {
    await deleteWork(a.tenantId, a.userId, workId);
    expect((await listWorks(a.tenantId)).some((w) => w.id === workId)).toBe(false);

    const actions = (
      await prisma.auditLog.findMany({ where: { tenantId: a.tenantId, action: { startsWith: "work." } } })
    ).map((l) => l.action);
    expect(actions).toContain("work.create");
    expect(actions).toContain("work.update");
    expect(actions).toContain("work.delete");
  });
});

describe("showreel", () => {
  const link = "https://youtu.be/dQw4w9WgXcQ";
  let firstId: string;
  let secondId: string;

  it("makes the first video the main showreel", async () => {
    firstId = await addShowreel(a.tenantId, a.userId, { title: "Reel 2026", url: link });
    secondId = await addShowreel(a.tenantId, a.userId, {
      title: "Scene",
      url: "https://vimeo.com/123456789",
    });

    const list = await listShowreels(a.tenantId);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(firstId);
    expect(list[0].isPrimary).toBe(true);
    expect(list[1].provider).toBe("VIMEO");
    expect(list[1].isPrimary).toBe(false);
  });

  it("rejects links that are not YouTube or Vimeo", async () => {
    await expect(
      addShowreel(a.tenantId, a.userId, { title: "Bad", url: "https://example.com/video" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("switches the main showreel", async () => {
    await setPrimaryShowreel(a.tenantId, a.userId, secondId);
    const list = await listShowreels(a.tenantId);
    expect(list.filter((v) => v.isPrimary)).toHaveLength(1);
    expect(list[0].id).toBe(secondId);
  });

  it("promotes another video when the main one is removed", async () => {
    await removeShowreel(a.tenantId, a.userId, secondId);
    const list = await listShowreels(a.tenantId);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(firstId);
    expect(list[0].isPrimary).toBe(true);
  });

  it("another tenant cannot see or change it", async () => {
    expect(await listShowreels(b.tenantId)).toHaveLength(0);
    await expect(setPrimaryShowreel(b.tenantId, b.userId, firstId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(removeShowreel(b.tenantId, b.userId, firstId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("stops at the video limit", async () => {
    const current = (await listShowreels(a.tenantId)).length;
    for (let i = current; i < MAX_SHOWREELS; i += 1) {
      await addShowreel(a.tenantId, a.userId, { title: `Extra ${i}`, url: link });
    }
    await expect(
      addShowreel(a.tenantId, a.userId, { title: "One too many", url: link }),
    ).rejects.toBeInstanceOf(LimitError);
  });
});
