-- Company alarm policy (single-row config) for the smart attendance alarm feature
CREATE TABLE IF NOT EXISTS "CompanyAlarmPolicy" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "prepReminderTime" TEXT NOT NULL DEFAULT '10:00',
    "prepReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "finalReminderTime" TEXT NOT NULL DEFAULT '10:15',
    "finalReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "personalDefaultTime" TEXT NOT NULL DEFAULT '09:30',
    "defaultSoundName" TEXT,
    "defaultSoundKey" TEXT,
    "policyNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyAlarmPolicy_pkey" PRIMARY KEY ("id")
);

-- Company-uploaded ringtones stored in R2 object storage
CREATE TABLE IF NOT EXISTS "CompanyRingtone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyRingtone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CompanyRingtone_createdAt_idx" ON "CompanyRingtone"("createdAt");

-- Multi-alarm support: personal alarms stored as JSON per employee
ALTER TABLE "EmployeeAlarmSetting" ADD COLUMN IF NOT EXISTS "alarms" JSONB;
