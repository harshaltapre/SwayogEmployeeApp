-- ============================================================================
-- SWAYOG ENERGY DASHBOARD - COMPLETE POSTGRESQL DATABASE SETUP SCRIPT
-- Generated for PostgreSQL / Neon DB / Supabase / Local Postgres
-- Includes: Enums, Tables, Primary Keys, Foreign Keys, Indexes, & Initial Data
-- ============================================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('CHECKED_IN', 'CHECKED_OUT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN', 'EMPLOYEE', 'PARTNER', 'CUSTOMER', 'DEPARTMENT_HEAD', 'TEAM_LEAD');

-- CreateEnum
CREATE TYPE "DepartmentCode" AS ENUM ('OPERATIONS', 'SERVICE_MAINTENANCE', 'INVENTORY', 'FINANCE', 'SALES', 'HR');

-- CreateEnum
CREATE TYPE "CustomerAmcStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'NONE');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'LEAVE');

-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVISION');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AmcVisitStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskAssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InvoicePaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('INSTALLATION', 'AMC', 'REPAIR', 'SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "InverterProviderType" AS ENUM ('K_SOLAR', 'GROWATT', 'FOXESS', 'UTL', 'SOLARMAN', 'SOLIS', 'WAAREE', 'PV_BLINK', 'PANASONIC', 'ANCHOR', 'UPS_SOLAR', 'HAVELLS', 'VSOLE', 'WARI', 'SOLACE', 'HEAVEN', 'QUALICAP', 'ONE', 'GENERIC_REST', 'MANUAL');

