ALTER TABLE "OnboardingRequest"
ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "OnboardingRequest_archivedAt_idx"
ON "OnboardingRequest"("archivedAt");
