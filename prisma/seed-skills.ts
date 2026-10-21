import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// key, category, English name, Sinhala name
const SKILLS = [
    ["acting", "performance", "Acting", "රංගනය"],
    ["stage", "performance", "Stage and theatre", "වේදිකා නාට්‍ය"],
    ["voice_acting", "performance", "Voice acting", "හඬ රංගනය"],
    ["dubbing", "performance", "Dubbing", "හඬ කැවීම"],
    ["improv", "performance", "Improvisation", "ක්ෂණික රංගනය"],
    ["comedy", "performance", "Comedy", "හාස්‍ය රංගනය"],
    ["hosting", "performance", "Hosting and presenting", "මෙහෙයවීම"],
    ["runway", "modelling", "Runway modelling", "ෆැෂන් ෂෝ ආකෘතිකරණය"],
    ["photo_modelling", "modelling", "Photo modelling", "ඡායාරූප ආකෘතිකරණය"],
    ["dancing", "movement", "Dancing", "නර්තනය"],
    ["martial_arts", "movement", "Martial arts", "සටන් කලා"],
    ["stunts", "movement", "Stunts", "ස්ටන්ට්"],
    ["swimming", "movement", "Swimming", "පීනීම"],
    ["horse_riding", "movement", "Horse riding", "අශ්ව ගමන"],
    ["gymnastics", "movement", "Gymnastics", "ජිම්නාස්ටික්"],
    ["yoga", "movement", "Yoga", "යෝගා"],
    ["boxing", "movement", "Boxing", "බොක්සිං"],
    ["cricket", "sport", "Cricket", "ක්‍රිකට්"],
    ["football", "sport", "Football", "පාපන්දු"],
    ["driving", "vehicles", "Car driving", "රථ ධාවනය"],
    ["motorcycle", "vehicles", "Motorcycle riding", "යතුරුපැදි ධාවනය"],
    ["cycling", "vehicles", "Cycling", "පාපැදි ගමන"],
    ["singing", "music", "Singing", "ගායනය"],
    ["guitar", "music", "Guitar", "ගිටාරය"],
    ["piano", "music", "Piano", "පියානෝව"],
    ["drums", "music", "Drums", "ඩ්‍රම්ස්"],
    ["violin", "music", "Violin", "වයලීනය"],
    ["rapping", "music", "Rapping", "රැප්"],
] as const;

async function main() {
    let order = 0;
    for (const [key, category, nameEn, nameSi] of SKILLS) {
        order += 1;
        await prisma.skill.upsert({
            where: { key },
            update: { category, nameEn, nameSi, sortOrder: order },
            create: { key, category, nameEn, nameSi, sortOrder: order },
        });
    }
    console.log(`Skills ready: ${await prisma.skill.count()}`);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });