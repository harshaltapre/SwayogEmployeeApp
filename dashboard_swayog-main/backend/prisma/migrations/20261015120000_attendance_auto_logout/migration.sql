-- CreateEnum
CREATE TYPE "AttendanceCheckoutSource" AS ENUM ('MANUAL', 'AUTO');

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL,
    "checkOutAt" TIMESTAMP(3),
    "workMinutes" INTEGER,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "breaks" JSONB NOT NULL DEFAULT '[]',
    "checkInSelfie" TEXT,
    "checkInLocation" TEXT,
    "checkOutSource" "AttendanceCheckoutSource",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_employeeId_workDate_key" ON "AttendanceRecord"("employeeId", "workDate");
CREATE INDEX "AttendanceRecord_workDate_checkOutAt_idx" ON "AttendanceRecord"("workDate", "checkOutAt");
CREATE INDEX "AttendanceRecord_employeeId_workDate_idx" ON "AttendanceRecord"("employeeId", "workDate");

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
