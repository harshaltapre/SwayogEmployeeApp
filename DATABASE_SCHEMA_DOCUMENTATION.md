# Swayog Energy Dashboard - Database Schema Documentation

**Generated:** 2026-08-24  
**Database:** PostgreSQL/Neon  
**ORM:** Prisma  
**Schema File:** `backend/prisma/schema.prisma`

---

## Overview

The Swayog Energy Dashboard uses a PostgreSQL database with a comprehensive schema supporting:
- User management with role-based access control
- Task management with multi-employee assignment
- Customer and partner management
- AMC (Annual Maintenance Contract) scheduling
- Attendance tracking with face recognition
- Financial management (invoices, payments)
- Inventory management
- Inverter data integration (multiple providers)
- Notification system

---

## Core Models

### User

**Purpose:** Base user account for all system users

**Fields:**
- `id` (UUID, Primary Key): Unique user identifier
- `loginId` (String, Unique): Login username
- `employeeCode` (String, Unique): Employee code
- `email` (String, Unique): User email
- `phoneNumber` (String, Unique): User phone number
- `fullName` (String): User's full name
- `passwordHash` (String): Hashed password
- `portalPassword` (String, Optional): Portal-specific password
- `role` (UserRole): User role (SUPER_ADMIN, ADMIN, SUB_ADMIN, EMPLOYEE, PARTNER, CUSTOMER, DEPARTMENT_HEAD, TEAM_LEAD)
- `designationTitle` (String, Optional): Job designation
- `departmentId` (String, Optional): Department reference
- `reportingManagerId` (String, Optional): Reporting manager reference
- `isActive` (Boolean): Account active status
- `failedLoginAttempts` (Int): Failed login attempt counter
- `lockoutUntil` (DateTime, Optional): Account lockout expiry
- `lastFailedLoginAt` (DateTime, Optional): Last failed login timestamp
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last update timestamp
- `profileImageUrl` (String, Optional): Profile photo URL

**Relationships:**
- `department` → Department (Many-to-One)
- `reportingManager` → User (Self-referencing Many-to-One)
- `directReports` → User (Self-referencing One-to-Many)
- `customerProfile` → Customer (One-to-One)
- `employeeProfile` → EmployeeProfile (One-to-One)
- `partnerProfile` → PartnerProfile (One-to-One)
- `AttendanceRecord` → AttendanceRecord (One-to-Many)
- `checkIns` → CheckIn (One-to-Many)
- `auditLogs` → AuditLog (One-to-Many as actor)
- `receivedMessages` → Message (One-to-Many)
- `sentMessages` → Message (One-to-Many)
- `createdTasks` → Task (One-to-Many as creator)
- `assignedTasks` → Task (One-to-Many as assignee)
- `taskAssignees` → TaskAssignee (One-to-Many)
- `imageRecords` → ImageRecord (One-to-Many)
- `assignedAmcVisits` → AmcVisit (One-to-Many)
- `workSubmissions` → WorkSubmission (One-to-Many)
- `dailyCommits` → DailyCommit (One-to-Many)
- `taskAssignments` → TaskAssignment (One-to-Many)
- `taskImages` → TaskImage (One-to-Many)
- `refreshTokens` → RefreshToken (One-to-Many)
- `PerformanceSnapshot` → PerformanceSnapshot (One-to-Many)
- `faceEnrollment` → FaceEnrollment (One-to-One)

**Indexes:**
- `lockoutUntil`
- `departmentId`
- `reportingManagerId`
- `role, departmentId` (composite)

---

### Department

**Purpose:** Organizational departments

**Fields:**
- `id` (UUID, Primary Key): Department identifier
- `code` (DepartmentCode, Unique): Department code (OPERATIONS, SERVICE_MAINTENANCE, INVENTORY, FINANCE, SALES, HR)
- `name` (String, Unique): Department name
- `description` (String, Optional): Department description
- `isActive` (Boolean): Department active status
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `users` → User (One-to-Many)

---

### Task

**Purpose:** Service tasks assigned to employees

