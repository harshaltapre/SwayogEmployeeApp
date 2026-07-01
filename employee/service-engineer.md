# Service Engineer - Complete Workflow Documentation

## Role Overview

**Role Name**: Service Engineer  
**Hierarchy Level**: Technical/Field role  
**Reports To**: Team Lead / Department Head (Service)  
**Manages**: Service operations and customer support  
**Access Level**: Field service access with customer interaction capabilities  

### Responsibilities
- Provide technical support to customers
- Handle service requests and complaints
- Perform on-site system repairs
- Install and commission solar systems
- Train customers on system operation
- Document service activities
- Coordinate with service coordinators
- Ensure customer satisfaction
- Maintain service equipment

---

## Login Mechanism

### Authentication Flow

```
User enters credentials (Email/Login ID + Password)
    ↓
Role selection: "Employee" (with jobRole = "service engineer")
    ↓
POST /api/auth/login
    ↓
Backend validates credentials against User table
    ↓
Check: role = 'EMPLOYEE' with jobRole = 'service engineer'
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
Dashboard customized for service engineering features
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
  if (role === 'employee' && jobRole === 'service engineer') {
    return '/employee/dashboard';
  }
  // ... other roles
}
```

**Job Role Detection**:
```typescript
// Service Engineer is identified by:
// - role = 'EMPLOYEE' with jobRole = 'service engineer'
```

---

## Features & Capabilities

### Feature Access Matrix

| Feature | Access Level | Description |
|---------|-------------|-------------|
| Dashboard | ✅ Full | Service overview, pending requests |
| Service Requests | ✅ Full | Manage customer service requests |
| Installation | ✅ Full | Perform system installations |
| Commissioning | ✅ Full | Commission solar systems |
| Customer Training | ✅ Full | Train customers on system operation |
| Repairs | ✅ Full | Perform system repairs |
| Documentation | ✅ Full | Document service activities |
| Attendance Tracking | ✅ Full | Own attendance tracking |
| Profile Management | ✅ Full | Update personal information |
| Task Management | ✅ Full | View service-related tasks |
| Customer Management | ✅ Limited | Can view and update customer data for service |
| Admin Features | ❌ No | No administrative access |

### Dashboard Components

**Stat Cards**:
- Pending Service Requests
- Active Installations
- Repairs in Progress
- Customer Training Sessions
- Service Completion Rate
- Average Response Time

**Main Sections**:
- Service request queue
- Installation schedule
- Repair tracking
- Customer training records
- Service history
- Equipment status

---

## Database Integration

### Primary Tables Used

**User Table** (Service Engineer data)
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
  departmentId        String?               // Service department
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
  jobRole          String          @default("service engineer")
  zone             String?
  monthlySalaryInr Int?
  isActive         Boolean         @default(true)
  // ... other fields
}
```

**Customer Table** (For service projects)
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
  inverterBrand       String?
  inverterModel       String?
  latitude            Float?
  longitude           Float?
  // ... other fields
  ServiceRequest      ServiceRequest[]
}
```

**ServiceRequest Table** (Service request management)
```prisma
model ServiceRequest {
  id            Int      @id @default(autoincrement())
  customerId    Int
  title         String
  description   String
  address       String?
  latitude      Float?
  longitude     Float?
  status        String   @default("pending")
  scheduledDate String?
  scheduledTime String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  customer      Customer @relation(fields: [customerId], references: [id])
}
```

**Task Table** (Service-related tasks)
```prisma
model Task {
  id                    Int              @id @default(autoincrement())
  jobType               String           // "Installation", "Service", "Repair"
  description           String
  customerName          String
  customerPhone         String
  address               String
  status                TaskStatus       @default(ASSIGNED)
  scheduledTime         DateTime
  employeeUserId        String?          // Service engineer
  assignedById          String customerId
  completedAt           DateTime?
  // ... other fields
}
```

### Custom Tables (Potential Future Implementation)

**ServiceRecord Table** (Service activity tracking)
```prisma
model ServiceRecord {
  id                    String   @id @default(uuid())
  customerId            Int
  engineerId            String
  serviceType           String   // "Installation", "Repair", "Training"
  serviceDate           DateTime
  serviceStatus         String
  workDescription       String
  partsUsed             Json?
  photos                String[]
  customerFeedback      String?
  rating                Int?
  duration              Float
  customer              Customer @relation(fields: [customerId], references: [id])
  engineer              User     @relation(fields: [engineerId], references: [id])
}
```

**InstallationRecord Table** (Installation tracking)
```prisma
model InstallationRecord {
  id                    String   @id @default(uuid())
  customerId            Int
  engineerId            String
  installationDate       DateTime
  systemSizeKw          Float
  panelCount            Int
  inverterCapacity      Float
  installationStatus    String   @default("in_progress")
  commissioningDate      DateTime?
  testingResults        Json?
  photos                String[]
  customerSignoff       Boolean  @default(false)
  customer              Customer @relation(fields: [customerId], references: [id])
  engineer              User     @relation(fields: [engineerId], references: [id])
}
```

