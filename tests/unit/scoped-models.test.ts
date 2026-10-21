import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MANUALLY_SCOPED_MODELS,
  TENANT_SCOPED_MODELS,
  tenantDb,
} from "../../src/lib/db/tenant";

describe("tenant scoping rules", () => {
  it("every model with a tenantId column is registered as scoped", () => {
    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const blocks = [...schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)];
    const withTenantId = blocks
      .filter((match) => /^\s*tenantId\s/m.test(match[2]))
      .map((match) => match[1]);

    const registered = new Set<string>([
      ...TENANT_SCOPED_MODELS,
      ...MANUALLY_SCOPED_MODELS,
    ]);

    for (const name of withTenantId) {
      expect(
        registered.has(name),
        `Model ${name} has tenantId but is not registered in src/lib/db/tenant.ts`,
      ).toBe(true);
    }
  });

  it("tenantDb refuses an empty tenant id", () => {
    expect(() => tenantDb("")).toThrow();
  });
});
