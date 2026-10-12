-- All customers already have completed installation.
UPDATE "Customer"
SET "projectStage" = 11;

ALTER TABLE "Customer"
ALTER COLUMN "projectStage" SET DEFAULT 11;