**Fields:**
- `id` (Int, Primary Key, Auto-increment): Task identifier
- `customerId` (Int, Optional): Customer reference
- `taskType` (String, Default: "REGULAR"): Task type (REGULAR, SITE_VISIT, AMC_VISIT, INSTALLATION, SERVICE, COMPLAINT, SURVEY)
- `jobType` (String): Job type/description
- `description` (String): Task description
- `customerName` (String): Customer name (denormalized)
- `customerPhone` (String): Customer phone (denormalized)
- `address` (String): Task location address
- `latitude` (Float, Optional): GPS latitude
- `longitude` (Float, Optional): GPS longitude
- `status` (TaskStatus, Default: ASSIGNED): Task status (ASSIGNED, IN_PROGRESS, COMPLETED)
- `scheduledTime` (DateTime): Scheduled execution time
- `employeeUserId` (String): Primary assigned employee
- `assignedById` (String): User who assigned the task
- `completionMessage` (String, Optional): Completion notes
- `completionDocumentUrl` (String, Optional): Completion document URL
- `taskRate` (Float, Optional): Task rate/charge
- `beforeImageUrl` (String, Optional): Before photo URL
- `beforeLatitude` (Float, Optional): Before photo GPS latitude
- `beforeLongitude` (Float, Optional): Before photo GPS longitude
- `afterImageUrl` (String, Optional): After photo URL
- `afterLatitude` (Float, Optional): After photo GPS latitude
- `afterLongitude` (Float, Optional): After photo GPS longitude
- `sitePhotos` (String[], Default: []): Site visit photo URLs
- `customerRating` (Int, Optional): Customer rating (1-5)
- `customerFeedback` (String, Optional): Customer feedback
- `fixCharges` (Float, Optional): Additional charges
- `completedAt` (DateTime, Optional): Completion timestamp
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `customer` → Customer (Many-to-One)
- `assignedBy` → User (Many-to-One)
- `employee` → User (Many-to-One)
- `taskAssignees` → TaskAssignee (One-to-Many)
- `imageRecords` → ImageRecord (One-to-Many)
- `workSubmissions` → WorkSubmission (One-to-Many)
- `taskAssignments` → TaskAssignment (One-to-Many)
- `taskImages` → TaskImage (One-to-Many)
- `payments` → Payment (One-to-Many)

**Indexes:**
- `customerId`
- `taskType`
- `employeeUserId`
- `assignedById`
- `status`
- `scheduledTime`
- `employeeUserId, status` (composite)
- `employeeUserId, scheduledTime` (composite)

---

### TaskAssignee

**Purpose:** Multi-employee task assignment support

**Fields:**
- `id` (UUID, Primary Key): Assignment identifier
- `taskId` (Int): Task reference
- `userId` (String): Employee reference
- `role` (String, Optional): Assignment role
- `status` (String, Default: "assigned"): Assignment status
- `createdAt` (DateTime): Assignment timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `task` → Task (Many-to-One)
- `user` → User (Many-to-One)

**Indexes:**
- `taskId`
- `userId`
- `taskId, userId` (composite unique)

---

### TaskImage

**Purpose:** Task images with GPS and metadata

**Fields:**
- `id` (UUID, Primary Key): Image identifier
- `taskId` (Int): Task reference
- `employeeUserId` (String): Uploader reference
- `type` (String): Image type (before, after, site-visit, site_photo_1, etc.)
- `url` (String): Image URL (R2 or local)
- `objectKey` (String, Optional): R2 object key
- `fileName` (String, Optional): Original filename
- `mimeType` (String, Optional): MIME type (image/jpeg, image/png, etc.)
- `fileSize` (Int, Optional): File size in bytes
- `latitude` (Float, Optional): GPS latitude
- `longitude` (Float, Optional): GPS longitude
- `watermarkText` (String, Optional): Watermark text
- `uploadedAt` (DateTime): Upload timestamp

**Relationships:**
- `task` → Task (Many-to-One)
- `employee` → User (Many-to-One)

**Indexes:**
- `taskId`
- `employeeUserId`
- `type`
- `objectKey`

---

### ImageRecord

**Purpose:** Legacy image records (being phased out in favor of TaskImage)

**Fields:**
- `id` (UUID, Primary Key): Image identifier
- `taskId` (Int): Task reference
- `uploadedBy` (String): Uploader reference
- `type` (String): Image type
- `url` (String): Image URL
- `watermarkedUrl` (String, Optional): Watermarked URL
- `exif` (Json, Optional): EXIF metadata
- `latitude` (Float, Optional): GPS latitude
- `longitude` (Float, Optional): GPS longitude
- `takenAt` (DateTime, Optional): Capture timestamp
- `createdAt` (DateTime): Upload timestamp

**Relationships:**
- `task` → Task (Many-to-One)
- `user` → User (Many-to-One)

**Indexes:**
- `taskId`
- `uploadedBy`

---

### RefreshToken

**Purpose:** JWT refresh token management

**Fields:**
- `id` (UUID, Primary Key): Token identifier
- `userId` (String): User reference
- `tokenHash` (String): Hashed token
- `expiresAt` (DateTime): Token expiry
- `revokedAt` (DateTime, Optional): Revocation timestamp
- `createdAt` (DateTime): Creation timestamp

**Relationships:**
- `user` → User (Many-to-One)

**Indexes:**
- `userId`
- `expiresAt`

---

### AuditLog

**Purpose:** System audit trail

**Fields:**
- `id` (UUID, Primary Key): Log entry identifier
- `actorId` (String, Optional): Actor user reference
- `action` (String): Action performed
- `entity` (String): Entity type
- `entityId` (String, Optional): Entity identifier
- `metadata` (Json, Optional): Additional metadata
- `createdAt` (DateTime): Log timestamp

**Relationships:**
- `actor` → User (Many-to-One)

**Indexes:**
- `actorId`
- `entity, entityId, action` (composite)

---

## Customer Management

### Customer

**Purpose:** Customer records with inverter credentials

