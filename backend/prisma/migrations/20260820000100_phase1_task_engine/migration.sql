-- Persist the task lifecycle fields used by the web task engine.
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "customerId" INTEGER;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "taskType" TEXT NOT NULL DEFAULT 'REGULAR';
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "taskRate" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "beforeImageUrl" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "beforeLatitude" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "beforeLongitude" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "afterImageUrl" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "afterLatitude" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "afterLongitude" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "customerRating" INTEGER;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "customerFeedback" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "fixCharges" DOUBLE PRECISION;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Task_customerId_fkey'
  ) THEN
    ALTER TABLE "Task"
      ADD CONSTRAINT "Task_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Task_customerId_idx" ON "Task"("customerId");
CREATE INDEX IF NOT EXISTS "Task_taskType_idx" ON "Task"("taskType");

-- Existing tasks were historically assigned through Task.employeeUserId.
-- Backfill explicit assignment rows so the new employee ownership query can
-- depend only on TaskAssignment.employeeUserId.
INSERT INTO "TaskAssignment" ("id", "taskId", "employeeUserId", "assignedAt", "status")
SELECT
  CONCAT('backfill-', t."id", '-', LEFT(MD5(t."employeeUserId"), 16)),
  t."id",
  t."employeeUserId",
  COALESCE(t."createdAt", NOW()),
  CASE
    WHEN t."status" IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED') THEN t."status"
    ELSE 'ASSIGNED'
  END
FROM "Task" t
WHERE t."employeeUserId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "TaskAssignment" ta
    WHERE ta."taskId" = t."id"
      AND ta."employeeUserId" = t."employeeUserId"
  );
