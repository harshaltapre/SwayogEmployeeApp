# Site Survey Engineer - Complete Workflow Documentation

## Role Overview

**Role Name**: Site Survey Engineer  
**Hierarchy Level**: Technical/Field role  
**Reports To**: Team Lead / Department Head (Operations/Survey)  
**Manages**: Site survey operations and data collection  
**Access Level**: Field survey access with data management capabilities  

### Responsibilities
- Conduct site surveys for solar installations
- Collect roof measurements and structural data
- Perform shading analysis
- Assess site suitability for solar
- Document electrical infrastructure
- Capture site photos and measurements
- Generate survey reports
- Coordinate with design engineers
- Ensure accurate data collection
- Maintain survey equipment

---

## Login Mechanism

### Authentication Flow

```
User enters credentials (Email/Login ID + Password)
    ↓
Role selection: "Employee" (with jobRole = "site survey engineer")
    ↓
POST /api/auth/login
    ↓
Backend validates credentials against User table
    ↓
Check: role = 'EMPLOYEE' with jobRole = 'site survey engineer'
    ↓
Check: isActive = true
    ↓
Check: failedLoginAttempts < 5 and lockoutUntil is null/expired
    ↓
Generate JWT access token + refresh token
    ↓
Store tokens (access in localStorage, refresh in httpOnly cookie)
    ↓
Redirect to: /employee/dashboard
    ↓
Dashboard customized for site survey features
```

### Security Features

**Account Lockout**:
- Max failed attempts: 5
- Lockout duration: 30 minutes (configurable)
- Tracks: `failedLoginAttempts`, `lockoutUntil`, `lastFailedLoginAt`

**Password Requirements**:
- Minimum 8 characters
- Stored as bcrypt hash in `passwordHash` field

**Session Management**:
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- Refresh token stored in `RefreshToken` table

### Role-Based Redirection

```typescript
// From src/lib/auth.ts
export function getRoleDashboardPath(role: UserRole, jobRole?: string): string {
  if (role === 'employee' && jobRole === 'site survey engineer') {
    return '/employee/dashboard';
  }
  // ... other roles
}
```

**Job Role Detection**:
```typescript
// Site Survey Engineer is identified by:
// - role = 'EMPLOYEE' with jobRole = 'site survey engineer'
```

---

## Features & Capabilities

### Feature Access Matrix

| Feature | Access Level | Description |
|---------|-------------|-------------|
| Dashboard | ✅ Full | Survey assignments overview, pending surveys |
| Survey Management | ✅ Full | Create, edit, submit site surveys |
| Data Collection | ✅ Full | Collect roof measurements, shading data |
| Photo Documentation | ✅ Full | Upload and manage site photos |
| Shading Analysis | ✅ Full | Perform and document shading analysis |
| Report Generation | ✅ Full | Generate survey reports |
| Equipment Management | ✅ Full | Track survey equipment |
| Attendance Tracking | ✅ Full | Own attendance tracking |
| Profile Management | ✅ Full | Update personal information |
| Task Management | ✅ Full | View survey-related tasks |
| Customer Management | ❌ Limited | Can view customer data for survey purposes |
| Admin Features | ❌ No | No administrative access |

### Dashboard Components

**Stat Cards**:
- Pending Surveys
- Surveys in Progress
- Completed Surveys This Month
- Survey Assignments
- Average Survey Time
- Surveys Requiring Revision

**Main Sections**:
- Survey assignment list
- Quick create survey button
- Photo upload section
- Shading analysis tools
- Survey report generator
- Equipment status

---

## Database Integration

### Primary Tables Used

**User Table** (Site Survey Engineer data)
```prisma
model User {
  id                  String                @id @default(uuid())
  loginId             String                @unique
  employeeCode        String?               @unique
  email               String                @unique
  phoneNumber         String?               @unique
  fullName            String
  passwordHash        String
  role                UserRole              @default(CUSTOMER)
  designationTitle    String?
  departmentId        String?               // Operations department
  reportingManagerId  String?
  isActive            Boolean               @default(true)
  failedLoginAttempts Int                   @default(0)
  lockoutUntil        DateTime?
  lastFailedLoginAt   DateTime?
  // ... other fields
  department          Department?           @relation(fields: [departmentId], references: [id])
}
```

**EmployeeProfile Table**
```prisma
model EmployeeProfile {
  id               String          @id @default(uuid())
  userId           String          @unique
  partnerId        String?
  jobRole          String          @default("site survey engineer")
  zone             String?
  monthlySalaryInr Int?
  isActive         Boolean         @default(true)
  // ... other fields
}
```