**Fields:**
- `id` (Int, Primary Key, Auto-increment): Customer identifier
- `customerCode` (String, Unique): Customer code
- `fullName` (String): Customer name
- `email` (String): Customer email
- `phoneNumber` (String): Customer phone
- `city` (String): Customer city
- `state` (String, Optional): Customer state
- `address` (String): Customer address
- `systemSizeKw` (Float): Solar system size in kW
- `projectType` (String, Optional): Project type
- `installationDate` (DateTime): Installation date
- `warrantyExpiry` (DateTime, Optional): Warranty expiry
- `panelBrand` (String, Optional): Panel brand
- `inverterBrand` (String, Optional): Inverter brand
- `inverterName` (String, Optional): Inverter name
- `inverterModel` (String, Optional): Inverter model
- `inverterUid` (String, Optional): Inverter UID
- `monitoringProvider` (String, Optional): Monitoring provider
- `monitoringPortalUrl` (String, Optional): Monitoring portal URL
- `monitoringPlantId` (String, Optional): Monitoring plant ID
- `monitoringStatus` (String, Optional): Monitoring status
- `monitoringLastDataAt` (DateTime, Optional): Last data timestamp
- `monitoringLastSyncAt` (DateTime, Optional): Last sync timestamp
- `monitoringLastError` (String, Optional): Last error message
- `amcStatus` (CustomerAmcStatus, Default: NONE): AMC status (ACTIVE, EXPIRED, NONE)
- `amcExpiryDate` (DateTime, Optional): AMC expiry
- `status` (CustomerStatus, Default: ACTIVE): Customer status (ACTIVE, INACTIVE)
- `partnerId` (String, Optional): Partner reference
- `userId` (String, Optional, Unique): User reference (for customer portal)
- `projectStage` (Int, Default: 0): Project stage
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp
- `cleaningWindow1` (String, Default: "1-10"): First cleaning window
- `cleaningWindow2` (String, Default: "11-20"): Second cleaning window
- `cleaningWindow3` (String, Default: "21-30"): Third cleaning window
- `cleaningsPerMonth` (Int, Default: 1): Cleanings per month
- `clientType` (String, Default: "post_paid"): Client type
- `consumerNumber` (String, Optional): Consumer number
- `contractEndDate` (DateTime, Optional): Contract end
- `contractStartDate` (DateTime, Optional): Contract start
- `monthlyCleaningRate` (Float, Optional): Monthly cleaning rate
- `paymentTerms` (String, Optional): Payment terms
- `remarks` (String, Optional): Remarks
- `cleaningWindow4` (String, Optional): Fourth cleaning window
- `cleaningWindow5` (String, Optional): Fifth cleaning window
- `cleaningWindow6` (String, Optional): Sixth cleaning window
- `cleaningWindow7` (String, Optional): Seventh cleaning window
- `cleaningWindow8` (String, Optional): Eighth cleaning window
- `assignedEmployeeId` (String, Optional): Assigned employee
- `commissionAmount` (Float, Optional): Commission amount
- `commissionStatus` (CommissionStatus, Default: PENDING): Commission status (PENDING, COMPLETED)
- `commissionProofUrl` (String, Optional): Commission proof URL
- `commissionPaidAt` (DateTime, Optional): Commission paid timestamp
- `partnerLeadStatus` (String, Default: "PENDING"): Partner lead status
- `assignedEpc` (String, Optional): Assigned EPC
- `epcAssignmentStatus` (String, Optional): EPC assignment status
- `inverterLoginId` (String, Optional): Inverter login ID
- `inverterPassword` (String, Optional): Inverter password
- `inverterApiKey` (String, Optional): Inverter API key
- `inverterDeviceSn` (String, Optional): Inverter device serial number
- `dataLoggerSrNo` (String, Optional): Data logger serial number
- `inverterSrNo` (String, Optional): Inverter serial number
- `portalPassword` (String, Optional): Portal password
- `latitude` (Float, Optional): GPS latitude
- `longitude` (Float, Optional): GPS longitude

**Relationships:**
- `partner` → PartnerProfile (Many-to-One)
- `user` → User (One-to-One)
- `apartment` → Apartment (Many-to-One)
- `AmcContract` → AmcContract (One-to-Many)
- `AmcVisit` → AmcVisit (One-to-Many)
- `Invoice` → Invoice (One-to-Many)
- `serviceRequests` → ServiceRequest (One-to-Many)
- `dispatchRecords` → DispatchRecord (One-to-Many)
- `waareeGeneration` → WaareeGeneration (One-to-One)
- `inverterCache` → InverterCache (One-to-One)
- `notifications` → CustomerNotification (One-to-Many)
- `tasks` → Task (One-to-Many)
- `inverterInstallations` → InverterInstallation (One-to-Many)
- `generationLogs` → GenerationLog (One-to-Many)
- `payments` → Payment (One-to-Many)

**Indexes:**
- `partnerId`
- `status`
- `amcStatus`

---

### Apartment

**Purpose:** Apartment/grouping for customers

**Fields:**
- `id` (Int, Primary Key, Auto-increment): Apartment identifier
- `name` (String): Apartment name
- `address` (String): Apartment address
- `city` (String, Default: "Pune"): City
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `customers` → Customer (One-to-Many)

