# R2 Integration Architecture Report
## SWAYOG Energy Web Dashboard - Current Architecture Analysis

**Date:** August 24, 2026  
**Purpose:** Analyze existing codebase architecture before implementing Cloudflare R2 Object Storage integration

---

## 1. PROJECT OVERVIEW

### Frontend Stack
- **Framework:** React 18.3.1 with Vite 5.4.0
- **Language:** TypeScript 5.6.3
- **Routing:** Wouter 3.3.5
- **Styling:** Tailwind CSS 4.1.14
- **UI Components:** Radix UI (multiple packages)
- **State Management:** Zustand 4.5.2
- **Data Fetching:** TanStack React Query 5.90.21
- **Forms:** React Hook Form 7.55.0 with Zod 3.25.76
- **Charts:** Recharts 2.15.2
- **Maps:** React Leaflet 4.2.1
- **Date Handling:** date-fns 3.6.0

### Backend Stack
- **Framework:** Express.js 4.21.2 with TypeScript 5.8.2
- **Database:** Neon PostgreSQL via Prisma ORM 6.19.3
- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **File Uploads:** Multer 2.1.1
- **Image Processing:** Sharp 0.32.1
- **EXIF Parsing:** exif-parser 0.1.12
- **Caching:** Redis 4.7.0 (optional)
- **Security:** Helmet 8.2.0, CORS 2.8.5
- **Environment:** dotenv 16.3.1 with Zod validation

### Deployment
- **Platform:** Vercel
- **Build:** esbuild for serverless bundling
- **Environment:** Production-oriented with serverless-http adapter

---

## 2. CURRENT IMAGE STORAGE ARCHITECTURE

### 2.1 Storage Location
**Local Filesystem:**
- Directory: `uploads/task-images/`
- Base path: `process.cwd() + "/uploads/task-images"`
- Static serving: `app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))`

### 2.2 Database Schema

#### Task Model (Prisma)
```prisma
model Task {
  id                    Int              @id @default(autoincrement())
  beforeImageUrl        String?          // Local path: /uploads/task-images/filename.jpg
  beforeLatitude        Float?
  beforeLongitude       Float?
  afterImageUrl         String?          // Local path: /uploads/task-images/filename.jpg
  afterLatitude         Float?
  afterLongitude        Float?
  sitePhotos            String[]         @default([])  // Array of local paths
  // ... other fields
}
```

#### TaskImage Model (Prisma)
```prisma
model TaskImage {
  id           String   @id @default(uuid())
  taskId       Int
  employeeUserId String
  type         String   // "before" or "after"
  url          String   // Local path: /uploads/task-images/filename.jpg
  latitude     Float?
  longitude    Float?
  watermarkText String?
  uploadedAt   DateTime @default(now())
  task         Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  employee     User     @relation(fields: [employeeUserId], references: [id], onDelete: Cascade)
}
```

#### ImageRecord Model (Prisma)
```prisma
model ImageRecord {
  id             String   @id @default(uuid())
  taskId         Int
  uploadedBy     String
  type           String
  url            String   // Local path
  watermarkedUrl String?
  exif           Json?
  latitude       Float?
  longitude      Float?
  takenAt        DateTime?
  createdAt      DateTime @default(now())
  // ... relations
}
```

#### AmcVisit Model (Prisma)
```prisma
model AmcVisit {
  beforeImageUrl        String?
  afterImageUrl         String?
  sitePhotos            String[]   // Additional field for site visit photos
  // ... other fields
}
```

### 2.3 Current Upload Implementation

#### File: `backend/src/routes/taskImages.ts`
- **Multer Configuration:** Disk storage to `uploads/task-images/`
- **File Naming:** `{fieldname}-{timestamp}-{random}.{ext}`
- **File Size Limit:** 10MB
- **Allowed Types:** jpeg, jpg, png, gif
- **Watermarking:** Uses Sharp to add employee name, timestamp, GPS coordinates
- **Watermarked Path:** Original filename with `-watermarked.png` suffix

#### File: `backend/src/modules/tasks/tasks.service.ts`
- **Function:** `processAndSaveBase64Photos()`
- **Purpose:** Converts base64 strings to local files
- **Naming:** `site_photo_{taskId}_{timestamp}_{index}_{random}.{ext}`
- **Storage:** Saves to `uploads/task-images/` directory
- **Returns:** Local path string: `/uploads/task-images/{filename}`

### 2.4 Current Image Upload Flow

```
Employee Upload
    ↓
Multer receives multipart/form-data
    ↓
File saved to uploads/task-images/
    ↓
Sharp adds watermark (employee name, timestamp, GPS)
    ↓
Watermarked file saved
    ↓
Database stores local path in TaskImage/Task model
    ↓
Static route serves images at /uploads/
```

