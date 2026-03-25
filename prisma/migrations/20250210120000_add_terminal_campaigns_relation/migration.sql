-- CreateTable
CREATE TABLE "TerminalCampaign" (
    "id" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT NOT NULL DEFAULT 'faChartBar',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "customTitle" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TerminalCampaign_pkey" PRIMARY KEY ("id")
);

-- Migrate existing data from Terminal.campaignId to TerminalCampaign
INSERT INTO "TerminalCampaign" ("id", "terminalId", "campaignId", "order", "icon", "color", "isActive", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "id",
    "campaignId",
    0,
    'faChartBar',
    '#3b82f6',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Terminal"
WHERE "campaignId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Terminal" DROP CONSTRAINT IF EXISTS "Terminal_campaignId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Terminal_campaignId_idx";

-- AlterTable - Remove campaignId column
ALTER TABLE "Terminal" DROP COLUMN IF EXISTS "campaignId";

-- CreateIndex
CREATE INDEX "TerminalCampaign_terminalId_idx" ON "TerminalCampaign"("terminalId");

-- CreateIndex
CREATE INDEX "TerminalCampaign_campaignId_idx" ON "TerminalCampaign"("campaignId");

-- CreateIndex
CREATE INDEX "TerminalCampaign_order_idx" ON "TerminalCampaign"("order");

-- CreateIndex (unique constraint)
CREATE UNIQUE INDEX "TerminalCampaign_terminalId_campaignId_key" ON "TerminalCampaign"("terminalId", "campaignId");

-- AddForeignKey
ALTER TABLE "TerminalCampaign" ADD CONSTRAINT "TerminalCampaign_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "Terminal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerminalCampaign" ADD CONSTRAINT "TerminalCampaign_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
