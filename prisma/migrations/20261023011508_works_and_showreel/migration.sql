-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('FILM', 'TV', 'THEATRE', 'COMMERCIAL', 'MUSIC_VIDEO', 'WEB_SERIES', 'MODELLING', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkRoleType" AS ENUM ('LEAD', 'SUPPORTING', 'CAMEO', 'EXTRA', 'OTHER');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('YOUTUBE', 'VIMEO');

-- CreateTable
CREATE TABLE "works" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "WorkType" NOT NULL,
    "roleName" TEXT,
    "roleType" "WorkRoleType",
    "director" TEXT,
    "company" TEXT,
    "description" TEXT,
    "link" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showreels" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "provider" "VideoProvider" NOT NULL,
    "videoId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "showreels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "works_tenantId_idx" ON "works"("tenantId");

-- CreateIndex
CREATE INDEX "works_profileId_year_idx" ON "works"("profileId", "year");

-- CreateIndex
CREATE INDEX "showreels_tenantId_idx" ON "showreels"("tenantId");

-- CreateIndex
CREATE INDEX "showreels_profileId_idx" ON "showreels"("profileId");

-- AddForeignKey
ALTER TABLE "works" ADD CONSTRAINT "works_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showreels" ADD CONSTRAINT "showreels_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
