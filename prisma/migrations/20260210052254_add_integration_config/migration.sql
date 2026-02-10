-- CreateTable
CREATE TABLE "IntegrationConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "channelId" TEXT,
    "boardId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "events" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntegrationConfig_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "IntegrationConfig_boardId_idx" ON "IntegrationConfig"("boardId");

-- CreateIndex
CREATE INDEX "IntegrationConfig_type_idx" ON "IntegrationConfig"("type");
