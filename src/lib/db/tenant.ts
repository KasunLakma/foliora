/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "./prisma";

// Models that have a tenantId column and are ALWAYS filtered by it.
export const TENANT_SCOPED_MODELS = ["TenantMember", "AuditLog"] as const;

// Models with a tenantId column that are handled by hand.
// Role: tenantId is null for system roles, so it cannot use the automatic filter.
export const MANUALLY_SCOPED_MODELS = ["Role"] as const;

const SCOPED = new Set<string>(TENANT_SCOPED_MODELS);

const FILTERED_OPERATIONS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

function assertNoTenantChange(data: any) {
  if (data && Object.prototype.hasOwnProperty.call(data, "tenantId")) {
    throw new Error("Changing tenantId is not allowed");
  }
}

/**
 * Returns a database client that can only see and change rows of ONE tenant.
 * The tenantId must come from the signed-in session, never from the browser.
 */
export function tenantDb(tenantId: string) {
  if (!tenantId) throw new Error("tenantDb requires a tenantId");

  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!SCOPED.has(model)) return query(args);

          const a: any = args ?? {};

          if (FILTERED_OPERATIONS.has(operation)) {
            if (operation === "update" || operation === "updateMany") {
              assertNoTenantChange(a.data);
            }
            a.where = { ...(a.where ?? {}), tenantId };
          } else if (operation === "create") {
            a.data = { ...a.data, tenantId };
          } else if (operation === "createMany" || operation === "createManyAndReturn") {
            const rows = Array.isArray(a.data) ? a.data : [a.data];
            a.data = rows.map((row: any) => ({ ...row, tenantId }));
          } else if (operation === "upsert") {
            assertNoTenantChange(a.update);
            a.where = { ...(a.where ?? {}), tenantId };
            a.create = { ...a.create, tenantId };
          } else {
            throw new Error(`Operation "${operation}" is not allowed on tenant-scoped data`);
          }

          return query(a);
        },
      },
    },
  });
}