### Data Relationships

```
User (Service Engineer)
  ├── EmployeeProfile (1:1)
  ├── Department (N:1) - Service department
  ├── Task[] (assigned service tasks)
  ├── ServiceRecord[] (1:N) - Services performed
  └── InstallationRecord[] (1:N) - Installations performed

ServiceRequest
  └── Customer (N:1) - Customer requesting service

ServiceRecord
  ├── Customer (N:1) - Customer serviced
  └── Engineer → User (Service Engineer)
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

### Service Request Endpoints

**GET /api/service-requests**
- Query params: `?status={status}&customerId={id}`
- Response: `ServiceRequest[]`
- Used in: Service request list

**PUT /api/service-requests/{id}**
- Request: `{ status, scheduledDate, scheduledTime }`
- Response: Updated ServiceRequest
- Used in: Updating service request

### Service Record Endpoints

**GET /api/service-records**
- Query params: `?engineerId={id}&serviceType={type}`
- Response: `ServiceRecord[]`
- Used in: Service history

**POST /api/service-records**
- Request: `{ customerId, engineerId, serviceType, serviceDate, workDescription, partsUsed, photos, duration }`
- Response: Created ServiceRecord object
- Used in: Creating service record

**PUT /api/service-records/{id}**
- Request: `{ serviceStatus, customerFeedback, rating, photos }`
- Response: Updated ServiceRecord object
- Used in: Updating service record

### Installation Endpoints

**GET /api/installations**
- Query params: `?engineerId={id}&status={status}`
- Response: `InstallationRecord[]`
- Used in: Installation list

**POST /api/installations**
- Request: `{ customerId, engineerId, installationDate, systemSizeKw, panelCount, inverterCapacity }`
- Response: Created InstallationRecord object
- Used in: Creating installation record

**PUT /api/installations/{id}/commission**
- Request: `{ commissioningDate, testingResults, photos, customerSignoff }`
- Response: Updated InstallationRecord
- Used in: Commissioning installation

---

## Web UI Workflow

### Screen-by-Screen Navigation

```
Login Page (/login)
    ↓ [Authenticate as Service Engineer]
Employee Dashboard (/employee/dashboard)
    ├── Service Requests (/employee/service-requests)
    ├── Installations (/employee/installations)
    ├── Repairs (/employee/repairs)
    ├── Customer Training (/employee/customer-training)
    ├── Service History (/employee/service-history)
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

**Service Engineer Specific**:
- Select "Employee" role
- Backend detects service engineer via `jobRole = 'service engineer'`
- Redirects to `/employee/dashboard` with service features

### 2. Employee Dashboard (`/employee/dashboard`)

**Layout**: SidebarLayout with navigation

**Service Engineer Specific Components**:
- Service statistics cards
- Pending service requests
- Active installations
- Repairs in progress
- Training sessions scheduled
- Quick create service record button

### 3. Service Requests Page (`/employee/service-requests`)

**Layout**: SidebarLayout with request management

**Components**:
- PageHeader: "Service Requests"
- Request list with filters:
  - Status (Pending, Scheduled, In Progress, Completed)
  - Priority
  - Date range
- Search bar

**Request Card**:
- Customer name
- Request title
- Description
- Priority indicator
- Status badge
- Scheduled date/time
- Action buttons:
  - Accept Request
  - Schedule Service
  - View Details

**Service Request Form**:
- Customer information
- Request details
- Schedule date/time picker
- Priority selection
- Notes textarea
- Accept/Schedule button

### 4. Installations Page (`/employee/installations`)

**Layout**: SidebarLayout with installation management

**Components**:
- PageHeader: "Installations"
- Installation list with filters:
  - Status (Scheduled, In Progress, Commissioned)
  - Date range
- "Create Installation" button

**Installation Card**:
- Customer name
- System size (kW)
- Scheduled date
- Installation status
- Progress indicator
- Action buttons:
  - Start Installation
  - View Details
  - Commission

**Installation Form**:
- Customer information
- System specifications:
  - System size
  - Panel count
  - Inverter capacity
- Installation checklist:
  - Panel mounting
  - Inverter installation
  - Electrical connections
  - Testing
- Photo upload (progress photos)
- Commissioning form:
  - System testing results
  - Performance verification
  - Customer signoff
- Complete installation button

### 5. Repairs Page (`/employee/repairs`)

**Layout**: SidebarLayout with repair management

**Components**:
- PageHeader: "Repairs"
- Repair list with filters:
  - Status (Pending, In Progress, Completed)
  - Severity
- Repair details

**Repair Card**:
- Customer name
- Issue description
- Severity indicator
- Status badge
- Scheduled date
- Action buttons:
  - Start Repair
  - View Details
  - Complete

**Repair Form**:
- Customer information
- System details
- Issue description
- Diagnostic steps:
  - System checks
  - Measurements
  - Error codes
- Repair actions:
  - Parts replaced
  - Adjustments made
  - Testing performed
- Photo upload (before/after)
- Complete repair button

### 6. Customer Training Page (`/employee/customer-training`)

