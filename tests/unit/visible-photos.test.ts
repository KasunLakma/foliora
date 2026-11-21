import { describe, expect, it } from "vitest";
import { visiblePhotos } from "../../src/modules/billing/rules";

const photos = (count: number, coverIndex = -1) =>
  Array.from({ length: count }, (_, i) => ({ id: i, isCover: i === coverIndex }));

describe("which photos a visitor may see", () => {
  it("shows everything when the plan allows it", () => {
    expect(visiblePhotos(photos(5), 15)).toHaveLength(5);
    expect(visiblePhotos(photos(15), 15)).toHaveLength(15);
  });

  it("shows only the first ones when there are more than the plan allows", () => {
    const shown = visiblePhotos(photos(20, 0), 15);
    expect(shown).toHaveLength(15);
    expect(shown.map((p) => p.id)).toEqual([...Array(15).keys()]);
  });

  it("always keeps the main photo, even when it is far down the list", () => {
    const shown = visiblePhotos(photos(20, 18), 15);
    expect(shown).toHaveLength(15);
    expect(shown.some((p) => p.id === 18)).toBe(true);
    expect(shown.slice(0, 14).map((p) => p.id)).toEqual([...Array(14).keys()]);
  });

  it("shows nothing when the plan allows nothing, and does not change the list it was given", () => {
    expect(visiblePhotos(photos(3), 0)).toEqual([]);
    const original = photos(20, 18);
    visiblePhotos(original, 15);
    expect(original).toHaveLength(20);
  });
});
