-- Add new credential columns for customers
ALTER TABLE "Customer"
ADD COLUMN "inverterLoginId" TEXT;

ALTER TABLE "Customer"
ADD COLUMN "inverterPassword" TEXT;

ALTER TABLE "Customer"
ADD COLUMN "portalLoginId" TEXT;

ALTER TABLE "Customer"
ADD COLUMN "portalPassword" TEXT;