-- CreateEnum
CREATE TYPE "GenerationDataSource" AS ENUM ('LIVE_API', 'CACHE', 'DB_SCHEDULER', 'MANUAL', 'ESTIMATED', 'SIMULATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "employeeCode" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "portalPassword" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "designationTitle" TEXT,
    "departmentId" TEXT,
    "reportingManagerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMP(3),
    "lastFailedLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileImageUrl" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER,
    "taskType" TEXT NOT NULL DEFAULT 'REGULAR',
    "jobType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "TaskStatus" NOT NULL DEFAULT 'ASSIGNED',
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "employeeUserId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "completionMessage" TEXT,
    "completionDocumentUrl" TEXT,
    "taskRate" DOUBLE PRECISION,
    "beforeImageUrl" TEXT,
    "beforeLatitude" DOUBLE PRECISION,
    "beforeLongitude" DOUBLE PRECISION,
    "afterImageUrl" TEXT,
    "afterLatitude" DOUBLE PRECISION,
    "afterLongitude" DOUBLE PRECISION,
    "sitePhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customerRating" INTEGER,
    "customerFeedback" TEXT,
    "fixCharges" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" TEXT NOT NULL,
    "taskId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageRecord" (
    "id" TEXT NOT NULL,
    "taskId" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "watermarkedUrl" TEXT,
    "exif" JSONB,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "takenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT,
    "serviceZone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerId" TEXT,
    "jobRole" TEXT NOT NULL DEFAULT 'field_technician',
    "zone" TEXT,
    "monthlySalaryInr" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "customerCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "address" TEXT NOT NULL,
    "systemSizeKw" DOUBLE PRECISION NOT NULL,
    "projectType" TEXT,
    "installationDate" TIMESTAMP(3) NOT NULL,
    "warrantyExpiry" TIMESTAMP(3),
    "panelBrand" TEXT,
    "inverterBrand" TEXT,
    "inverterName" TEXT,
    "inverterModel" TEXT,
    "inverterUid" TEXT,
    "monitoringProvider" TEXT,
    "monitoringPortalUrl" TEXT,
    "monitoringPlantId" TEXT,
    "monitoringStatus" TEXT,
    "monitoringLastDataAt" TIMESTAMP(3),
    "monitoringLastSyncAt" TIMESTAMP(3),
    "monitoringLastError" TEXT,
    "amcStatus" "CustomerAmcStatus" NOT NULL DEFAULT 'NONE',
    "amcExpiryDate" TIMESTAMP(3),
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "partnerId" TEXT,
    "userId" TEXT,
    "projectStage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cleaningWindow1" TEXT DEFAULT '1-10',
    "cleaningWindow2" TEXT DEFAULT '11-20',
    "cleaningWindow3" TEXT DEFAULT '21-30',
    "cleaningsPerMonth" INTEGER DEFAULT 1,
    "clientType" TEXT DEFAULT 'post_paid',
    "consumerNumber" TEXT,
    "contractEndDate" TIMESTAMP(3),
    "contractStartDate" TIMESTAMP(3),
    "monthlyCleaningRate" DOUBLE PRECISION,
    "paymentTerms" TEXT,
    "remarks" TEXT,
    "cleaningWindow4" TEXT,
    "cleaningWindow5" TEXT,
    "cleaningWindow6" TEXT,
    "cleaningWindow7" TEXT,
    "cleaningWindow8" TEXT,
    "assignedEmployeeId" TEXT,
    "commissionAmount" DOUBLE PRECISION,
    "commissionStatus" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "commissionProofUrl" TEXT,
    "commissionPaidAt" TIMESTAMP(3),
    "partnerLeadStatus" TEXT DEFAULT 'PENDING',
    "assignedEpc" TEXT,
    "epcAssignmentStatus" TEXT,
    "inverterLoginId" TEXT,
    "inverterPassword" TEXT,
    "inverterApiKey" TEXT,
    "inverterDeviceSn" TEXT,
    "dataLoggerSrNo" TEXT,
    "inverterSrNo" TEXT,
    "portalPassword" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "apartmentId" INTEGER,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apartment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Pune',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Apartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TEXT,
    "scheduledTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmcContract" (
    "id" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "annualFeeInr" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRenewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmcContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "zone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "customerId" INTEGER NOT NULL,
    "invoiceType" "InvoiceType" NOT NULL DEFAULT 'INSTALLATION',
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" "InvoicePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentDate" TIMESTAMP(3),
    "zone" TEXT,
    "state" TEXT,
    "partnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "paymentMethod" TEXT,
    "proofUrl" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerInstall" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "installDate" TIMESTAMP(3) NOT NULL,
    "commissionInr" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerInstall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmcVisit" (
    "id" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "AmcVisitStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedEmployeeId" TEXT,
    "cleaningNumber" INTEGER,
    "timeSlot" TEXT,
    "completedByEmployeeId" TEXT,
    "completedByName" TEXT,
    "visitNotes" TEXT,
    "beforeImageUrl" TEXT,
    "afterImageUrl" TEXT,

    CONSTRAINT "AmcVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "totalMinutes" INTEGER,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "reviewedBy" TEXT,
    "manualOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "selfieUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "CheckInStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "matchConfidence" DOUBLE PRECISION,
    "matchDistance" DOUBLE PRECISION,
    "livenessVerified" BOOLEAN NOT NULL DEFAULT false,
    "manualOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "reviewedBy" TEXT,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "employeeId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaceEnrollment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "descriptor1" JSONB NOT NULL,
    "descriptor2" JSONB NOT NULL,
    "descriptor3" JSONB NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'face-api-ssd-mobilenetv1-v1',

    CONSTRAINT "FaceEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "attendancePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taskCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgWorkScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHoursLogged" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "daysPresent" INTEGER NOT NULL DEFAULT 0,
    "daysAbsent" INTEGER NOT NULL DEFAULT 0,
    "tasksAssigned" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "workSubmissions" INTEGER NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSubmission" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "taskId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "proofUrl" TEXT,
    "proofNotes" TEXT,
    "hoursSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewScore" INTEGER,
    "reviewNotes" TEXT,
    "status" "WorkStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSubmission_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "inStock" INTEGER NOT NULL DEFAULT 0,
    "minThreshold" INTEGER NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "pricePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchRecord" (
    "id" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growatt_customers" (
    "id" SERIAL NOT NULL,
    "customer_name" TEXT NOT NULL,
    "api_token" TEXT NOT NULL,
    "plant_id" TEXT NOT NULL,
    "plant_name" TEXT NOT NULL,
    "plant_capacity" DOUBLE PRECISION NOT NULL,
    "plant_location" TEXT NOT NULL,
    "inverter_sn" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growatt_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growatt_generations" (
    "id" SERIAL NOT NULL,
    "growatt_customer_id" INTEGER NOT NULL,
    "today_generation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthly_generation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "yearly_generation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_generation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_power" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growatt_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waaree_generations" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "today_generation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthly_generation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "yearly_generation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_generation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_power" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waaree_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InverterCache" (
    "customerId" INTEGER NOT NULL,
    "summaryData" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InverterCache_pkey" PRIMARY KEY ("customerId")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "taskId" INTEGER NOT NULL,
    "employeeUserId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TaskAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerNotification" (
    "id" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "taskId" INTEGER,
    "imageUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskImage" (
    "id" TEXT NOT NULL,
    "taskId" INTEGER NOT NULL,
    "employeeUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "objectKey" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "watermarkText" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "taskId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "paidBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRule" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "shiftStart" TEXT NOT NULL DEFAULT '09:15',
    "faceRequired" BOOLEAN NOT NULL DEFAULT true,
    "geofenceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "officeLat" DOUBLE PRECISION NOT NULL DEFAULT 18.5204,
    "officeLng" DOUBLE PRECISION NOT NULL DEFAULT 73.8567,
    "officeRadius" DOUBLE PRECISION NOT NULL DEFAULT 150.0,
    "faceMatchThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.55,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IsphereGreenEntry" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IsphereGreenEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inverter_installations" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "brand" "InverterProviderType" NOT NULL,
    "model" TEXT,
    "serialNumber" TEXT,
    "capacity" DOUBLE PRECISION,
    "credentials" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchTime" TIMESTAMP(3),
    "lastFetchStatus" TEXT,
    "errorMessage" TEXT,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inverter_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_logs" (
    "id" SERIAL NOT NULL,
    "installationId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "currentPowerW" DOUBLE PRECISION,
    "dailyGenerationKwh" DOUBLE PRECISION,
    "monthlyGenerationKwh" DOUBLE PRECISION,
    "yearlyGenerationKwh" DOUBLE PRECISION,
    "totalGenerationKwh" DOUBLE PRECISION,
    "dataSource" "GenerationDataSource" NOT NULL,
    "isEstimated" BOOLEAN NOT NULL DEFAULT false,
    "fetchedFromApi" BOOLEAN NOT NULL DEFAULT false,
    "manualEntry" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_lockoutUntil_idx" ON "User"("lockoutUntil");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "User_reportingManagerId_idx" ON "User"("reportingManagerId");

-- CreateIndex
CREATE INDEX "User_role_departmentId_idx" ON "User"("role", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Task_customerId_idx" ON "Task"("customerId");

-- CreateIndex
CREATE INDEX "Task_taskType_idx" ON "Task"("taskType");

-- CreateIndex
CREATE INDEX "Task_employeeUserId_idx" ON "Task"("employeeUserId");

-- CreateIndex
CREATE INDEX "Task_assignedById_idx" ON "Task"("assignedById");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_scheduledTime_idx" ON "Task"("scheduledTime");

-- CreateIndex
CREATE INDEX "Task_employeeUserId_status_idx" ON "Task"("employeeUserId", "status");

-- CreateIndex
CREATE INDEX "Task_employeeUserId_scheduledTime_idx" ON "Task"("employeeUserId", "scheduledTime");

-- CreateIndex
CREATE INDEX "TaskAssignee_taskId_idx" ON "TaskAssignee"("taskId");

-- CreateIndex
CREATE INDEX "TaskAssignee_userId_idx" ON "TaskAssignee"("userId");

-- CreateIndex
CREATE INDEX "ImageRecord_taskId_idx" ON "ImageRecord"("taskId");

-- CreateIndex
CREATE INDEX "ImageRecord_uploadedBy_idx" ON "ImageRecord"("uploadedBy");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_action_idx" ON "AuditLog"("entity", "entityId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerProfile_userId_key" ON "PartnerProfile"("userId");

-- CreateIndex
CREATE INDEX "PartnerProfile_userId_idx" ON "PartnerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");

-- CreateIndex
CREATE INDEX "EmployeeProfile_partnerId_idx" ON "EmployeeProfile"("partnerId");

-- CreateIndex
CREATE INDEX "EmployeeProfile_userId_idx" ON "EmployeeProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE INDEX "Customer_partnerId_idx" ON "Customer"("partnerId");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Customer_amcStatus_idx" ON "Customer"("amcStatus");

-- CreateIndex
CREATE INDEX "ServiceRequest_customerId_idx" ON "ServiceRequest"("customerId");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");

-- CreateIndex
CREATE INDEX "AmcContract_customerId_idx" ON "AmcContract"("customerId");

-- CreateIndex
CREATE INDEX "AmcContract_renewalDate_idx" ON "AmcContract"("renewalDate");

-- CreateIndex
CREATE INDEX "AmcContract_state_idx" ON "AmcContract"("state");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceDate_idx" ON "Invoice"("invoiceDate");

-- CreateIndex
CREATE INDEX "Invoice_partnerId_idx" ON "Invoice"("partnerId");

-- CreateIndex
CREATE INDEX "Invoice_paymentStatus_idx" ON "Invoice"("paymentStatus");

-- CreateIndex
CREATE INDEX "Invoice_zone_idx" ON "Invoice"("zone");

-- CreateIndex
CREATE INDEX "Invoice_partnerId_invoiceDate_idx" ON "Invoice"("partnerId", "invoiceDate");

-- CreateIndex
CREATE INDEX "Invoice_customerId_invoiceDate_idx" ON "Invoice"("customerId", "invoiceDate");

-- CreateIndex
CREATE INDEX "PartnerInstall_invoiceId_idx" ON "PartnerInstall"("invoiceId");

-- CreateIndex
CREATE INDEX "PartnerInstall_partnerId_idx" ON "PartnerInstall"("partnerId");

-- CreateIndex
CREATE INDEX "AmcVisit_customerId_idx" ON "AmcVisit"("customerId");

-- CreateIndex
CREATE INDEX "AmcVisit_scheduledDate_idx" ON "AmcVisit"("scheduledDate");

-- CreateIndex
CREATE INDEX "AmcVisit_status_idx" ON "AmcVisit"("status");

-- CreateIndex
CREATE INDEX "AmcVisit_assignedEmployeeId_idx" ON "AmcVisit"("assignedEmployeeId");

-- CreateIndex
CREATE INDEX "AmcVisit_assignedEmployeeId_status_idx" ON "AmcVisit"("assignedEmployeeId", "status");

-- CreateIndex
CREATE INDEX "AmcVisit_assignedEmployeeId_scheduledDate_idx" ON "AmcVisit"("assignedEmployeeId", "scheduledDate");

-- CreateIndex
CREATE INDEX "AttendanceRecord_date_idx" ON "AttendanceRecord"("date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_employeeId_idx" ON "AttendanceRecord"("employeeId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_flagged_idx" ON "AttendanceRecord"("flagged");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_employeeId_date_key" ON "AttendanceRecord"("employeeId", "date");

-- CreateIndex
CREATE INDEX "CheckIn_employeeId_idx" ON "CheckIn"("employeeId");

-- CreateIndex
CREATE INDEX "CheckIn_createdAt_idx" ON "CheckIn"("createdAt");

-- CreateIndex
CREATE INDEX "CheckIn_flagged_idx" ON "CheckIn"("flagged");

-- CreateIndex
CREATE INDEX "AdminNotification_employeeId_idx" ON "AdminNotification"("employeeId");

-- CreateIndex
CREATE INDEX "AdminNotification_type_idx" ON "AdminNotification"("type");

-- CreateIndex
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FaceEnrollment_employeeId_key" ON "FaceEnrollment"("employeeId");

-- CreateIndex
CREATE INDEX "FaceEnrollment_employeeId_idx" ON "FaceEnrollment"("employeeId");

-- CreateIndex
CREATE INDEX "PerformanceSnapshot_employeeId_idx" ON "PerformanceSnapshot"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceSnapshot_employeeId_month_year_key" ON "PerformanceSnapshot"("employeeId", "month", "year");

-- CreateIndex
CREATE INDEX "WorkSubmission_employeeId_idx" ON "WorkSubmission"("employeeId");

-- CreateIndex
CREATE INDEX "WorkSubmission_status_idx" ON "WorkSubmission"("status");

-- CreateIndex
CREATE INDEX "DailyCommit_employeeId_idx" ON "DailyCommit"("employeeId");

-- CreateIndex
CREATE INDEX "DailyCommit_commitDate_idx" ON "DailyCommit"("commitDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCommit_employeeId_commitDate_key" ON "DailyCommit"("employeeId", "commitDate");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_sku_key" ON "Inventory"("sku");

-- CreateIndex
CREATE INDEX "DispatchRecord_customerId_idx" ON "DispatchRecord"("customerId");

-- CreateIndex
CREATE INDEX "DispatchRecord_itemId_idx" ON "DispatchRecord"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "growatt_customers_plant_id_key" ON "growatt_customers"("plant_id");

-- CreateIndex
CREATE INDEX "growatt_generations_growatt_customer_id_idx" ON "growatt_generations"("growatt_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "waaree_generations_customer_id_key" ON "waaree_generations"("customer_id");

-- CreateIndex
CREATE INDEX "waaree_generations_customer_id_idx" ON "waaree_generations"("customer_id");

-- CreateIndex
CREATE INDEX "TaskAssignment_taskId_idx" ON "TaskAssignment"("taskId");

-- CreateIndex
CREATE INDEX "TaskAssignment_employeeUserId_idx" ON "TaskAssignment"("employeeUserId");

-- CreateIndex
CREATE INDEX "TaskAssignment_status_idx" ON "TaskAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_employeeUserId_key" ON "TaskAssignment"("taskId", "employeeUserId");

-- CreateIndex
CREATE INDEX "CustomerNotification_customerId_idx" ON "CustomerNotification"("customerId");

-- CreateIndex
CREATE INDEX "CustomerNotification_type_idx" ON "CustomerNotification"("type");

-- CreateIndex
CREATE INDEX "CustomerNotification_createdAt_idx" ON "CustomerNotification"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerNotification_taskId_idx" ON "CustomerNotification"("taskId");

-- CreateIndex
CREATE INDEX "TaskImage_taskId_idx" ON "TaskImage"("taskId");

-- CreateIndex
CREATE INDEX "TaskImage_employeeUserId_idx" ON "TaskImage"("employeeUserId");

-- CreateIndex
CREATE INDEX "TaskImage_type_idx" ON "TaskImage"("type");

-- CreateIndex
CREATE INDEX "TaskImage_objectKey_idx" ON "TaskImage"("objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_taskId_idx" ON "Payment"("taskId");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");

-- CreateIndex
CREATE INDEX "Payment_paymentStatus_idx" ON "Payment"("paymentStatus");

-- CreateIndex
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

-- CreateIndex
CREATE INDEX "Payment_customerId_paymentStatus_idx" ON "Payment"("customerId", "paymentStatus");

-- CreateIndex
CREATE INDEX "IsphereGreenEntry_category_idx" ON "IsphereGreenEntry"("category");

-- CreateIndex
CREATE INDEX "IsphereGreenEntry_subcategory_idx" ON "IsphereGreenEntry"("subcategory");

-- CreateIndex
CREATE INDEX "inverter_installations_customerId_idx" ON "inverter_installations"("customerId");

-- CreateIndex
CREATE INDEX "inverter_installations_brand_idx" ON "inverter_installations"("brand");

-- CreateIndex
CREATE INDEX "inverter_installations_isActive_idx" ON "inverter_installations"("isActive");

-- CreateIndex
CREATE INDEX "inverter_installations_lastFetchTime_idx" ON "inverter_installations"("lastFetchTime");

-- CreateIndex
CREATE UNIQUE INDEX "inverter_installations_customerId_serialNumber_key" ON "inverter_installations"("customerId", "serialNumber");

-- CreateIndex
CREATE INDEX "generation_logs_installationId_idx" ON "generation_logs"("installationId");

-- CreateIndex
CREATE INDEX "generation_logs_customerId_idx" ON "generation_logs"("customerId");

-- CreateIndex
CREATE INDEX "generation_logs_timestamp_idx" ON "generation_logs"("timestamp");

-- CreateIndex
CREATE INDEX "generation_logs_dataSource_idx" ON "generation_logs"("dataSource");

-- CreateIndex
CREATE INDEX "generation_logs_customerId_timestamp_idx" ON "generation_logs"("customerId", "timestamp");

-- CreateIndex
CREATE INDEX "generation_logs_installationId_timestamp_idx" ON "generation_logs"("installationId", "timestamp");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_employeeUserId_fkey" FOREIGN KEY ("employeeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageRecord" ADD CONSTRAINT "ImageRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageRecord" ADD CONSTRAINT "ImageRecord_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerProfile" ADD CONSTRAINT "PartnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmcContract" ADD CONSTRAINT "AmcContract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerInstall" ADD CONSTRAINT "PartnerInstall_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmcVisit" ADD CONSTRAINT "AmcVisit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmcVisit" ADD CONSTRAINT "AmcVisit_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaceEnrollment" ADD CONSTRAINT "FaceEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSnapshot" ADD CONSTRAINT "PerformanceSnapshot_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSubmission" ADD CONSTRAINT "WorkSubmission_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSubmission" ADD CONSTRAINT "WorkSubmission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCommit" ADD CONSTRAINT "DailyCommit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRecord" ADD CONSTRAINT "DispatchRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRecord" ADD CONSTRAINT "DispatchRecord_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growatt_generations" ADD CONSTRAINT "growatt_generations_growatt_customer_id_fkey" FOREIGN KEY ("growatt_customer_id") REFERENCES "growatt_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waaree_generations" ADD CONSTRAINT "waaree_generations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InverterCache" ADD CONSTRAINT "InverterCache_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_employeeUserId_fkey" FOREIGN KEY ("employeeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNotification" ADD CONSTRAINT "CustomerNotification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskImage" ADD CONSTRAINT "TaskImage_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskImage" ADD CONSTRAINT "TaskImage_employeeUserId_fkey" FOREIGN KEY ("employeeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inverter_installations" ADD CONSTRAINT "inverter_installations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_logs" ADD CONSTRAINT "generation_logs_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "inverter_installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_logs" ADD CONSTRAINT "generation_logs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;



-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- 1. Insert Default Super Admin User (Email: harshaltapre27@gmail.com | Password: Harshal.27)
INSERT INTO "User" ("id", "loginId", "email", "fullName", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
VALUES (
  '1456e267-87e7-46a7-98f0-3ca5cf783acf',
  'SADM-001',
  'harshaltapre27@gmail.com',
  'Harshal Tapre',
  '$2a$10$UMPcrjblcx0XE282xGN/tu9SPqyCnt0eq/ISN.8n8eb0JA25xZOMe',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO NOTHING;

-- 2. Insert Default Inventory Catalog Items
INSERT INTO "Inventory" ("sku", "name", "category", "inStock", "minThreshold", "supplier", "pricePerUnit", "updatedAt")
VALUES
  ('ER-3M', 'Earthing Rod with Nut Bolts 3m', 'Earthing', 100, 10, 'Swayog Internal', 0, NOW()),
  ('EDC-16-GR', 'Earthing Down Conductor 16 sq mm Green', 'Earthing', 100, 10, 'Swayog Internal', 0, NOW()),
  ('EPC-FRP', 'Earthing Pit Cover FRP', 'Earthing', 100, 10, 'Swayog Internal', 0, NOW()),
  ('EBFC-25KG', 'Earthing Backfill Compound 25 Kg Bag', 'Earthing', 100, 10, 'Swayog Internal', 0, NOW()),
  ('LA-01', 'Lightning Arrestor', 'Protection', 100, 10, 'Swayog Internal', 0, NOW()),
  ('ACC-4-CU', 'AC Cable 1C x 4 sq mm Cu Flexible', 'Cables', 100, 10, 'Swayog Internal', 0, NOW()),
  ('DCC-4-RB', 'DC Cable 4 sq mm (Red & Black)', 'Cables', 100, 10, 'Swayog Internal', 0, NOW()),
  ('SP-2X2', 'Structure Pipe 2x2', 'Structure', 100, 10, 'Swayog Internal', 0, NOW()),
  ('SP-1.5X1.5', 'Structure Pipe 1.5x1.5', 'Structure', 100, 10, 'Swayog Internal', 0, NOW()),
  ('SP-1X1', 'Structure Pipe 1x1', 'Structure', 100, 10, 'Swayog Internal', 0, NOW()),
  ('BP-01', 'Base Plate', 'Structure', 100, 10, 'Swayog Internal', 0, NOW()),
  ('AB-01', 'Anchor Bolts', 'Hardware', 100, 10, 'Swayog Internal', 0, NOW()),
  ('MR-01', 'Monorail', 'Structure', 100, 10, 'Swayog Internal', 0, NOW()),
  ('MC-01', 'Mid Clamp', 'Hardware', 100, 10, 'Swayog Internal', 0, NOW()),
  ('EC-01', 'End Clamp', 'Hardware', 100, 10, 'Swayog Internal', 0, NOW()),
  ('RV-01', 'Rivet', 'Hardware', 100, 10, 'Swayog Internal', 0, NOW()),
  ('SB-01', 'Silicon Bottle', 'Chemicals', 100, 10, 'Swayog Internal', 0, NOW()),
  ('CP-25', 'Conduit Pipe 25 mm', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('MC-25-PVC', 'Mounting Clamps 25 mm PVC', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('EL-25', '25 mm Elbow', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('T-25', '25 mm T', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('EIT-01', 'Electrical Insulation Tape', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('CT-PKT', 'Cable Tie Packet', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('FC-1IN', 'Flexible Conduit – 1 inch', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('JB-SS', 'J Bolt SS with Single Washer and Nut', 'Hardware', 100, 10, 'Swayog Internal', 0, NOW()),
  ('MC4-PR', 'MC4 Connector Pair', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('INV-01', 'Inverter', 'Electronics', 100, 10, 'Swayog Internal', 0, NOW()),
  ('DCR-PNL', 'DCR Panel', 'Electronics', 100, 10, 'Swayog Internal', 0, NOW()),
  ('ACDB-01', 'ACDB', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('DCDB-01', 'DCDB', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW()),
  ('WPL-SB', 'Waterproofing Liquid (small bottle)', 'Chemicals', 100, 10, 'Swayog Internal', 0, NOW()),
  ('DB-01', 'Dewalt Bottle', 'Tools', 100, 10, 'Swayog Internal', 0, NOW()),
  ('PVCD-01', 'PVC Duct', 'Electrical', 100, 10, 'Swayog Internal', 0, NOW())
ON CONFLICT ("sku") DO NOTHING;

-- 3. Insert Initial Active AMC Customers
INSERT INTO "Customer" ("customerCode", "fullName", "email", "phoneNumber", "city", "address", "systemSizeKw", "installationDate", "amcStatus", "clientType", "consumerNumber", "monthlyCleaningRate", "cleaningsPerMonth", "updatedAt")
VALUES
  ('CUST-001', 'Anil Sharma', 'anil.sharma@example.com', '9876543210', 'Pune', 'Flat 401, Sapphire Heights, Baner, Pune', 5.0, NOW(), 'ACTIVE', 'post_paid', 'CON-1002345', 1500, 2, NOW()),
  ('CUST-002', 'Rajesh Patel', 'rajesh.patel@example.com', '9123456780', 'Mumbai', 'B-12, Green Glen Layout, Andheri East, Mumbai', 10.0, NOW(), 'ACTIVE', 'pre_paid', 'CON-2004567', 2500, 3, NOW()),
  ('CUST-003', 'Meera Nair', 'meera.nair@example.com', '9345678901', 'Bangalore', '42, Sunrise Villa, HSR Layout, Bangalore', 8.0, NOW(), 'ACTIVE', 'corporate', 'CON-3007890', 3500, 1, NOW())
ON CONFLICT ("customerCode") DO NOTHING;
