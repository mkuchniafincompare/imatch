-- AlterTable
ALTER TABLE "User" ADD COLUMN "marketingOptInAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "privacyAcceptedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "privacyPolicyVersion" TEXT;