---

### ServiceRequest

**Purpose:** Customer service requests/complaints

**Fields:**
- `id` (Int, Primary Key, Auto-increment): Request identifier
- `customerId` (Int): Customer reference
- `title` (String): Request title
- `description` (String): Request description
- `address` (String, Optional): Service address
- `latitude` (Float, Optional): GPS latitude
- `longitude` (Float, Optional): GPS longitude
- `status` (ServiceRequestStatus, Default: PENDING): Status (PENDING, SCHEDULED, COMPLETED, CANCELLED)
- `scheduledDate` (String, Optional): Scheduled date
- `scheduledTime` (String, Optional): Scheduled time
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `customer` → Customer (Many-to-One)

**Indexes:**
- `customerId`
- `status`

---

## AMC Management

### AmcContract

**Purpose:** Annual Maintenance Contract records

**Fields:**
- `id` (String, Primary Key): Contract identifier
- `customerId` (Int): Customer reference
- `state` (String): Contract state
- `annualFeeInr` (Int): Annual fee in INR
- `startDate` (DateTime): Contract start
- `renewalDate` (DateTime): Contract renewal
- `isActive` (Boolean, Default: true): Active status
- `isRenewed` (Boolean, Default: false): Renewed status
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `Customer` → Customer (Many-to-One)

**Indexes:**
- `customerId`
- `renewalDate`
- `state`

---

### AmcVisit

**Purpose:** Scheduled AMC cleaning/maintenance visits

**Fields:**
- `id` (String, Primary Key, UUID): Visit identifier
- `customerId` (Int): Customer reference
- `scheduledDate` (DateTime): Scheduled date
- `status` (AmcVisitStatus, Default: PENDING): Status (PENDING, COMPLETED, CANCELLED)
- `completedAt` (DateTime, Optional): Completion timestamp
- `notes` (String, Optional): Visit notes
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp
- `assignedEmployeeId` (String, Optional): Assigned employee
- `cleaningNumber` (Int, Optional): Cleaning number (1-4)
- `timeSlot` (String, Optional): Time slot (e.g., "09:00")
- `completedByEmployeeId` (String, Optional): Completed by employee
- `completedByName` (String, Optional): Completed by name (denormalized)
- `visitNotes` (String, Optional): Visit notes
- `beforeImageUrl` (String, Optional): Before photo URL
- `afterImageUrl` (String, Optional): After photo URL

**Relationships:**
- `customer` → Customer (Many-to-One)
- `assignedEmployee` → User (Many-to-One)

**Indexes:**
- `customerId`
- `scheduledDate`
- `status`
- `assignedEmployeeId`
- `assignedEmployeeId, status` (composite)
- `assignedEmployeeId, scheduledDate` (composite)

---

## Financial Management

### Invoice

**Purpose:** Billing invoices

**Fields:**
- `id` (String, Primary Key, UUID): Invoice identifier
- `invoiceNumber` (String, Optional): Invoice number
- `customerId` (Int): Customer reference
- `invoiceType` (InvoiceType, Default: INSTALLATION): Type (INSTALLATION, AMC, REPAIR, SERVICE, OTHER)
- `amount` (Float): Invoice amount
- `paymentStatus` (InvoicePaymentStatus, Default: PENDING): Status (PENDING, PAID, FAILED, CANCELLED)
- `amountPaid` (Float, Default: 0): Amount paid
- `invoiceDate` (DateTime, Default: now): Invoice date
- `paymentDate` (DateTime, Optional): Payment date
- `zone` (String, Optional): Zone
- `state` (String, Optional): State
- `partnerId` (String, Optional): Partner reference
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp
- `description` (String, Optional): Description
- `paymentMethod` (String, Optional): Payment method
- `proofUrl` (String, Optional): Payment proof URL

**Relationships:**
- `Customer` → Customer (Many-to-One)
- `PartnerProfile` → PartnerProfile (Many-to-One)

**Indexes:**
- `customerId`
- `invoiceDate`
- `partnerId`
- `paymentStatus`
- `zone`
- `partnerId, invoiceDate` (composite)
- `customerId, invoiceDate` (composite)

---

### PartnerInstall

**Purpose:** Partner installation tracking

**Fields:**
- `id` (String, Primary Key): Install identifier
- `partnerId` (String): Partner reference
- `invoiceId` (String): Invoice reference
- `installDate` (DateTime): Installation date
- `commissionInr` (Int): Commission in INR
- `createdAt` (DateTime): Creation timestamp

**Relationships:**
- `PartnerProfile` → PartnerProfile (Many-to-One)

**Indexes:**
- `invoiceId`
- `partnerId`

---

### Payment

**Purpose:** Payment records

