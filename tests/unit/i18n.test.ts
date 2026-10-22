import { describe, expect, it } from "vitest";
import { en, si } from "../../src/lib/i18n/dictionaries";
import { format } from "../../src/lib/i18n/format";

function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
    (acc, [key, child]) => ({ ...acc, ...flatten(child, prefix ? `${prefix}.${key}` : key) }),
    {},
  );
}

describe("translations", () => {
  const english = flatten(en);
  const sinhala = flatten(si);

  it("Sinhala has exactly the same keys as English", () => {
    expect(Object.keys(sinhala).sort()).toEqual(Object.keys(english).sort());
  });

  it("no translation is empty", () => {
    for (const [key, value] of Object.entries(sinhala)) {
      expect(value.trim().length, `Sinhala text is empty: ${key}`).toBeGreaterThan(0);
    }
  });

  it("keeps the same {placeholders} in both languages", () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join(",");
    for (const key of Object.keys(english)) {
      expect(placeholders(sinhala[key]), `Placeholders differ: ${key}`).toBe(placeholders(english[key]));
    }
  });
});

describe("format", () => {
  it("fills placeholders", () => {
    expect(format("Step {step} of {total}", { step: 2, total: 4 })).toBe("Step 2 of 4");
  });
  it("leaves an unknown placeholder visible", () => {
    expect(format("Hello {name}", {})).toBe("Hello {name}");
  });
});
