-- AlterTable
ALTER TABLE "User" ADD COLUMN "otpCode" TEXT;
ALTER TABLE "User" ADD COLUMN "otpExpiresAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