**Fields:**
- `id` (String, Primary Key, UUID): Payment identifier
- `taskId` (Int): Task reference
- `customerId` (Int): Customer reference
- `amount` (Float): Payment amount
- `paymentMethod` (String, Optional): Payment method (upi, bank_transfer, cash, etc.)
- `paymentStatus` (PaymentStatus, Default: PENDING): Status (PENDING, COMPLETED, FAILED, REFUNDED)
- `transactionId` (String, Optional, Unique): Transaction ID
- `paidBy` (String, Optional): Payer name/reference
- `paidAt` (DateTime, Optional): Payment timestamp
- `processedBy` (String, Optional): Processor user ID
- `notes` (String, Optional): Notes
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `task` → Task (Many-to-One)
- `customer` → Customer (Many-to-One)

**Indexes:**
- `taskId`
- `customerId`
- `paymentStatus`
- `paidAt`
- `customerId, paymentStatus` (composite)

---

### Expense

**Purpose:** Expense tracking

**Fields:**
- `id` (String, Primary Key): Expense identifier
- `category` (String): Expense category
- `amount` (Int): Expense amount
- `expenseDate` (DateTime): Expense date
- `zone` (String, Optional): Zone
- `notes` (String, Optional): Notes
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes:**
- `category`
- `expenseDate`

---

## Attendance Management

### AttendanceRecord

**Purpose:** Daily attendance records

**Fields:**
- `id` (String, Primary Key, UUID): Record identifier
- `employeeId` (String): Employee reference
- `date` (DateTime, Date): Attendance date
- `checkInTime` (DateTime, Optional): Check-in time
- `checkOutTime` (DateTime, Optional): Check-out time
- `totalMinutes` (Int, Optional): Total minutes worked
- `status` (AttendanceStatus, Default: PRESENT): Status (PRESENT, ABSENT, HALF_DAY, LATE, LEAVE)
- `notes` (String, Optional): Notes
- `reviewedBy` (String, Optional): Reviewer reference
- `manualOverride` (Boolean, Default: false): Manual override flag
- `overrideReason` (String, Optional): Override reason
- `flagged` (Boolean, Default: false): Flagged for review
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `employee` → User (Many-to-One)

**Indexes:**
- `employeeId, date` (composite unique)
- `date`
- `employeeId`
- `flagged`

---

### CheckIn

**Purpose:** Check-in records with face recognition

**Fields:**
- `id` (String, Primary Key, CUID): Check-in identifier
- `employeeId` (String): Employee reference
- `selfieUrl` (String, Optional): Selfie URL
- `latitude` (Float, Optional): GPS latitude
- `longitude` (Float, Optional): GPS longitude
- `status` (CheckInStatus, Default: CHECKED_IN): Status (CHECKED_IN, CHECKED_OUT)
- `matchConfidence` (Float, Optional): Face match confidence (0-1)
- `matchDistance` (Float, Optional): Face match distance
- `livenessVerified` (Boolean, Default: false): Liveness verification
- `manualOverride` (Boolean, Default: false): Manual override flag
- `overrideReason` (String, Optional): Override reason
- `reviewedBy` (String, Optional): Reviewer reference
- `flagged` (Boolean, Default: false): Flagged for review
- `createdAt` (DateTime): Creation timestamp

**Relationships:**
- `employee` → User (Many-to-One)

**Indexes:**
- `employeeId`
- `createdAt`
- `flagged`

---

### FaceEnrollment

**Purpose:** Face recognition enrollment data

**Fields:**
- `id` (String, Primary Key, UUID): Enrollment identifier
- `employeeId` (String, Unique): Employee reference
- `descriptor1` (Json): Face descriptor 1 (128-dim float array)
- `descriptor2` (Json): Face descriptor 2 (128-dim float array)
- `descriptor3` (Json): Face descriptor 3 (128-dim float array)
- `enrolledAt` (DateTime): Enrollment timestamp
- `updatedAt` (DateTime): Last update timestamp
- `modelVersion` (String, Default: "face-api-ssd-mobilenetv1-v1"): Model version

**Relationships:**
- `employee` → User (Many-to-One)

**Indexes:**
- `employeeId`

---

### PerformanceSnapshot

**Purpose:** Monthly performance snapshots

**Fields:**
- `id` (String, Primary Key, UUID): Snapshot identifier
- `employeeId` (String): Employee reference
- `month` (Int): Month (1-12)
- `year` (Int): Year
- `attendancePercent` (Float, Default: 0): Attendance percentage
- `taskCompletionRate` (Float, Default: 0): Task completion rate
- `avgWorkScore` (Float, Default: 0): Average work score
- `totalHoursLogged` (Float, Default: 0): Total hours logged
- `performanceScore` (Float, Default: 0): Overall performance score
- `daysPresent` (Int, Default: 0): Days present
- `daysAbsent` (Int, Default: 0): Days absent
- `tasksAssigned` (Int, Default: 0): Tasks assigned
- `tasksCompleted` (Int, Default: 0): Tasks completed
- `workSubmissions` (Int, Default: 0): Work submissions
- `calculatedAt` (DateTime): Calculation timestamp
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `employee` → User (Many-to-One)

**Indexes:**
- `employeeId, month, year` (composite unique)
- `employeeId`

---

### WorkSubmission

**Purpose:** Work submissions by employees

