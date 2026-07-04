-- CreateEnum for DepartmentCode
CREATE TYPE "DepartmentCode" AS ENUM ('OPERATIONS', 'SERVICE_MAINTENANCE', 'INVENTORY', 'FINANCE', 'SALES', 'HR');

-- CreateEnum for extended UserRole (add new values to existing enum)
ALTER TYPE "UserRole" ADD VALUE 'DEPARTMENT_HEAD';
ALTER TYPE "UserRole" ADD VALUE 'TEAM_LEAD';

-- CreateTable Department
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "code" "DepartmentCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- AddColumn to User table for employeeCode
ALTER TABLE "User" ADD COLUMN "employeeCode" TEXT;

-- AddColumn to User table for designationTitle
ALTER TABLE "User" ADD COLUMN "designationTitle" TEXT;

-- AddColumn to User table for departmentId (Foreign Key)
ALTER TABLE "User" ADD COLUMN "departmentId" TEXT;

-- AddColumn to User table for reportingManagerId (Self-relation Foreign Key)
ALTER TABLE "User" ADD COLUMN "reportingManagerId" TEXT;

-- CreateIndex on Department code (unique)
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex on User employeeCode (unique)
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");

-- CreateIndex on User departmentId
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex on User reportingManagerId
CREATE INDEX "User_reportingManagerId_idx" ON "User"("reportingManagerId");

-- CreateIndex on User (role, departmentId) for high-volume queries
CREATE INDEX "User_role_departmentId_idx" ON "User"("role", "departmentId");

-- AddForeignKey: User.departmentId -> Department.id
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: User.reportingManagerId -> User.id (self-relation)
ALTER TABLE "User" ADD CONSTRAINT "User_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