**Layout**: SidebarLayout with training management

**Components**:
- PageHeader: "Customer Training"
- Training session list
- Training checklist:
  - System overview
  - Operation procedures
  - Monitoring dashboard
  - Troubleshooting basics
  - Safety procedures
- Training materials
- Customer acknowledgment
- Complete training button

### 7. Service History Page (`/employee/service-history`)

**Layout**: SidebarLayout with history

**Components**:
- Service record list
- Filter by service type
- Filter by date range
- Service details:
  - Customer name
  - Service type
  - Date
  - Duration
  - Customer feedback
  - Rating
- Export history button

---

## Android UI Workflow

### Mobile-Specific UI Patterns

**Bottom Navigation Bar**:
```
[Home] [Requests] [Installations] [History] [Profile]
```

**Home Tab**:
- Service statistics
- Pending requests
- Installation schedule
- Quick actions

**Requests Tab**:
- Service request list
- Filter by status
- Accept/Schedule buttons
- Swipe actions

**Installations Tab**:
- Installation list
- Filter by status
- Start installation button
- Progress tracking

**History Tab**:
- Service history
- Filter by type
- Customer feedback
- Export options

**Profile Tab**:
- Personal profile
- Settings
- Logout

### Touch Interactions and Gestures

**Request Card Swipe Actions**:
- Swipe left: Accept request
- Swipe right: Schedule service
- Long press: Quick actions

**Installation Card Swipe Actions**:
- Swipe left: Start installation
- Swipe right: View details
- Tap: Open installation form

### Offline Capabilities

**Offline Mode**:
- Cache service requests
- Cache installation data
- Queue service records
- Queue photo uploads
- Sync when connection restored

### Push Notifications

**Notification Types**:
- New service request assigned
- Installation scheduled
- Repair request
- Customer feedback
- Training reminder

---

## Service Workflow

**1. Request Assignment**
```
Service request created
    ↓
Assigned to service engineer
    ↓
Engineer receives notification
    ↓
Engineer reviews request details
```

**2. Service Scheduling**
```
Engineer contacts customer
    ↓
Schedules service visit
    ↓
Confirms date and time
    ↓
Prepares equipment and materials
```

**3. Service Execution**
```
Engineer arrives at customer location
    ↓
Identifies issue or requirement
    ↓
Performs service work
    ↓
Documents activities
    ↓
Takes photos if required
    ↓
Tests system functionality
```

**4. Service Completion**
```
Verifies work completion
    ↓
Explains work to customer
    ↓
Collects customer feedback
    ↓
Submits service record
    ↓
Closes service request
```

---

## Data Flow Diagrams

### Service Record Creation Flow

```
┌─────────────┐
│ Service     │
│  Requests   │
└──────┬──────┘
       │ Accept service request
       ↓
┌─────────────┐
│ Service     │
│    Form     │
└──────┬──────┘
       │ Select service type
       │ Enter work description
       ↓
┌─────────────┐
│ Parts       │
│    Used     │
└──────┬──────┘
       │ Document parts used
       ↓
┌─────────────┐
│ Photo       │
│   Upload    │
└──────┬──────┘
       │ Upload service photos
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/service-records
       ↓
┌─────────────┐
│ Service     │
│  Controller │
└──────┬──────┘
       │ Create ServiceRecord
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Insert ServiceRecord
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Created record
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show success message
       ↓
┌─────────────┐
│ Service     │
│  Requests   │
└─────────────┘
```

---

## Related Files

### Frontend Files
- `src/pages/Login.tsx` - Login page with role selection
- `src/pages/employee/Dashboard.tsx` - Main dashboard (can be extended for service features)
- `src/lib/auth.ts` - Authentication and role management
- `src/lib/api-client.ts` - API client implementation

### Backend Files
- `backend/prisma/schema.prisma` - Database schema (may need ServiceRecord table added)
- `backend/routes/serviceRequests.js` - Service request routes
- `employee-login-system/src/routes/authRoutes.ts` - Authentication routes

### Components
- `src/components/SidebarLayout.tsx` - Main layout
- `src/components/PageHeader.tsx` - Page headers
- `src/components/StatCard.tsx` - Statistics cards

---

## Security Considerations

### Access Control
- Service engineers can only access assigned requests
- Can view and update customer data for service purposes
- Cannot modify customer financial information
- Cannot access other engineers' records without permission

### Data Protection
- Service photos protected
- Customer property information secured
- Service documentation confidential
- Audit trail for all service activities

### Audit Trail
- All service activities logged
- All installations tracked
- All repairs documented
- All training sessions recorded

---

## Performance Optimization

### Service Data Loading
- Lazy load service details
- Cache customer data
- Optimize photo uploads
- Paginate request lists

### Real-Time Updates
- WebSocket for request notifications
- Real-time installation progress
- Live status updates

---

## Future Enhancements

### Planned Features
- AI-powered issue diagnosis
- Mobile service app with AR
- Automated scheduling optimization
- Integration with inventory systems
- Customer portal integration
- Automated feedback collection
- Route optimization for field visits
