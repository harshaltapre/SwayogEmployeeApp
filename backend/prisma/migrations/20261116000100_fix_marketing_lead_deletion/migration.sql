ALTER TABLE "MarketingLead"
ADD COLUMN IF NOT EXISTS "address" TEXT;

CREATE TABLE IF NOT EXISTS "DeletedMarketingLead" (
    "id" TEXT NOT NULL,
    "originalLeadId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assignedTo" TEXT,
    "followUpAt" TEXT,
    "deleteRemark" TEXT NOT NULL,
    "deletedById" TEXT,
    "deletedByName" TEXT,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeletedMarketingLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DeletedMarketingLead_deletedAt_idx"
ON "DeletedMarketingLead"("deletedAt");
CREATE INDEX IF NOT EXISTS "DeletedMarketingLead_phone_idx"
ON "DeletedMarketingLead"("phone");
CREATE INDEX IF NOT EXISTS "DeletedMarketingLead_deletedById_idx"
ON "DeletedMarketingLead"("deletedById");
