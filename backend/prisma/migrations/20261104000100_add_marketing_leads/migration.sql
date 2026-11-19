CREATE TABLE "MarketingLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'New',
    "assignedTo" TEXT,
    "followUpAt" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketingLead_createdAt_idx" ON "MarketingLead"("createdAt");
CREATE INDEX "MarketingLead_status_idx" ON "MarketingLead"("status");
CREATE INDEX "MarketingLead_source_idx" ON "MarketingLead"("source");
CREATE INDEX "MarketingLead_createdById_idx" ON "MarketingLead"("createdById");

ALTER TABLE "MarketingLead"
ADD CONSTRAINT "MarketingLead_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