**Fields:**
- `id` (String, Primary Key, UUID): Submission identifier
- `employeeId` (String): Employee reference
- `taskId` (Int, Optional): Task reference
- `title` (String): Submission title
- `description` (String): Submission description
- `proofUrl` (String, Optional): Proof URL
- `proofNotes` (String, Optional): Proof notes
- `hoursSpent` (Float, Default: 0): Hours spent
- `submittedAt` (DateTime): Submission timestamp
- `reviewedAt` (DateTime, Optional): Review timestamp
- `reviewedBy` (String, Optional): Reviewer reference
- `reviewScore` (Int, Optional): Review score
- `reviewNotes` (String, Optional): Review notes
- `status` (WorkStatus, Default: PENDING): Status (PENDING, APPROVED, REJECTED, REVISION)
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `employee` → User (Many-to-One)
- `task` → Task (Many-to-One)

**Indexes:**
- `employeeId`
- `status`

---

### DailyCommit

**Purpose:** Daily work commits

**Fields:**
- `id` (String, Primary Key, UUID): Commit identifier
- `employeeId` (String): Employee reference
- `commitDate` (DateTime, Date): Commit date
- `taskWorkedOn` (String): Task worked on
- `workSummary` (String): Work summary
- `hoursSpent` (Float): Hours spent
- `issuesBlockers` (String, Optional): Issues/blockers
- `tomorrowPlan` (String, Optional): Tomorrow's plan
- `attachmentUrl` (String, Optional): Attachment URL
- `submittedAt` (DateTime): Submission timestamp
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `employee` → User (Many-to-One)

**Indexes:**
- `employeeId, commitDate` (composite unique)
- `employeeId`
- `commitDate`

---

## User Profiles

### EmployeeProfile

**Purpose:** Employee-specific profile data

**Fields:**
- `id` (String, Primary Key, UUID): Profile identifier
- `userId` (String, Unique): User reference
- `partnerId` (String, Optional): Partner reference
- `jobRole` (String, Default: "field_technician"): Job role
- `zone` (String, Optional): Zone/region
- `monthlySalaryInr` (Int, Optional): Monthly salary in INR
- `isActive` (Boolean, Default: true): Active status
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `partner` → PartnerProfile (Many-to-One)
- `user` → User (Many-to-One)

**Indexes:**
- `partnerId`
- `userId`

---

### PartnerProfile

**Purpose:** Partner-specific profile data

**Fields:**
- `id` (String, Primary Key, UUID): Profile identifier
- `userId` (String, Unique): User reference
- `businessName` (String, Optional): Business name
- `serviceZone` (String, Optional): Service zone
- `isActive` (Boolean, Default: true): Active status
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `customers` → Customer (One-to-Many)
- `employees` → EmployeeProfile (One-to-Many)
- `Invoice` → Invoice (One-to-Many)
- `PartnerInstall` → PartnerInstall (One-to-Many)
- `user` → User (Many-to-One)

**Indexes:**
- `userId`

---

## Inventory Management

### Inventory

**Purpose:** Inventory items

**Fields:**
- `id` (Int, Primary Key, Auto-increment): Item identifier
- `sku` (String, Unique): SKU code
- `name` (String): Item name
- `category` (String): Item category
- `inStock` (Int, Default: 0): Stock quantity
- `minThreshold` (Int, Default: 0): Minimum threshold
- `supplier` (String, Optional): Supplier
- `pricePerUnit` (Float, Default: 0): Price per unit
- `entryDate` (DateTime, Default: now): Entry date
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `dispatches` → DispatchRecord (One-to-Many)

---

### DispatchRecord

**Purpose:** Material dispatch records

**Fields:**
- `id` (String, Primary Key, UUID): Dispatch identifier
- `customerId` (Int): Customer reference
- `itemId` (Int): Inventory item reference
- `quantity` (Int): Dispatch quantity
- `dispatchedAt` (DateTime, Default: now): Dispatch timestamp
- `notes` (String, Optional): Notes
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `customer` → Customer (Many-to-One)
- `item` → Inventory (Many-to-One)

**Indexes:**
- `customerId`
- `itemId`

---

## Inverter Data

### InverterInstallation

**Purpose:** Multi-inverter system support

**Fields:**
- `id` (Int, Primary Key, Auto-increment): Installation identifier
- `customerId` (Int): Customer reference
- `brand` (InverterProviderType): Inverter brand (K_SOLAR, GROWATT, FOXESS, UTL, SOLARMAN, SOLIS, WAAREE, PV_BLINK, PANASONIC, ANCHOR, UPS_SOLAR, HAVELLS, VSOLE, WARI, SOLACE, HEAVEN, QUALICAP, ONE, GENERIC_REST, MANUAL)
- `model` (String, Optional): Inverter model
- `serialNumber` (String, Optional): Serial number
- `capacity` (Float, Optional): Capacity in kW
- `loginId` (String, Optional): Login ID
- `password` (String, Optional): Password
- `apiKey` (String, Optional): API key
- `deviceSn` (String, Optional): Device serial number
- `plantId` (String, Optional): Plant ID
- `portalUrl` (String, Optional): Portal URL
- `isActive` (Boolean, Default: true): Active status
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `customer` → Customer (Many-to-One)

