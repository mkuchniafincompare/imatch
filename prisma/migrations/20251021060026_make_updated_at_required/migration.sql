/*
  Warnings:

  - Made the column `updatedAt` on table `Club` required. This step will fail if there are existing NULL values in that column.

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
    "updatedAt" DATETIME NOT NULL,
    "lat" REAL,
    "lng" REAL
);
INSERT INTO "new_Club" ("city", "createdAt", "id", "lat", "lng", "logoHeight", "logoMime", "logoUpdatedAt", "logoUrl", "logoWidth", "name", "street", "updatedAt", "zip") SELECT "city", "createdAt", "id", "lat", "lng", "logoHeight", "logoMime", "logoUpdatedAt", "logoUrl", "logoWidth", "name", "street", "updatedAt", "zip" FROM "Club";
DROP TABLE "Club";
ALTER TABLE "new_Club" RENAME TO "Club";
CREATE UNIQUE INDEX "Club_name_key" ON "Club"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