**Customer Table** (For survey projects)
```prisma
model Customer {
  id                  Int               @id @default(autoincrement())
  customerCode        String            @unique
  fullName            String
  email               String
  phoneNumber         String
  city                String
  address             String
  systemSizeKw        Float
  installationDate    DateTime
  latitude            Float?
  longitude           Float?
  projectStage        Int               @default(0)
  // ... other fields
}
```

**Task Table** (Survey-related tasks)
```prisma
model Task {
  id                    Int              @id @default(autoincrement())
  jobType               String           // "Site Survey", etc.
  description           String
  customerName          String
  customerPhone         String
  address               String
  latitude              Float?
  longitude             Float?
  status                TaskStatus       @default(ASSIGNED)
  scheduledTime         DateTime
  employeeUserId        String?          // Site survey engineer
  assignedById          String
  completedAt           DateTime?
  // ... other fields
}
```

### Custom Tables (Potential Future Implementation)

**SiteSurvey Table** (Survey data management)
```prisma
model SiteSurvey {
  id                    String   @id @default(uuid())
  customerId            Int
  surveyorId            String
  surveyDate            DateTime
  surveyStatus          String   @default("draft")
  submittedAt           DateTime @default(now())
  reviewedAt            DateTime?
  reviewedBy            String?
  reviewNotes           String?
  roofType              String?
  roofArea              Float?
  roofCondition         String?
  shadingAnalysis        Json?
  electricalInfrastructure Json?
  structuralAssessment   Json?
  photos                String[]
  latitude              Float?
  longitude             Float?
  customer              Customer @relation(fields: [customerId], references: [id])
  surveyor              User     @relation(fields: [surveyorId], references: [id])
}
```

**SurveyEquipment Table** (Equipment tracking)
```prisma
model SurveyEquipment {
  id                    String   @id @default(uuid())
  equipmentName         String
  equipmentType         String
  serialNumber          String?
  assignedTo            String?
  status                String   @default("available")
  lastMaintenanceDate    DateTime?
  nextMaintenanceDate    DateTime?
  assignedUser          User?    @relation(fields: [assignedTo], references: [id])
}
```

### Data Relationships

```
User (Site Survey Engineer)
  ├── EmployeeProfile (1:1)
  ├── Department (N:1) - Operations department
  ├── Task[] (assigned survey tasks)
  ├── SiteSurvey[] (1:N) - Surveys conducted
  └── SurveyEquipment[] (1:N) - Equipment assigned

SiteSurvey
  ├── Customer (N:1) - Customer surveyed
  ├── Surveyor (N:1) - User who conducted survey
  └── ShadingAnalysis (embedded JSON)
```

---

## API Endpoints

### Authentication Endpoints

**POST /api/auth/login**
- Request: `{ identifier: string, password: string, role: "employee" }`
- Response: `{ token, refreshToken, user }`
- Used in: `src/pages/Login.tsx`

**POST /api/auth/refresh-token**
- Request: `{ refreshToken: string }`
- Response: `{ token, refreshToken, user }`

**POST /api/auth/logout**
- Request: `{ refreshToken: string }`
- Response: `{ message: "Logged out successfully" }`

### Survey Management Endpoints

**GET /api/site-surveys**
- Query params: `?surveyorId={id}&status={status}`
- Response: `SiteSurvey[]`
- Used in: Survey list

**POST /api/site-surveys**
- Request: `{ customerId, surveyorId, surveyDate, roofType, roofArea, roofCondition, shadingAnalysis, electricalInfrastructure, structuralAssessment, photos, latitude, longitude }`
- Response: Created SiteSurvey object
- Used in: Creating site survey

**PUT /api/site-surveys/{id}**
- Request: `{ roofType, roofArea, roofCondition, shadingAnalysis, electricalInfrastructure, structuralAssessment, photos }`
- Response: Updated SiteSurvey object
- Used in: Editing site survey

**POST /api/site-surveys/{id}/submit**
- Request: `{}`
- Response: Updated SiteSurvey with status = "submitted"
- Used in: Submitting survey for review

**POST /api/site-surveys/{id}/photos**
- Request: `{ photos: string[] }`
- Response: Updated SiteSurvey with photos
- Used in: Uploading survey photos

### Equipment Management Endpoints

**GET /api/survey-equipment**
- Query params: `?assignedTo={id}&status={status}`
- Response: `SurveyEquipment[]`
- Used in: Equipment list

**PUT /api/survey-equipment/{id}/assign**
- Request: `{ assignedTo }`
- Response: Updated SurveyEquipment
- Used in: Assigning equipment

### Report Generation Endpoints

**POST /api/site-surveys/{id}/report**
- Request: `{ reportType }`
- Response: Generated survey report
- Used in: Generating survey reports

---

## Web UI Workflow

### Screen-by-Screen Navigation