---

### GenerationLog

**Purpose:** Historical generation data

**Fields:**
- `id` (Int, Primary Key, Auto-increment): Log identifier
- `customerId` (Int): Customer reference
- `date` (DateTime): Generation date
- `dailyGeneration` (Float, Default: 0): Daily generation in kWh
- `dataSource` (GenerationDataSource): Data source (LIVE_API, CACHE, DB_SCHEDULER, MANUAL, ESTIMATED, SIMULATED)
- `createdAt` (DateTime): Creation timestamp

**Relationships:**
- `customer` → Customer (Many-to-One)

 **Indexes:**
- `customerId`
- `date`

---

### InverterCache

**Purpose:** Cached inverter data

**Fields:**
- `customerId` (Int, Primary Key): Customer reference
- `summaryData` (Json): Summary data
- `updatedAt` (DateTime, Default: now): Last update timestamp

**Relationships:**
- `customer` → Customer (Many-to-One)

---

### GrowattCustomer

**Purpose:** Growatt-specific customer data

**Fields:**
- `id` (Int, Primary Key, Auto-increment): Customer identifier
- `customerName` (String): Customer name
- `apiToken` (String): Encrypted API token (AES-256-GCM)
- `plantId` (String, Unique): Plant ID
- `plantName` (String): Plant name
- `plantCapacity` (Float): Plant capacity
- `plantLocation` (String): Plant location
- `inverterSn` (String, Optional): Inverter serial number
- `isActive` (Boolean, Default: true): Active status
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- `generations` → GrowattGeneration (One-to-Many)

---

### GrowattGeneration

**Purpose:** Growatt generation data

**Fields:**
- `id` (Int, Primary Key, Auto-increment): Generation identifier
- `growattCustomerId` (Int): Growatt customer reference
- `todayGeneration` (Float, Default: 0): Today's generation
- `monthlyGeneration` (Float, Default: 0): Monthly generation
- `yearlyGeneration` (Float, Default: 0): Yearly generation
- `totalGeneration` (Float, Default: 0): Total generation
- `currentPower` (Float, Default: 0): Current power
- `status` (String, Default: "offline"): Status (online/offline)
- `lastUpdated` (DateTime, Default: now): Last update timestamp

**Relationships:**
- `growattCustomer` → GrowattCustomer (Many-to-One)

**Indexes:**
- `growattCustomerId`

---

### WaareeGeneration

**Purpose:** Waaree-specific generation data

**Fields:**
- `id` (Int, Primary Key, Auto-increment): Generation identifier
- `customerId` (Int, Unique): Customer reference
- `todayGeneration` (Float, Default: 0): Today's generation
- `monthlyGeneration` (Float, Default: 0): Monthly generation
- `yearlyGeneration` (Float, Default: 0): Yearly generation
- `totalGeneration` (Float, Default: 0): Total generation
- `currentPower` (Float, Default: 0): Current power
- `status` (String, Default: "offline"): Status (online/offline)
- `lastUpdated` (DateTime, Default: now): Last update timestamp

**Relationships:**
- `customer` → Customer (Many-to-One)

**Indexes:**
- `customerId`

---

## Notifications

### AdminNotification

**Purpose:** Admin notifications

**Fields:**
- `id` (String, Primary Key, CUID): Notification identifier
- `type` (String): Notification type
- `message` (String): Notification message
- `imageUrl` (String, Optional): Image URL
- `employeeId` (String): Employee reference
- `read` (Boolean, Default: false): Read status
- `createdAt` (DateTime): Creation timestamp

**Indexes:**
- `employeeId`
- `type`
- `createdAt`

---

### CustomerNotification

**Purpose:** Customer notifications

**Fields:**
- `id` (String, Primary Key, UUID): Notification identifier
- `customerId` (Int): Customer reference
- `type` (String): Notification type
- `message` (String): Notification message
- `taskId` (Int, Optional): Task reference
- `imageUrl` (String, Optional): Image URL
- `isRead` (Boolean, Default: false): Read status
- `createdAt` (DateTime): Creation timestamp

**Relationships:**
- `customer` → Customer (Many-to-One)

**Indexes:**
- `customerId`
- `type`
- `createdAt`
- `taskId`

---

## Messaging

### Message

**Purpose:** User-to-user messaging

**Fields:**
- `id` (Int, Primary Key, Auto-increment): Message identifier
- `senderId` (String): Sender reference
- `receiverId` (String): Receiver reference
- `content` (String): Message content
- `isRead` (Boolean, Default: false): Read status
- `createdAt` (DateTime): Creation timestamp

**Relationships:**
- `receiver` → User (Many-to-One)
- `sender` → User (Many-to-One)

---

## System Configuration

### AttendanceRule

**Purpose:** Attendance system rules

