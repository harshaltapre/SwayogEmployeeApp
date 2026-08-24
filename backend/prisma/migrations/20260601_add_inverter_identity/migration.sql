-- Add explicit inverter identity fields to customer records
ALTER TABLE "Customer" ADD COLUMN "inverterName" TEXT;
ALTER TABLE "Customer" ADD COLUMN "inverterUid" TEXT;