---

## 3. TASK WORKFLOW & IMAGE REQUIREMENTS

### 3.1 Task Types Configuration

**File:** `backend/src/modules/tasks/task-type.config.ts`

```typescript
export const TASK_TYPE_CONFIG: Record<TaskTypeKey, TaskTypeConfig> = {
  AMC_VISIT: {
    key: "AMC_VISIT",
    label: "AMC / Cleaning",
    requiresBeforeImage: true,
    requiresAfterImage: true,
    sitePhotoMin: null,
    sitePhotoMax: null,
  },
  SITE_VISIT: {
    key: "SITE_VISIT",
    label: "Site Visit",
    requiresBeforeImage: false,
    requiresAfterImage: false,
    sitePhotoMin: 4,
    sitePhotoMax: 10,
  },
  REGULAR: {
    key: "REGULAR",
    label: "Regular Task",
    requiresBeforeImage: false,
    requiresAfterImage: false,
    sitePhotoMin: null,
    sitePhotoMax: null,
  },
};
```

### 3.2 Task Completion Flow

**File:** `backend/src/modules/tasks/tasks.service.ts` - `completeTask()`

```
Employee submits task
    ↓
Validate task type configuration
    ↓
Check required images (before/after for AMC)
    ↓
Check site photo count (4-10 for SITE_VISIT)
    ↓
Process base64 photos → save to local filesystem
    ↓
Update task status to COMPLETED
    ↓
Store image paths in database
    ↓
Send notifications
```

### 3.3 Image Validation Logic

**AMC Visit:**
- **Before Image:** REQUIRED
- **After Image:** REQUIRED
- **Site Photos:** Optional

**Site Visit:**
- **Before Image:** NOT REQUIRED
- **After Image:** NOT REQUIRED
- **Site Photos:** 4-10 REQUIRED

**Regular Task:**
- **Before Image:** NOT REQUIRED
- **After Image:** NOT REQUIRED
- **Site Photos:** NOT REQUIRED

---

## 4. AUTHENTICATION & AUTHORIZATION

### 4.1 Authentication System

**File:** `backend/src/middleware/auth.ts`

- **Method:** JWT Bearer tokens
- **Middleware:** `authenticateAccessToken`
- **Payload Structure:**
  ```typescript
  {
    sub: string,      // userId
    loginId: string,
    role: UserRole,
    jobRole?: string
  }
  ```

### 4.2 Role Hierarchy

**File:** `backend/prisma/schema.prisma`

```typescript
enum UserRole {
  SUPER_ADMIN
  ADMIN
  SUB_ADMIN      // Service Coordinator
  EMPLOYEE
  PARTNER
  CUSTOMER
  DEPARTMENT_HEAD
  TEAM_LEAD
}
```

### 4.3 Authorization Middleware

- **Function:** `authorizeRoles(...allowedRoles)`
- **Function:** `requireRole(requiredRole)`
- **Service Coordinator Detection:** Role = SUB_ADMIN or jobRole = "servicecoordinator"

---

## 5. API STRUCTURE

### 5.1 Current Image Endpoints

**File:** `backend/src/routes/taskImages.ts`

```typescript
POST /api/v1/tasks/:taskId/images
  - Upload before/after images
  - Requires authentication
  - Accepts multipart/form-data
  - Applies watermark
  - Returns TaskImage records

GET /api/v1/tasks/:taskId/images
  - Get all images for a task
  - Requires authentication
  - Returns array with employee info
```

### 5.2 Task Endpoints

**File:** `backend/src/modules/tasks/tasks.routes.ts`

```typescript
POST /api/v1/tasks
GET /api/v1/tasks
GET /api/v1/tasks/:id
PUT /api/v1/tasks/:id
DELETE /api/v1/tasks/:id
POST /api/v1/tasks/:id/complete
```

### 5.3 Route Registration

**File:** `backend/src/app.ts`

```typescript
app.use("/api/v1/tasks", taskImagesRoutes);  // Image-specific routes
app.use("/api/v1/tasks", taskRoutes);       // General task routes
app.use("/uploads", express.static(...));   // Static file serving
```

---

## 6. ENVIRONMENT CONFIGURATION

### 6.1 Current Environment Variables

**File:** `backend/src/config/env.ts`

```typescript
DATABASE_URL          // Neon PostgreSQL connection
DIRECT_URL            // Neon direct connection
JWT_ACCESS_SECRET     // JWT signing secret
JWT_REFRESH_SECRET    // JWT refresh secret
CORS_ORIGIN           // Frontend origin
REDIS_URL             // Redis connection (optional)
WAAREE_API_*          // Waaree inverter integration
SMTP_*                // Email configuration
RAZORPAY_*            // Payment gateway
```

