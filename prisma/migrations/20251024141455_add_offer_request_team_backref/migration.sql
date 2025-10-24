-- CreateTable
CREATE TABLE "OfferRequest" (
    "requesterUserId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "requesterTeamId" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("requesterUserId", "offerId"),
    CONSTRAINT "OfferRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferRequest_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "GameOffer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferRequest_requesterTeamId_fkey" FOREIGN KEY ("requesterTeamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OfferRequest_offerId_idx" ON "OfferRequest"("offerId");
