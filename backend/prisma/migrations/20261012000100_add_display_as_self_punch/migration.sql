-- AlterTable: Add displayAsSelfPunch column to AttendanceRecord
-- When true, admin-applied attendance shows as "Self Punch" to employees
-- while audit trail is preserved for Super Admins

ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "displayAsSelfPunch" BOOLEAN NOT NULL DEFAULT false;

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS "AttendanceRecord_displayAsSelfPunch_idx" ON "AttendanceRecord"("displayAsSelfPunch");
