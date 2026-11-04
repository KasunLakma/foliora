import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

// Reads the database, so it must run on every request and not at build time.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const published = await prisma.portfolio.findMany({
    where: { status: "PUBLISHED", slug: { not: null } },
    select: { slug: true, tenantId: true, updatedAt: true },
  });
  const activeTenants = await prisma.tenant.findMany({
    where: { id: { in: published.map((p) => p.tenantId) }, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  const active = new Set(activeTenants.map((t) => t.id));

  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/terms`, lastModified: new Date("2026-01-01") },
    { url: `${base}/privacy`, lastModified: new Date("2026-01-01") },
    ...published
      .filter((p) => active.has(p.tenantId))
      .map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
