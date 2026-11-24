import { describe, expect, it } from "vitest";
import { dateFromDeadline, deadlineFromDate, monthStartSriLanka } from "../../src/modules/casting/rules";

describe("the start of the month in Sri Lanka", () => {
  it("is the 1st at midnight Sri Lanka time, which is 18:30 the evening before in UTC", () => {
    expect(monthStartSriLanka(new Date("2026-12-15T10:00:00Z")).toISOString()).toBe("2026-11-30T18:30:00.000Z");
  });

  it("changes at midnight in Sri Lanka, not at midnight UTC", () => {
    // 19:00 UTC on 30 November is already 00:30 on 1 December in Sri Lanka
    expect(monthStartSriLanka(new Date("2026-11-30T19:00:00Z")).toISOString()).toBe("2026-11-30T18:30:00.000Z");
    // 18:00 UTC on 30 November is still 23:30 on 30 November in Sri Lanka
    expect(monthStartSriLanka(new Date("2026-11-30T18:00:00Z")).toISOString()).toBe("2026-10-31T18:30:00.000Z");
  });
});

describe("deadlines", () => {
  it("run to the very end of the chosen day in Sri Lanka", () => {
    expect(deadlineFromDate("2026-12-31")?.toISOString()).toBe("2026-12-31T18:29:59.000Z");
  });

  it("turn back into the same date", () => {
    expect(dateFromDeadline(deadlineFromDate("2026-12-31")!)).toBe("2026-12-31");
    expect(dateFromDeadline(deadlineFromDate("2027-03-01")!)).toBe("2027-03-01");
  });

  it("refuse anything that is not a real date", () => {
    for (const bad of ["", "tomorrow", "2026-13-01", "2026-02-31", "2026-4-5", "31-12-2026", "2026-12-32"]) {
      expect(deadlineFromDate(bad), bad).toBeNull();
    }
    expect(deadlineFromDate("2028-02-29")).not.toBeNull(); // a leap day is real
  });
});