### 6.2 No R2 Configuration Currently
- **Status:** Not configured
- **Required:** R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT

---

## 7. INVERTER INTEGRATIONS (DO NOT MODIFY)

### 7.1 Supported Providers

**File:** `backend/src/lib/inverter-provider-factory.ts`

- K-Solar (ShineMonitor)
- Growatt (GrowattPortal)
- FoxESS
- Solarman
- SolisCloud
- Sungrow
- Waaree
- And others...

### 7.2 Credential Fields

**Current Schema:**
```prisma
model Customer {
  inverterLoginId     String?
  inverterPassword    String?
  dataLoggerSrNo      String?   // API key
  inverterSrNo        String?   // Device serial number
  // ... other fields
}
```

**⚠️ IMPORTANT:** Do not modify working inverter integrations.

---

## 8. PROBLEM WITH CURRENT STORAGE

### 8.1 Vercel Serverless Limitations
- **No Persistent Filesystem:** Files in `uploads/` are ephemeral
- **Deployment Wipes Data:** New deployments delete local files
- **Scalability Issues:** Cannot share files across serverless instances
- **No Backup:** Local files are not backed up

### 8.2 Current Issues
- Images stored locally will be lost on Vercel redeployment
- No centralized storage for multi-instance deployments
- No built-in CDN or global distribution
- Manual backup required

---

## 9. PROPOSED R2 INTEGRATION ARCHITECTURE

### 9.1 New Storage Model

**Neon PostgreSQL (Metadata):**
```prisma
model TaskImage {
  id           String   @id @default(uuid())
  taskId       Int
  employeeUserId String
  type         String   // "before", "after", "site_visit"
  objectKey    String   // R2 object key: tasks/{taskId}/before/{uuid}.jpg
  fileName     String   // Original filename
  mimeType     String   // image/jpeg, image/png, etc.
  fileSize     Int      // File size in bytes
  url          String   // R2 public URL or presigned URL
  latitude     Float?
  longitude    Float?
  watermarkText String?
  uploadedAt   DateTime @default(now())
  // ... relations
}
```

**Cloudflare R2 (Binary Files):**
```
swayog-dashboard/
  tasks/
    {taskId}/
      before/
        {uuid}.jpg
        {uuid}.jpg
      after/
        {uuid}.jpg
        {uuid}.jpg
      site-visit/
        {uuid}.jpg
        {uuid}.jpg
        ...
```

### 9.2 R2 Service Module Structure

**Proposed File:** `backend/src/services/r2StorageService.ts`

```typescript
// Core Functions
- uploadObject(buffer, key, metadata) → Promise<objectKey>
- getObject(key) → Promise<Buffer>
- deleteObject(key) → Promise<void>
- generatePresignedUrl(key, expiresIn) → Promise<string>
- generatePublicUrl(key) → string

// Helper Functions
- generateObjectKey(taskId, type, filename) → string
- validateFileType(mimeType) → boolean
- validateFileSize(size) → boolean
```

### 9.3 Updated Upload Flow

```
Employee Upload
    ↓
Multer receives multipart/form-data (or base64)
    ↓
Backend validates file type and size
    ↓
Sharp adds watermark
    ↓
Upload to R2 via R2 service
    ↓
Get R2 object key and public URL
    ↓
Store metadata in Neon (object key, URL, etc.)
    ↓
Return success with R2 URL
```

### 9.4 Required Environment Variables

```typescript
R2_ACCOUNT_ID        // Cloudflare account ID
R2_ACCESS_KEY_ID     // R2 API access key
R2_SECRET_ACCESS_KEY // R2 API secret key
R2_BUCKET_NAME       // "swayog-dashboard"
R2_ENDPOINT          // https://<accountid>.r2.cloudflarestorage.com
```

### 9.5 S3-Compatible Client

**Library:** `@aws-sdk/client-s3` or compatible S3 client