```
Login Page (/login)
    ↓ [Authenticate as Site Survey Engineer]
Employee Dashboard (/employee/dashboard)
    ├── Site Surveys (/employee/site-surveys)
    ├── Create Survey (/employee/create-survey)
    ├── Survey Reports (/employee/survey-reports)
    ├── Equipment (/employee/survey-equipment)
    ├── Shading Analysis (/employee/shading-analysis)
    ├── Tasks Page (/employee/tasks)
    ├── Attendance Page (/employee/attendance)
    └── Profile Page (/employee/profile)
```

### 1. Login Screen (`/login`)

**Components**:
- Role selector (Employee, Admin, Partner, Customer, Super Admin)
- Email/Login ID input
- Password input with show/hide toggle
- "Keep me logged in" checkbox
- Sign in button
- "Forgot Password" link

**Site Survey Engineer Specific**:
- Select "Employee" role
- Backend detects site survey engineer via `jobRole = 'site survey engineer'`
- Redirects to `/employee/dashboard` with site survey features

### 2. Employee Dashboard (`/employee/dashboard`)

**Layout**: SidebarLayout with navigation

**Site Survey Engineer Specific Components**:
- Survey assignment statistics cards
- Pending surveys count
- Surveys in progress
- Completed surveys
- Quick create survey button
- Equipment status

### 3. Site Surveys Page (`/employee/site-surveys`)

**Layout**: SidebarLayout with survey management

**Components**:
- PageHeader: "Site Surveys"
- Survey list with filters:
  - Status (Draft, Submitted, Approved, Rejected)
  - Customer
  - Date range
- Search bar
- "Create New Survey" button

**Survey Card**:
- Customer name and ID
- Survey date
- Survey status badge
- Roof type
- Action buttons:
  - View/Edit
  - Submit
  - Generate Report

**Survey Detail View**:
- Customer information
- Survey date and location
- Roof measurements
- Shading analysis results
- Electrical infrastructure assessment
- Structural assessment
- Photo gallery
- Submission history

### 4. Create Survey Page (`/employee/create-survey`)

**Layout**: SidebarLayout with survey form

**Components**:
- Customer selection (dropdown with search)
- Location capture (GPS coordinates)
- Roof assessment form:
  - Roof type (flat, tilted, metal, concrete, etc.)
  - Roof area measurement
  - Roof condition assessment
  - Available space
  - Orientation and tilt
- Shading analysis section:
  - Shading obstacles identification
  - Shading percentage calculation
  - Optimal panel placement recommendations
- Electrical infrastructure form:
  - Main panel location
  - Available breaker capacity
  - Cable routing assessment
  - Grounding point location
- Structural assessment form:
  - Roof load capacity
  - Structural integrity
  - Mounting requirements
- Photo upload section:
  - Roof photos (multiple angles)
  - Electrical panel photos
  - Surrounding area photos
  - Shading photos
- Save as draft button
- Submit survey button

### 5. Shading Analysis Page (`/employee/shading-analysis`)

**Layout**: SidebarLayout with shading tools

**Components**:
- Shading analysis tool:
  - Upload site photos
  - Identify shading obstacles
  - Calculate shading percentage
  - Generate shading map
- Seasonal shading analysis:
  - Summer shading
  - Winter shading
  - Annual average
- Recommendations section:
  - Optimal panel placement
  - Shading mitigation strategies
- Save to survey button
- Export analysis button

### 6. Survey Reports Page (`/employee/survey-reports`)

**Layout**: SidebarLayout with report management

**Components**:
- Report list by survey
- Report types:
  - Summary report
  - Detailed technical report
  - Photo report
- Generate report button
- Export options (PDF, Word)
- Email report option

### 7. Equipment Page (`/employee/survey-equipment`)

**Layout**: SidebarLayout with equipment management

**Components**:
- Equipment list
- Equipment status:
  - Available
  - Assigned
  - In maintenance
- Equipment details:
  - Equipment name
  - Type
  - Serial number
  - Last maintenance
  - Next maintenance due
- Assign equipment button
- Return equipment button
- Maintenance log

---

## Android UI Workflow

### Mobile-Specific UI Patterns

**Bottom Navigation Bar**:
```
[Home] [Surveys] [Equipment] [Tasks] [Profile]
```

**Home Tab**:
- Survey statistics
- Pending surveys
- Equipment status
- Quick actions

**Surveys Tab**:
- Survey list
- Filter by status
- Quick create button
- Swipe actions

**Equipment Tab**:
- Equipment list
- Status indicators
- Assign/Return actions
- Maintenance alerts

**Tasks Tab**:
- Survey tasks
- Priority indicators
- Due dates

**Profile Tab**:
- Personal profile
- Settings
- Logout

### Touch Interactions and Gestures

