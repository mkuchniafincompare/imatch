/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT,
    "city" TEXT,
    CONSTRAINT "Venue_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Club" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "street" TEXT,
    "lat" REAL,
    "lng" REAL
);
INSERT INTO "new_Club" ("city", "id", "lat", "lng", "name") SELECT "city", "id", "lat", "lng", "name" FROM "Club";
DROP TABLE "Club";
ALTER TABLE "new_Club" RENAME TO "Club";
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubId" TEXT NOT NULL,
    "contactUserId" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "name" TEXT,
    "year" INTEGER,
    "preferredForm" TEXT,
    CONSTRAINT "Team_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Team_contactUserId_fkey" FOREIGN KEY ("contactUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("ageGroup", "clubId", "contactUserId", "id", "lat", "level", "lng") SELECT "ageGroup", "clubId", "contactUserId", "id", "lat", "level", "lng" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE INDEX "Team_ageGroup_level_idx" ON "Team"("ageGroup", "level");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "nickname" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "otpCode" TEXT,
    "otpExpiresAt" DATETIME,
    "emailVerifiedAt" DATETIME,
    "emailVerifyToken" TEXT,
    "emailVerifyTokenExpires" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UNVERIFIED'
);
INSERT INTO "new_User" ("email", "id", "otpCode", "otpExpiresAt", "passwordHash") SELECT "email", "id", "otpCode", "otpExpiresAt", "passwordHash" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Venue_clubId_idx" ON "Venue"("clubId");
