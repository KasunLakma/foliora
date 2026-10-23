import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/db/prisma";
import { LimitError, NotFoundError, ValidationError } from "../../src/lib/errors";
import { registerUser } from "../../src/modules/auth/service";
import { MAX_PHOTOS, photoFolder } from "../../src/modules/photos/paths";
import {
  deletePhoto,
  listPhotos,
  movePhoto,
  registerPhoto,
  setCoverPhoto,
  updateCaption,
} from "../../src/modules/photos/service";

const stamp = Date.now();
const password = "a-long-password-123";

let a: { userId: string; tenantId: string };
let b: { userId: string; tenantId: string };

const photo = (tenantId: string, name: string, overrides = {}) => ({
  publicId: `${photoFolder(tenantId)}/${name}`,
  width: 1200,
  height: 1500,
  bytes: 350_000,
  format: "jpg",
  ...overrides,
});

beforeAll(async () => {
  a = await registerUser({
    name: "Photos A",
    email: `photos-a-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Photos Tenant A ${stamp}`,
  });
  b = await registerUser({
    name: "Photos B",
    email: `photos-b-${stamp}@example.test`,
    password,
    accountType: "INDIVIDUAL",
    tenantName: `Photos Tenant B ${stamp}`,
  });
});

afterAll(async () => {
  const tenantIds = [a.tenantId, b.tenantId];
  await prisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await prisma.user.deleteMany({ where: { id: { in: [a.userId, b.userId] } } });
  await prisma.$disconnect();
});

describe("photos", () => {
  const ids: string[] = [];

  it("makes the first photo the main photo and numbers the rest in order", async () => {
    for (const name of ["one", "two", "three"]) {
      ids.push(await registerPhoto(a.tenantId, a.userId, photo(a.tenantId, name)));
    }
    const list = await listPhotos(a.tenantId);
    expect(list.map((p) => p.id)).toEqual(ids);
    expect(list.map((p) => p.isCover)).toEqual([true, false, false]);
  });

  it("refuses an image from someone else's folder, a wrong format or a duplicate", async () => {
    await expect(
      registerPhoto(a.tenantId, a.userId, photo(b.tenantId, "stolen")),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      registerPhoto(a.tenantId, a.userId, photo(a.tenantId, "doc", { format: "pdf" })),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      registerPhoto(a.tenantId, a.userId, photo(a.tenantId, "huge", { bytes: 50_000_000 })),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      registerPhoto(a.tenantId, a.userId, photo(a.tenantId, "one")),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("moves a photo earlier and later", async () => {
    await movePhoto(a.tenantId, a.userId, ids[2], "earlier");
    expect((await listPhotos(a.tenantId)).map((p) => p.id)).toEqual([ids[0], ids[2], ids[1]]);

    await movePhoto(a.tenantId, a.userId, ids[0], "later");
    expect((await listPhotos(a.tenantId)).map((p) => p.id)).toEqual([ids[2], ids[0], ids[1]]);

    // moving past the edge changes nothing
    await movePhoto(a.tenantId, a.userId, ids[2], "earlier");
    expect((await listPhotos(a.tenantId)).map((p) => p.id)).toEqual([ids[2], ids[0], ids[1]]);
  });

  it("switches the main photo and saves a caption", async () => {
    await setCoverPhoto(a.tenantId, a.userId, ids[1]);
    const list = await listPhotos(a.tenantId);
    expect(list.filter((p) => p.isCover).map((p) => p.id)).toEqual([ids[1]]);

    await updateCaption(a.tenantId, a.userId, ids[1], "  The Protagonist  ");
    expect((await listPhotos(a.tenantId)).find((p) => p.id === ids[1])?.caption).toBe("The Protagonist");
    await updateCaption(a.tenantId, a.userId, ids[1], "   ");
    expect((await listPhotos(a.tenantId)).find((p) => p.id === ids[1])?.caption).toBeNull();
  });

  it("another tenant cannot see or change them", async () => {
    expect(await listPhotos(b.tenantId)).toHaveLength(0);
    await expect(setCoverPhoto(b.tenantId, b.userId, ids[0])).rejects.toBeInstanceOf(NotFoundError);
    await expect(movePhoto(b.tenantId, b.userId, ids[0], "later")).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateCaption(b.tenantId, b.userId, ids[0], "mine now")).rejects.toBeInstanceOf(NotFoundError);
    await expect(deletePhoto(b.tenantId, b.userId, ids[0])).rejects.toBeInstanceOf(NotFoundError);
  });

  it("gives the main photo to another when it is deleted, and returns the Cloudinary id", async () => {
    const publicId = await deletePhoto(a.tenantId, a.userId, ids[1]); // ids[1] is the main photo
    expect(publicId).toBe(`${photoFolder(a.tenantId)}/two`);

    const list = await listPhotos(a.tenantId);
    expect(list).toHaveLength(2);
    expect(list.filter((p) => p.isCover)).toHaveLength(1);
  });

  it("stops at the photo limit", async () => {
    const current = (await listPhotos(a.tenantId)).length;
    for (let i = current; i < MAX_PHOTOS; i += 1) {
      await registerPhoto(a.tenantId, a.userId, photo(a.tenantId, `fill-${i}`));
    }
    await expect(
      registerPhoto(a.tenantId, a.userId, photo(a.tenantId, "one-too-many")),
    ).rejects.toBeInstanceOf(LimitError);
  });
});
