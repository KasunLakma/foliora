import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Usage:  npx tsx prisma/seed-plans.ts
// Safe to run again. It updates prices and limits of the three plans. Prices are in rupees.

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PLANS = [
  { key: "free", name: "Free", monthlyPrice: 0, yearlyPrice: 0, sortOrder: 0, limits: { photos: 15, showreels: 5, applications: 3 } },
  { key: "pro", name: "Pro", monthlyPrice: 2500, yearlyPrice: 25000, sortOrder: 1, limits: { photos: 200, showreels: 5, applications: null } },
  { key: "agency", name: "Agency", monthlyPrice: 12500, yearlyPrice: 125000, sortOrder: 2, limits: { photos: 2000, showreels: 5, applications: null } },
];

async function main() {
  for (const plan of PLANS) {
    await prisma.plan.upsert({ where: { key: plan.key }, update: plan, create: plan });
  }
  console.log(`Plans ready: ${await prisma.plan.count()}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
