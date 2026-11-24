-- CreateEnum
CREATE TYPE "CastingStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "CastingGender" AS ENUM ('ANY', 'MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'SHORTLISTED', 'NOT_SELECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "casting_calls" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "role" TEXT,
    "description" TEXT NOT NULL,
    "gender" "CastingGender" NOT NULL DEFAULT 'ANY',
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "location" TEXT,
    "compensation" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "CastingStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casting_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casting_applications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "message" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casting_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "casting_calls_status_deadline_idx" ON "casting_calls"("status", "deadline");

-- CreateIndex
CREATE INDEX "casting_applications_tenantId_createdAt_idx" ON "casting_applications"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "casting_applications_callId_tenantId_key" ON "casting_applications"("callId", "tenantId");

-- AddForeignKey
ALTER TABLE "casting_applications" ADD CONSTRAINT "casting_applications_callId_fkey" FOREIGN KEY ("callId") REFERENCES "casting_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
