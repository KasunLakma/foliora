-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'OTHER');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'YOUTUBE', 'IMDB', 'LINKEDIN', 'X', 'WEBSITE');

-- CreateTable
CREATE TABLE "talent_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "legalName" TEXT,
    "taglineEn" TEXT,
    "taglineSi" TEXT,
    "bioEn" TEXT,
    "bioSi" TEXT,
    "gender" "Gender",
    "birthYear" INTEGER,
    "location" TEXT,
    "nationality" TEXT,
    "heightCm" INTEGER,
    "build" TEXT,
    "eyeColor" TEXT,
    "hairColor" TEXT,
    "languages" TEXT[],
    "visibility" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "talent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameSi" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_skills" (
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "profile_skills_pkey" PRIMARY KEY ("profileId","skillId")
);

-- CreateIndex
CREATE INDEX "talent_profiles_tenantId_idx" ON "talent_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "social_links_tenantId_idx" ON "social_links"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "social_links_profileId_platform_key" ON "social_links"("profileId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "skills_key_key" ON "skills"("key");

-- CreateIndex
CREATE INDEX "profile_skills_tenantId_idx" ON "profile_skills"("tenantId");

-- AddForeignKey
ALTER TABLE "talent_profiles" ADD CONSTRAINT "talent_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_skills" ADD CONSTRAINT "profile_skills_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_skills" ADD CONSTRAINT "profile_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
