import { describe, expect, it } from "vitest";
import { buildImageUrl, signParams } from "../../src/lib/cloudinary";
import { isOwnPublicId, photoFolder } from "../../src/modules/photos/paths";

describe("Cloudinary signature", () => {
  it("matches the example in Cloudinary's own documentation", () => {
    const signature = signParams(
      {
        timestamp: 1315060510,
        public_id: "sample_image",
        eager: "w_400,h_300,c_pad|w_260,h_200,c_crop",
      },
      "abcd",
    );
    expect(signature).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });

  it("does not care about the order of the parameters and ignores empty ones", () => {
    const a = signParams({ folder: "x", timestamp: 1, allowed_formats: "jpg" }, "s");
    const b = signParams({ allowed_formats: "jpg", timestamp: 1, folder: "x", caption: "", skipped: undefined }, "s");
    expect(a).toBe(b);
  });

  it("changes when the secret changes", () => {
    expect(signParams({ timestamp: 1 }, "one")).not.toBe(signParams({ timestamp: 1 }, "two"));
  });
});

describe("image addresses", () => {
  it("asks for automatic format and quality", () => {
    expect(buildImageUrl("demo", "foliora/t1/photos/abc", { width: 600 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_600/foliora/t1/photos/abc",
    );
  });

  it("can crop to a size", () => {
    expect(buildImageUrl("demo", "id", { width: 600, height: 750, fit: "fill" })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,g_auto,w_600,h_750/id",
    );
  });
});

describe("tenant folders", () => {
  it("gives every tenant its own folder", () => {
    expect(photoFolder("abc")).toBe("foliora/abc/photos");
  });

  it("accepts only images inside the tenant's own folder", () => {
    expect(isOwnPublicId("abc", "foliora/abc/photos/xyz123")).toBe(true);
    expect(isOwnPublicId("abc", "foliora/other/photos/xyz123")).toBe(false);
    expect(isOwnPublicId("abc", "foliora/abc/photos/../../other/photos/x")).toBe(false);
    expect(isOwnPublicId("abc", "foliora/abc/photos")).toBe(false);
    expect(isOwnPublicId("abc", "somewhere/else")).toBe(false);
    expect(isOwnPublicId("abc", "foliora/abc/photos/has space")).toBe(false);
    expect(isOwnPublicId("abc", "foliora/abcd/photos/x")).toBe(false);
  });
});
