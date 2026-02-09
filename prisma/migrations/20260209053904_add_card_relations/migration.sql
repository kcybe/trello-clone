-- CreateTable
CREATE TABLE "CardRelation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceCardId" TEXT NOT NULL,
    "targetCardId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'blocks',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CardRelation_sourceCardId_fkey" FOREIGN KEY ("sourceCardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CardRelation_targetCardId_fkey" FOREIGN KEY ("targetCardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CardRelation_sourceCardId_idx" ON "CardRelation"("sourceCardId");

-- CreateIndex
CREATE INDEX "CardRelation_targetCardId_idx" ON "CardRelation"("targetCardId");

-- CreateIndex
CREATE UNIQUE INDEX "CardRelation_sourceCardId_targetCardId_key" ON "CardRelation"("sourceCardId", "targetCardId");
