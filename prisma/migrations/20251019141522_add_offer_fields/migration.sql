-- CreateTable
CREATE TABLE "OfferAge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offerId" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    CONSTRAINT "OfferAge_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "GameOffer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "dateStart" DATETIME NOT NULL,
    "dateEnd" DATETIME NOT NULL,
    "fixedKickoff" DATETIME,
    "offerDate" DATETIME,
    "kickoffTime" TEXT,
    "kickoffFlexible" BOOLEAN NOT NULL DEFAULT false,
    "strength" TEXT,
    "playForm" TEXT,
    "durationText" TEXT,
    "homeAway" TEXT NOT NULL DEFAULT 'FLEX',
    "fieldType" TEXT NOT NULL DEFAULT 'FIELD',
    "lat" REAL,
    "lng" REAL,
    "radiusKm" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameOffer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GameOffer" ("createdAt", "dateEnd", "dateStart", "fieldType", "fixedKickoff", "homeAway", "id", "lat", "lng", "notes", "radiusKm", "status", "teamId") SELECT "createdAt", "dateEnd", "dateStart", "fieldType", "fixedKickoff", "homeAway", "id", "lat", "lng", "notes", "radiusKm", "status", "teamId" FROM "GameOffer";
DROP TABLE "GameOffer";
ALTER TABLE "new_GameOffer" RENAME TO "GameOffer";
CREATE INDEX "GameOffer_status_dateStart_dateEnd_idx" ON "GameOffer"("status", "dateStart", "dateEnd");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "OfferAge_offerId_ageGroup_idx" ON "OfferAge"("offerId", "ageGroup");
