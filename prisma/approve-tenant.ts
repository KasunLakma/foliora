import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Usage:  npx tsx prisma/approve-tenant.ts someone@example.com
// Makes every account of that user "ACTIVE" so they can publish. The admin portal will replace this later.

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.log("Usage: npx tsx prisma/approve-tenant.ts someone@example.com");
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { memberships: { select: { tenantId: true } } },
  });
  if (!user) {
    console.log(`No user with the email ${email}`);
    return;
  }

  const ids = user.memberships.map((m) => m.tenantId);
  const result = await prisma.tenant.updateMany({ where: { id: { in: ids } }, data: { status: "ACTIVE" } });
  console.log(`Approved ${result.count} account(s) for ${email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