**Fields:**
- `id` (String, Primary Key, Default: "default"): Rule identifier
- `shiftStart` (String, Default: "09:15"): Shift start time
- `officeLat` (Float, Default: 18.5204): Office latitude
- `officeLng` (Float, Default: 73.8567): Office longitude
- `officeRadius` (Float, Default: 150.0): Office radius in meters
- `faceRequired` (Boolean, Default: true): Face required
- `geofenceEnabled` (Boolean, Default: false): Geofence enabled
- `faceMatchThreshold` (Float, Default: 0.55): Face match threshold
- `updatedAt` (DateTime): Last update timestamp

---

### IsphereGreenEntry

**Purpose:** iSphere Green directory entries

**Fields:**
- `id` (String, Primary Key, UUID): Entry identifier
- `category` (String): Category
- `subcategory` (String): Subcategory
- `name` (String): Name
- `place` (String): Place
- `phone` (String, Optional): Phone
- `email` (String, Optional): Email
- `address` (String, Optional): Address
- `details` (Json, Optional): Additional details
- `status` (String, Default: "ACTIVE"): Status
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes:**
- `category`
- `subcategory`

---

## Enums

### UserRole
```
SUPER_ADMIN
ADMIN
SUB_ADMIN
EMPLOYEE
PARTNER
CUSTOMER
DEPARTMENT_HEAD
TEAM_LEAD
```

### DepartmentCode
```
OPERATIONS
SERVICE_MAINTENANCE
INVENTORY
FINANCE
SALES
HR
```

### CustomerAmcStatus
```
ACTIVE
EXPIRED
NONE
```

### CustomerStatus
```
ACTIVE
INACTIVE
```

### TaskStatus
```
ASSIGNED
IN_PROGRESS
COMPLETED
```

### CommissionStatus
```
PENDING
COMPLETED
```

### AttendanceStatus
```
PRESENT
ABSENT
HALF_DAY
LATE
LEAVE
```

### WorkStatus
```
PENDING
APPROVED
REJECTED
REVISION
```

### ServiceRequestStatus
```
PENDING
SCHEDULED
COMPLETED
CANCELLED
```

### AmcVisitStatus
```
PENDING
COMPLETED
CANCELLED
```

### TaskAssignmentStatus
```
ASSIGNED
IN_PROGRESS
COMPLETED
```

### InvoicePaymentStatus
```
PENDING
PAID
FAILED
CANCELLED
```

### InvoiceType
```
INSTALLATION
AMC
REPAIR
SERVICE
OTHER
```

### PaymentStatus
```
PENDING
COMPLETED
FAILED
REFUNDED
```

### CheckInStatus
```
CHECKED_IN
CHECKED_OUT
```

### InverterProviderType
```
K_SOLAR
GROWATT
FOXESS
UTL
SOLARMAN
SOLIS
WAAREE
PV_BLINK
PANASONIC
ANCHOR
UPS_SOLAR
HAVELLS
VSOLE
WARI
SOLACE
HEAVEN
QUALICAP
ONE
GENERIC_REST
MANUAL
```

### GenerationDataSource
```
LIVE_API
CACHE
DB_SCHEDULER
MANUAL
ESTIMATED
SIMULATED
```

---

## Database Relationships Summary

### User Hierarchy
- User → User (self-referencing via reportingManagerId)
- User → Department (via departmentId)
- User → EmployeeProfile (one-to-one)
- User → PartnerProfile (one-to-one)
- User → Customer (one-to-one)

### Task Assignment
- Task → User (employeeUserId - primary assignee)
- Task → User (assignedById - creator)
- Task → Customer (customerId)
- Task → TaskAssignee (multi-employee support)
- Task → TaskImage (before/after/site photos)

### AMC Management
- Customer → AmcContract (one-to-many)
- Customer → AmcVisit (one-to-many)
- AmcVisit → User (assignedEmployeeId)

### Financial
- Customer → Invoice (one-to-many)
- Invoice → Payment (one-to-many)
- Task → Payment (one-to-many)

### Attendance
- User → AttendanceRecord (one-to-many)
- User → CheckIn (one-to-many)
- User → FaceEnrollment (one-to-one)
- User → PerformanceSnapshot (one-to-many)

### Inventory
- Inventory → DispatchRecord (one-to-many)
- Customer → DispatchRecord (one-to-many)

---

## Index Summary

**Performance-Critical Indexes:**
- User: role, departmentId, reportingManagerId
- Task: employeeUserId, status, scheduledTime, customerId
- TaskAssignee: taskId, userId
- AttendanceRecord: employeeId, date
- Customer: partnerId, amcStatus, status
- AmcVisit: customerId, scheduledDate, assignedEmployeeId
- Invoice: customerId, paymentStatus, invoiceDate
- Payment: customerId, paymentStatus, paidAt

**Unique Constraints:**
- User: loginId, email, phoneNumber, employeeCode
- Customer: customerCode
- TaskAssignee: taskId, userId
- AttendanceRecord: employeeId, date
- DailyCommit: employeeId, commitDate
- PerformanceSnapshot: employeeId, month, year
- FaceEnrollment: employeeId
- EmployeeProfile: userId
- PartnerProfile: userId
- GrowattCustomer: plantId
- WaareeGeneration: customerId
