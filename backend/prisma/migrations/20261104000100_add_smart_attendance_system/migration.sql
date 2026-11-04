-- Add new enum values to AttendanceStatus safely
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'PRESENT_LATE_ALLOWANCE';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'ON_LEAVE';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'PENDING_VERIFICATION';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'MANUAL_REVIEW';

-- Add new columns to AttendanceRecord
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "lateSequenceNumber" INTEGER;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "lateAllowanceConsumed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "faceVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "gpsVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "locationAccuracy" DOUBLE PRECISION;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "policyVersionUsed" TEXT;

-- Add new columns to AttendanceRule
ALTER TABLE "AttendanceRule" ADD COLUMN IF NOT EXISTS "reportingTime" TEXT NOT NULL DEFAULT '10:30';
ALTER TABLE "AttendanceRule" ADD COLUMN IF NOT EXISTS "monthlyLateAllowance" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "AttendanceRule" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';
ALTER TABLE "AttendanceRule" ADD COLUMN IF NOT EXISTS "geofenceActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AttendanceRule" ADD COLUMN IF NOT EXISTS "minLocationAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 100.0;
ALTER TABLE "AttendanceRule" ADD COLUMN IF NOT EXISTS "policyStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "AttendanceRule" ADD COLUMN IF NOT EXISTS "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create MonthlyLateCounter table
CREATE TABLE IF NOT EXISTS "MonthlyLateCounter" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "lateDaysUsed" INTEGER NOT NULL DEFAULT 0,
    "halfDayCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyLateCounter_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MonthlyLateCounter_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyLateCounter_employeeId_yearMonth_key" ON "MonthlyLateCounter"("employeeId", "yearMonth");
CREATE INDEX IF NOT EXISTS "MonthlyLateCounter_employeeId_idx" ON "MonthlyLateCounter"("employeeId");

-- Create EmployeeAlarmSetting table
CREATE TABLE IF NOT EXISTS "EmployeeAlarmSetting" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "personalAlarmTime" TEXT NOT NULL DEFAULT '10:20',
    "reminder1Time" TEXT DEFAULT '10:00',
    "reminder2Time" TEXT DEFAULT '10:15',
    "repeatDays" INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6]::INTEGER[],
    "soundUri" TEXT,
    "vibrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "snoozeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeAlarmSetting_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EmployeeAlarmSetting_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeAlarmSetting_employeeId_key" ON "EmployeeAlarmSetting"("employeeId");

-- Create AttendanceAuditEvent table
CREATE TABLE IF NOT EXISTS "AttendanceAuditEvent" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "eventType" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "actorId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceAuditEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AttendanceAuditEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttendanceAuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AttendanceAuditEvent_employeeId_idx" ON "AttendanceAuditEvent"("employeeId");
CREATE INDEX IF NOT EXISTS "AttendanceAuditEvent_date_idx" ON "AttendanceAuditEvent"("date");

