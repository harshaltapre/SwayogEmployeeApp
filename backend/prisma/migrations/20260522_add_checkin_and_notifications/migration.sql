-- Migration: add CheckIn, AdminNotification and CheckInStatus

-- Create enum type for CheckInStatus
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkinstatus') THEN
        CREATE TYPE "CheckInStatus" AS ENUM ('CHECKED_IN','CHECKED_OUT');
    END IF;
END$$;

-- Create CheckIn table
CREATE TABLE IF NOT EXISTS "CheckIn" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "employeeId" TEXT NOT NULL,
  "selfieUrl" TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status "CheckInStatus" DEFAULT 'CHECKED_IN',
  "createdAt" TIMESTAMP(3) DEFAULT now()
);

-- Create AdminNotification table
CREATE TABLE IF NOT EXISTS "AdminNotification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  "imageUrl" TEXT,
  "employeeId" TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_checkin_employeeId" ON "CheckIn" ("employeeId");
CREATE INDEX IF NOT EXISTS "idx_checkin_createdAt" ON "CheckIn" ("createdAt");
CREATE INDEX IF NOT EXISTS "idx_adminnotification_employeeId" ON "AdminNotification" ("employeeId");
CREATE INDEX IF NOT EXISTS "idx_adminnotification_type" ON "AdminNotification" (type);
CREATE INDEX IF NOT EXISTS "idx_adminnotification_createdAt" ON "AdminNotification" ("createdAt");
