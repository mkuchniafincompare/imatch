-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "lat" REAL;
ALTER TABLE "Venue" ADD COLUMN "lng" REAL;

-- CreateTable
CREATE TABLE "GeoCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "zip" TEXT,
    "city" TEXT,
    "street" TEXT,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GeoCache_zip_city_street_key" ON "GeoCache"("zip", "city", "street");
