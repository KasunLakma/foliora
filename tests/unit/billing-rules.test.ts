import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIMITS,
  addMonths,
  addPeriod,
  makeCode,
  pickActive,
  priceFor,
  readLimits,
} from "../../src/modules/billing/rules";

const day = (iso: string) => new Date(`${iso}T10:30:00Z`);

describe("adding months", () => {
  it("keeps the day and the time", () => {
    expect(addMonths(day("2026-12-15"), 1).toISOString()).toBe("2027-01-15T10:30:00.000Z");
    expect(addPeriod(day("2026-03-10"), "YEARLY").toISOString()).toBe("2027-03-10T10:30:00.000Z");
  });

  it("never spills into the next month", () => {
    expect(addMonths(day("2027-01-31"), 1).toISOString()).toBe("2027-02-28T10:30:00.000Z");
    expect(addMonths(day("2028-01-31"), 1).toISOString()).toBe("2028-02-29T10:30:00.000Z");
    expect(addPeriod(day("2028-02-29"), "YEARLY").toISOString()).toBe("2029-02-28T10:30:00.000Z");
    expect(addMonths(day("2026-08-31"), 1).toISOString()).toBe("2026-09-30T10:30:00.000Z");
  });

  it("does not change the date it was given", () => {
    const original = day("2026-05-05");
    addPeriod(original, "MONTHLY");
    expect(original.toISOString()).toBe("2026-05-05T10:30:00.000Z");
  });
});

describe("prices", () => {
  it("picks the monthly or the yearly price", () => {
    const plan = { monthlyPrice: 2500, yearlyPrice: 25000 };
    expect(priceFor(plan, "MONTHLY")).toBe(2500);
    expect(priceFor(plan, "YEARLY")).toBe(25000);
  });
});

describe("payment codes", () => {
  it("look like FOL- and six easy characters", () => {
    for (let i = 0; i < 200; i += 1) {
      expect(makeCode()).toMatch(/^FOL-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$/);
    }
  });

  it("use the random source it is given", () => {
    expect(makeCode(() => 0)).toBe("FOL-AAAAAA");
  });
});

describe("plan limits", () => {
  it("reads the numbers and falls back for anything missing or wrong", () => {
    expect(readLimits({ photos: 200, showreels: 7, applications: null })).toEqual({
      photos: 200,
      showreels: 7,
      applications: null,
    });
    expect(readLimits({ photos: 200, applications: 10 })).toEqual({
      photos: 200,
      showreels: DEFAULT_LIMITS.showreels,
      applications: 10,
    });
    expect(readLimits({ photos: "lots", showreels: null })).toEqual(DEFAULT_LIMITS);
    expect(readLimits(null)).toEqual(DEFAULT_LIMITS);
    expect(readLimits("nonsense")).toEqual(DEFAULT_LIMITS);
  });
});

describe("which paid period counts", () => {
  const sub = (sortOrder: number, endsAt: string) => ({ endsAt: new Date(endsAt), plan: { sortOrder } });

  it("is none when there are none", () => {
    expect(pickActive([])).toBeNull();
  });

  it("prefers the bigger plan, and among equals the one that lasts longest", () => {
    const pro = sub(1, "2027-06-01");
    const agency = sub(2, "2027-02-01");
    const proLonger = sub(1, "2027-09-01");
    expect(pickActive([pro, agency])).toBe(agency);
    expect(pickActive([pro, proLonger])).toBe(proLonger);
  });
});
