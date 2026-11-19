CREATE TABLE "MarketingCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "startDate" TEXT,
    "budget" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Planned',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketingFollowUp" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingFollowUp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketingCampaign_createdAt_idx" ON "MarketingCampaign"("createdAt");
CREATE INDEX "MarketingCampaign_status_idx" ON "MarketingCampaign"("status");
CREATE INDEX "MarketingCampaign_createdById_idx" ON "MarketingCampaign"("createdById");
CREATE INDEX "MarketingFollowUp_leadId_idx" ON "MarketingFollowUp"("leadId");
CREATE INDEX "MarketingFollowUp_date_idx" ON "MarketingFollowUp"("date");
CREATE INDEX "MarketingFollowUp_createdById_idx" ON "MarketingFollowUp"("createdById");

ALTER TABLE "MarketingCampaign"
ADD CONSTRAINT "MarketingCampaign_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MarketingFollowUp"
ADD CONSTRAINT "MarketingFollowUp_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
