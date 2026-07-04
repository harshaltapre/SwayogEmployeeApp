-- CreateTable
CREATE TABLE "DailyCommit" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "commitDate" DATE NOT NULL,
    "taskWorkedOn" TEXT NOT NULL,
    "workSummary" TEXT NOT NULL,
    "hoursSpent" DOUBLE PRECISION NOT NULL,
    "issuesBlockers" TEXT,
    "tomorrowPlan" TEXT,
    "attachmentUrl" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCommit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyCommit_employeeId_idx" ON "DailyCommit"("employeeId");

-- CreateIndex
CREATE INDEX "DailyCommit_commitDate_idx" ON "DailyCommit"("commitDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCommit_employeeId_commitDate_key" ON "DailyCommit"("employeeId", "commitDate");

-- AddForeignKey
ALTER TABLE "DailyCommit" ADD CONSTRAINT "DailyCommit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