**Configuration:**
```typescript
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

---

## 10. MIGRATION STRATEGY

### 10.1 Phase 1: Add R2 Service (Non-Breaking)
- Create R2 service module
- Add environment variables
- Implement upload/download functions
- **DO NOT** modify existing upload endpoints yet

### 10.2 Phase 2: Extend Database Schema
- Add `objectKey`, `fileName`, `mimeType`, `fileSize` fields to TaskImage
- **DO NOT** remove existing `url` field
- Run migration
- Backward compatible with existing data

### 10.3 Phase 3: Update Upload Endpoints
- Modify task image upload to use R2
- Keep local fallback for testing
- Update watermarking to work with Buffer
- Test with new uploads

### 10.4 Phase 4: Migrate Existing Images
- Script to read local files
- Upload to R2
- Update database with object keys
- Verify all uploads succeeded
- **DO NOT** delete local files until verified

### 10.5 Phase 5: Update Retrieval
- Modify image retrieval to use R2 URLs
- Update frontend to display R2 images
- Test all image display locations

### 10.6 Phase 6: Remove Local Storage
- After successful migration and testing
- Remove local file serving route
- Clean up local `uploads/` directory
- Update documentation

---

## 11. SECURITY CONSIDERATIONS

### 11.1 Credential Security
- **R2 credentials MUST NOT be exposed to frontend**
- Store only in backend environment variables
- Never log R2 secrets
- Use Vercel environment variables for production

### 11.2 Authorization
- Maintain existing authentication middleware
- Only authenticated users can upload
- Only authorized users can access images
- Respect role-based access control

### 11.3 File Validation
- Validate file types (jpeg, jpg, png, gif)
- Validate file sizes (max 10MB)
- Scan for malicious content if possible
- Reject invalid files before upload

### 11.4 URL Security
- Use presigned URLs for private access if needed
- Or use R2 public bucket with proper CORS
- Never expose R2 credentials in URLs
- Set appropriate cache headers

---

## 12. TESTING REQUIREMENTS

### 12.1 Unit Tests
- R2 service upload/download
- Object key generation
- File validation
- Error handling

### 12.2 Integration Tests
- Complete task workflow with R2
- AMC visit before/after upload
- Site visit 4-10 photo upload
- Image retrieval and display

### 12.3 End-to-End Tests
- Employee uploads → R2 → Neon → Display
- AMC coordinator views completed task images
- Customer views authorized images
- Vercel redeployment persistence

---

## 13. FILES TO BE MODIFIED

### 13.1 New Files
- `backend/src/services/r2StorageService.ts` - R2 service module
- `backend/scripts/migrate-local-images-to-r2.ts` - Migration script

### 13.2 Modified Files
- `backend/prisma/schema.prisma` - Add R2 fields to TaskImage
- `backend/src/config/env.ts` - Add R2 environment variables
- `backend/src/routes/taskImages.ts` - Use R2 for uploads
- `backend/src/modules/tasks/tasks.service.ts` - Use R2 for base64 processing
- `backend/src/app.ts` - Update/remove static file serving
- `backend/package.json` - Add AWS SDK dependency

### 13.3 Frontend Files (Minimal Changes)
- Update image display components to use R2 URLs
- No major UI changes required

---

## 14. DEPLOYMENT CONSIDERATIONS

### 14.1 Vercel Environment Variables
Add to Vercel project settings:
- R2_ACCOUNT_ID
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET_NAME
- R2_ENDPOINT

### 14.2 Database Migration
Run Prisma migration on production:
```bash
npx prisma migrate deploy
```

### 14.3 Rollback Plan
- Keep local storage as fallback during transition
- Can revert changes if R2 integration fails
- Database schema changes are additive (safe)

---

## 15. ANDROID COMPATIBILITY

### 15.1 Shared API
- Android will use the SAME backend API
- No Android-specific storage logic
- Same authentication and authorization
- Same R2 object storage

### 15.2 API Contract
- POST /api/v1/tasks/:taskId/images (same endpoint)
- GET /api/v1/tasks/:taskId/images (same endpoint)
- Returns R2 URLs in response
- Android app displays images from R2 URLs

---

## 16. SUMMARY

### 16.1 Current State
- Local filesystem storage in `uploads/task-images/`
- Not suitable for Vercel serverless
- Images lost on redeployment
- No centralized storage

### 16.2 Target State
- Cloudflare R2 for persistent object storage
- Neon PostgreSQL for metadata
- S3-compatible API for R2 access
- Secure credential management
- Shared API for Web and Android

### 16.3 Key Principles
- **DO NOT** replace Neon PostgreSQL
- **DO NOT** modify working inverter integrations
- **DO NOT** break existing authentication
- **DO NOT** expose R2 credentials to frontend
- **DO NOT** delete local files without verification
- **MAINTAIN** existing task workflow
- **PRESERVE** role-based authorization

---

## 17. NEXT STEPS

1. **Review this architecture report** with the user
2. **Get confirmation** to proceed with R2 integration
3. **Implement R2 service module**
4. **Update database schema** (additive changes only)
5. **Modify upload endpoints** to use R2
6. **Test thoroughly** before deploying
7. **Migrate existing images** to R2
8. **Remove local storage** after verification

---

**Report Prepared By:** Cascade AI Assistant  
**Date:** August 24, 2026  
**Status:** Ready for Review and Approval
