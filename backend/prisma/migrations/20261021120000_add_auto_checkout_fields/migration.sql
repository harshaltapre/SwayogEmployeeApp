-- AlterTable: Add shiftEnd and autoCheckoutGraceMinutes to AttendanceRule
ALTER TABLE "AttendanceRule" 
ADD COLUMN IF NOT EXISTS "shiftEnd" TEXT NOT NULL DEFAULT '18:30',
ADD COLUMN IF NOT EXISTS "autoCheckoutGraceMinutes" INTEGER NOT NULL DEFAULT 30;

-- AlterTable: Add check-out audit and auto-closure tracking to AttendanceRecord
ALTER TABLE "AttendanceRecord"
ADD COLUMN IF NOT EXISTS "actualCheckOutTime" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "effectiveCheckOutTime" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "checkOutSource" TEXT,
ADD COLUMN IF NOT EXISTS "autoClosedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "autoClosureReason" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AttendanceRecord_checkOutSource_idx" ON "AttendanceRecord"("checkOutSource");
