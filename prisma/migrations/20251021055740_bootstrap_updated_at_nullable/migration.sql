/*
  Warnings:

  - Added the required column `updatedAt` to the `Venue` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Club" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "street" TEXT,
    "zip" TEXT,
    "logoUrl" TEXT,
    "logoMime" TEXT,
    "logoWidth" INTEGER,
    "logoHeight" INTEGER,
    "logoUpdatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "lat" REAL,
    "lng" REAL
);
INSERT INTO "new_Club" ("city", "id", "lat", "lng", "name", "street", "zip") SELECT "city", "id", "lat", "lng", "name", "street", "zip" FROM "Club";
DROP TABLE "Club";
ALTER TABLE "new_Club" RENAME TO "Club";
CREATE UNIQUE INDEX "Club_name_key" ON "Club"("name");
CREATE TABLE "new_Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Venue_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Venue" ("city", "clubId", "id", "name", "street", "zip") SELECT "city", "clubId", "id", "name", "street", "zip" FROM "Venue";
DROP TABLE "Venue";
ALTER TABLE "new_Venue" RENAME TO "Venue";
CREATE INDEX "Venue_clubId_idx" ON "Venue"("clubId");
CREATE UNIQUE INDEX "Venue_clubId_name_key" ON "Venue"("clubId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
