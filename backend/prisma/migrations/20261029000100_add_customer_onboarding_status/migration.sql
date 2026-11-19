-- Persist customer onboarding checklist status.
ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "siteVisitCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "documentsCollected" BOOLEAN NOT NULL DEFAULT false;

-- Existing completed customers already went through onboarding.
UPDATE "Customer"
SET
  "siteVisitCompleted" = true,
  "documentsCollected" = true
WHERE "projectStage" >= 11
  AND COALESCE("partnerLeadStatus", '') <> 'PENDING';
