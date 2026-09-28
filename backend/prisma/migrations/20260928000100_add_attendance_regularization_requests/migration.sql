CREATE TYPE "AttendanceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "AttendanceRegularizationRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "checkInTime" TEXT,
    "checkInPeriod" TEXT,
    "checkOutTime" TEXT,
    "checkOutPeriod" TEXT,
    "reason" TEXT NOT NULL,
    "requestStatus" "AttendanceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRegularizationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AttendanceRegularizationRequest_employeeId_idx" ON "AttendanceRegularizationRequest"("employeeId");
CREATE INDEX "AttendanceRegularizationRequest_date_idx" ON "AttendanceRegularizationRequest"("date");
CREATE INDEX "AttendanceRegularizationRequest_requestStatus_idx" ON "AttendanceRegularizationRequest"("requestStatus");
CREATE INDEX "AttendanceRegularizationRequest_createdAt_idx" ON "AttendanceRegularizationRequest"("createdAt");

ALTER TABLE "AttendanceRegularizationRequest"
    ADD CONSTRAINT "AttendanceRegularizationRequest_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttendanceRegularizationRequest"
    ADD CONSTRAINT "AttendanceRegularizationRequest_reviewedBy_fkey"
    FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
