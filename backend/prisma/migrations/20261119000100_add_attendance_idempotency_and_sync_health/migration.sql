-- Additive, non-destructive migration for attendance idempotency keys,
-- device sync health telemetry, and smart attendance columns.

ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'PRESENT_LATE_ALLOWANCE';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'ON_LEAVE';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'PENDING_VERIFICATION';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'MANUAL_REVIEW';

ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "lateSequenceNumber" INTEGER;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "lateAllowanceConsumed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "faceVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "gpsVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "locationAccuracy" DOUBLE PRECISION;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "policyVersionUsed" TEXT;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "clientUploadId" TEXT;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "checkOutClientUploadId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceRecord_employeeId_clientUploadId_key"
  ON "AttendanceRecord"("employeeId", "clientUploadId");
CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceRecord_employeeId_checkOutClientUploadId_key"
  ON "AttendanceRecord"("employeeId", "checkOutClientUploadId");

CREATE TABLE IF NOT EXISTS "DeviceSyncHealth" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "appVersionCode" INTEGER NOT NULL DEFAULT 0,
    "appVersionName" TEXT,
    "androidVersion" TEXT,
    "deviceModel" TEXT,
    "pendingOutboxCount" INTEGER NOT NULL DEFAULT 0,
    "failedOutboxCount" INTEGER NOT NULL DEFAULT 0,
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "lastSyncError" TEXT,
    "lastHttpCode" INTEGER,
    "tokenRefreshFailures" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceSyncHealth_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeviceSyncHealth_employeeId_key" ON "DeviceSyncHealth"("employeeId");
CREATE INDEX IF NOT EXISTS "DeviceSyncHealth_lastSyncStatus_idx" ON "DeviceSyncHealth"("lastSyncStatus");
CREATE INDEX IF NOT EXISTS "DeviceSyncHealth_updatedAt_idx" ON "DeviceSyncHealth"("updatedAt");