**Survey Card Swipe Actions**:
- Swipe left: Edit survey
- Swipe right: Submit survey
- Long press: Quick actions

**Photo Upload Gestures**:
- Tap: Open camera/gallery
- Swipe: Navigate photos
- Pinch: Zoom photo

**Equipment Card Swipe Actions**:
- Swipe left: Return equipment
- Swipe right: Assign equipment

### Offline Capabilities

**Offline Mode**:
- Cache survey forms
- Cache customer data
- Queue survey submissions
- Queue photo uploads
- Sync when connection restored

### Push Notifications

**Notification Types**:
- New survey assignment
- Survey review completed
- Equipment maintenance due
- Survey approved/rejected
- Revision requested

---

## Roof Assessment Workflow

**1. Site Arrival**
```
Arrive at customer location
    ↓
Verify customer identity
    ↓
Explain survey process
    ↓
Begin assessment
```

**2. Roof Measurement**
```
Access roof safely
    ↓
Measure roof dimensions
    ↓
Calculate available area
    ↓
Identify mounting points
    ↓
Assess roof condition
    ↓
Document findings
```

**3. Shading Analysis**
```
Identify shading obstacles
    ↓
Measure obstacle heights
    ↓
Calculate shading impact
    ↓
Determine optimal placement
    ↓
Document shading data
```

**4. Electrical Assessment**
```
Locate main electrical panel
    ↓
Assess available capacity
    ↓
Identify cable routing path
    ↓
Locate grounding point
    ↓
Document electrical infrastructure
```

**5. Photo Documentation**
```
Capture roof photos
    ↓
Capture electrical panel photos
    ↓
Capture shading photos
    ↓
Capture surrounding area
    ↓
Upload photos to system
```

**6. Report Generation**
```
Compile survey data
    ↓
Generate survey report
    ↓
Review for completeness
    ↓
Submit for review
    ↓
Await feedback
```

---

## Data Flow Diagrams

### Survey Creation Flow

```
┌─────────────┐
│ Site        │
│  Surveys    │
└──────┬──────┘
       │ Click "Create New Survey"
       ↓
┌─────────────┐
│ Create      │
│  Survey     │
│    Form     │
└──────┬──────┘
       │ Select customer
       │ Capture GPS location
       ↓
┌─────────────┐
│ Roof        │
│ Assessment  │
└──────┬──────┘
       │ Enter roof measurements
       │ Assess roof condition
       ↓
┌─────────────┐
│ Shading     │
│  Analysis   │
└──────┬──────┘
       │ Perform shading analysis
       ↓
┌─────────────┐
│ Electrical  │
│ Assessment  │
└──────┬──────┘
       │ Assess electrical infrastructure
       ↓
┌─────────────┐
│ Photo       │
│   Upload    │
└──────┬──────┘
       │ Upload site photos
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/site-surveys
       ↓
┌─────────────┐
│ Survey      │
│  Controller │
└──────┬──────┘
       │ Create SiteSurvey record
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Insert SiteSurvey
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Created survey
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show success message
       ↓
┌─────────────┐
│ Site        │
│  Surveys    │
└─────────────┘
```

---

## Related Files

### Frontend Files
- `src/pages/Login.tsx` - Login page with role selection
- `src/pages/employee/Dashboard.tsx` - Main dashboard (can be extended for survey features)
- `src/lib/auth.ts` - Authentication and role management
- `src/lib/api-client.ts` - API client implementation

### Backend Files
- `backend/prisma/schema.prisma` - Database schema (may need SiteSurvey table added)
- `employee-login-system/src/routes/authRoutes.ts` - Authentication routes

### Components
- `src/components/SidebarLayout.tsx` - Main layout
- `src/components/PageHeader.tsx` - Page headers
- `src/components/StatCard.tsx` - Statistics cards

---

## Security Considerations

### Access Control
- Survey engineers can only access their own surveys
- Can view customer data for survey purposes only
- Cannot modify customer information
- Cannot access other engineers' surveys without permission

### Data Protection
- Survey photos protected
- Location data secured
- Customer property information confidential
- Audit trail for all survey changes

### Audit Trail
- All survey creations logged
- All photo uploads tracked
- All equipment assignments recorded
- All report generations documented

---

## Performance Optimization

### Survey Data Loading
- Lazy load survey details
- Cache photo thumbnails
- Optimize photo uploads
- Paginate survey lists

### Real-Time Updates
- WebSocket for survey notifications
- Real-time photo upload progress
- Live equipment status updates

---

## Future Enhancements

### Planned Features
- AI-powered shading analysis
- 3D site modeling
- Drone-based survey
- Augmented reality measurement
- Mobile survey app with AR
- Automated report generation
- Integration with design software
- Real-time collaboration tools
