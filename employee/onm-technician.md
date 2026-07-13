# O&M Technician - Complete Workflow Documentation

## Role Overview

**Role Name**: O&M (Operations & Maintenance) Technician  
**Hierarchy Level**: Technical/Field role  
**Reports To**: Team Lead / Department Head (Service/Maintenance)  
**Manages**: Solar system maintenance and troubleshooting operations  
**Access Level**: Field maintenance access with system monitoring capabilities  

### Responsibilities
- Perform routine maintenance on solar systems
- Troubleshoot system issues and faults
- Monitor system performance data
- Execute preventive maintenance schedules
- Repair or replace faulty components
- Document maintenance activities
- Coordinate with service coordinators
- Ensure system uptime and performance
- Maintain maintenance equipment and tools

---

## Login Mechanism

### Authentication Flow

```
User enters credentials (Email/Login ID + Password)
    ↓
Role selection: "Employee" (with jobRole = "o&m technician")
    ↓
POST /api/auth/login
    ↓
Backend validates credentials against User table
    ↓
Check: role = 'EMPLOYEE' with jobRole = 'o&m technician'
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
Dashboard customized for O&M features
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
  if (role === 'employee' && jobRole === 'o&m technician') {
    return '/employee/dashboard';
  }
  // ... other roles
}
```

**Job Role Detection**:
```typescript
// O&M Technician is identified by:
// - role = 'EMPLOYEE' with jobRole = 'o&m technician'
```

---

## Features & Capabilities

### Feature Access Matrix

| Feature | Access Level | Description |
|---------|-------------|-------------|
| Dashboard | ✅ Full | Maintenance overview, pending tasks |
| Maintenance Management | ✅ Full | Create, update maintenance records |
| System Monitoring | ✅ Full | View system performance data |
| Troubleshooting | ✅ Full | Diagnose and resolve system issues |
| AMC Visits | ✅ Full | Execute scheduled AMC visits |
| Preventive Maintenance | ✅ Full | Execute preventive maintenance schedules |
| Component Replacement | ✅ Full | Replace faulty components |
| Performance Tracking | ✅ Full | Track maintenance performance metrics |
| Attendance Tracking | ✅ Full | Own attendance tracking |
| Profile Management | ✅ Full | Update personal information |
| Task Management | ✅ Full | View maintenance-related tasks |
| Customer Management | ❌ Limited | Can view customer data for maintenance |
| Admin Features | ❌ No | No administrative access |

### Dashboard Components

**Stat Cards**:
- Pending Maintenance Tasks
- Active Troubleshooting Cases
- AMC Visits Scheduled
- Systems Under Monitoring
- Maintenance Completion Rate
- Average Response Time

**Main Sections**:
- Maintenance task list
- System monitoring dashboard
- AMC visit schedule
- Troubleshooting queue
- Performance metrics
- Equipment status

---

## Database Integration

### Primary Tables Used

**User Table** (O&M Technician data)
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
  departmentId        String?               // Service/Maintenance department
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
  jobRole          String          @default("o&m technician")
  zone             String?
  monthlySalaryInr Int?
  isActive         Boolean         @default(true)
  // ... other fields
}
```

**Customer Table** (For maintenance projects)
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
  amcStatus           CustomerAmcStatus @default(NONE)
  amcExpiryDate       DateTime?
  latitude            Float?
  longitude           Float?
  // ... other fields
  AmcVisit            AmcVisit[]
}
```

**AmcVisit Table** (AMC visit management)
```prisma
model AmcVisit {
  id                    String    @id @default(uuid())
  customerId            Int
  scheduledDate         DateTime
  status                String    @default("pending")
  completedAt           DateTime?
  notes                 String?
  assignedEmployeeId    String?
  completedByEmployeeId String?
  completedByName       String?
  visitNotes            String?
  beforeImageUrl        String?
  afterImageUrl         String?
  cleaningNumber        Int?
  timeSlot              String?
  customer              Customer  @relation(fields: [customerId], references: [id])
  assignedEmployee      User?     @relation("assigned_amc_employee", fields: [assignedEmployeeId], references: [id])
}
```

**Task Table** (Maintenance-related tasks)
```prisma
model Task {
  id                    Int              @id @default(autoincrement())
  jobType               String           // "Maintenance", "Repair", etc.
  description           String
  customerName          String
  customerPhone         String
  address               String
  status                TaskStatus       @default(ASSIGNED)
  scheduledTime         DateTime
  employeeUserId        String?          // O&M technician
  assignedById          String
  completedAt           DateTime?
  // ... other fields
}
```

### Custom Tables (Potential Future Implementation)

**MaintenanceRecord Table** (Maintenance activity tracking)
```prisma
model MaintenanceRecord {
  id                    String   @id @default(uuid())
  customerId            Int
  technicianId          String
  maintenanceType       String   // "Routine", "Corrective", "Preventive"
  maintenanceDate       DateTime
  systemStatusBefore    String
  systemStatusAfter     String
  issuesFound           String[]
  actionsTaken          String[]
  componentsReplaced    Json?
  photos                String[]
  duration              Float
  status                String   @default("completed")
  customer              Customer @relation(fields: [customerId], references: [id])
  technician            User     @relation(fields: [technicianId], references: [id])
}
```

**TroubleshootingCase Table** (Issue tracking)
```prisma
model TroubleshootingCase {
  id                    String   @id @default(uuid())
  customerId            Int
  technicianId          String
  issueDescription      String
  issueCategory         String
  severity              String
  reportedDate          DateTime @default(now())
  resolvedDate          DateTime?
  rootCause             String?
  solution              String?
  status                String   @default("open")
  customer              Customer @relation(fields: [customerId], references: [id])
  technician            User     @relation(fields: [technicianId], references: [id])
}
```

### Data Relationships

```
User (O&M Technician)
  ├── EmployeeProfile (1:1)
  ├── Department (N:1) - Service/Maintenance department
  ├── Task[] (assigned maintenance tasks)
  ├── AmcVisit[] (assigned AMC visits)
  ├── MaintenanceRecord[] (1:N) - Maintenance performed
  └── TroubleshootingCase[] (1:N) - Cases handled

AmcVisit
  ├── Customer (N:1) - Customer for visit
  └── assignedEmployee → User (O&M Technician)

MaintenanceRecord
  ├── Customer (N:1) - Customer maintained
  └── Technician → User (O&M Technician)
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

### Maintenance Management Endpoints

**GET /api/maintenance-records**
- Query params: `?technicianId={id}&status={status}`
- Response: `MaintenanceRecord[]`
- Used in: Maintenance history

**POST /api/maintenance-records**
- Request: `{ customerId, technicianId, maintenanceType, maintenanceDate, systemStatusBefore, systemStatusAfter, issuesFound, actionsTaken, componentsReplaced, photos, duration }`
- Response: Created MaintenanceRecord object
- Used in: Creating maintenance record

**PUT /api/maintenance-records/{id}**
- Request: `{ systemStatusAfter, actionsTaken, componentsReplaced, photos, duration, status }`
- Response: Updated MaintenanceRecord object
- Used in: Updating maintenance record

### AMC Visit Endpoints

**GET /api/amc-visits**
- Query params: `?assignedEmployeeId={id}&status={status}`
- Response: `AmcVisit[]`
- Used in: AMC visit list

**PUT /api/amc-visits/{id}/complete**
- Request: `{ completedAt, notes, beforeImageUrl, afterImageUrl, completedByEmployeeId, completedByName }`
- Response: Updated AmcVisit
- Used in: Completing AMC visit

### Troubleshooting Endpoints

**GET /api/troubleshooting-cases**
- Query params: `?technicianId={id}&status={status}`
- Response: `TroubleshootingCase[]`
- Used in: Troubleshooting case list

**POST /api/troubleshooting-cases**
- Request: `{ customerId, technicianId, issueDescription, issueCategory, severity }`
- Response: Created TroubleshootingCase object
- Used in: Creating troubleshooting case

**PUT /api/troubleshooting-cases/{id}/resolve**
- Request: `{ rootCause, solution, resolvedDate }`
- Response: Updated TroubleshootingCase
- Used in: Resolving troubleshooting case

### System Monitoring Endpoints

**GET /api/customers/{id}/system-status**
- Response: Current system status and performance data
- Used in: Monitoring system performance

**GET /api/customers/{id}/alerts**
- Response: Active system alerts
- Used in: Viewing system alerts

---

## Web UI Workflow

### Screen-by-Screen Navigation

```
Login Page (/login)
    ↓ [Authenticate as O&M Technician]
Employee Dashboard (/employee/dashboard)
    ├── Maintenance Tasks (/employee/maintenance-tasks)
    ├── AMC Visits (/employee/amc-visits)
    ├── Troubleshooting (/employee/troubleshooting)
    ├── System Monitoring (/employee/system-monitoring)
    ├── Maintenance History (/employee/maintenance-history)
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

**O&M Technician Specific**:
- Select "Employee" role
- Backend detects O&M technician via `jobRole = 'o&m technician'`
- Redirects to `/employee/dashboard` with O&M features

### 2. Employee Dashboard (`/employee/dashboard`)

**Layout**: SidebarLayout with navigation

**O&M Technician Specific Components**:
- Maintenance statistics cards
- Pending maintenance tasks
- AMC visits scheduled
- Active troubleshooting cases
- Systems requiring attention
- Quick create maintenance record button

### 3. Maintenance Tasks Page (`/employee/maintenance-tasks`)

**Layout**: SidebarLayout with task management

**Components**:
- PageHeader: "Maintenance Tasks"
- Task list with filters:
  - Type (Routine, Corrective, Preventive)
  - Status (Pending, In Progress, Completed)
  - Priority
- Search bar
- "Create Maintenance Record" button

**Task Card**:
- Customer name and ID
- Maintenance type
- Scheduled date
- Priority indicator
- Status badge
- Action buttons:
  - Start Maintenance
  - View Details
  - Complete

**Maintenance Form**:
- Customer information
- System details
- Maintenance type selection
- System status before maintenance
- Issues found (checkboxes + custom)
- Actions taken (textarea)
- Components replaced (list)
- Photo upload (before/after)
- Duration tracking
- Complete maintenance button

### 4. AMC Visits Page (`/employee/amc-visits`)

**Layout**: SidebarLayout with AMC management

**Components**:
- PageHeader: "AMC Visits"
- Visit list with filters:
  - Status (Pending, In Progress, Completed)
  - Date range
  - Cleaning number
- Visit details

**Visit Card**:
- Customer name
- Scheduled date
- Cleaning number
- Time slot
- Status badge
- Action buttons:
  - Start Visit
  - View Details
  - Complete

**AMC Visit Form**:
- Customer information
- Visit details
- Cleaning checklist:
  - Panel cleaning
  - Inverter inspection
  - Cable check
  - Performance verification
- Before/after photos
- Visit notes
- Complete visit button

### 5. Troubleshooting Page (`/employee/troubleshooting`)

**Layout**: SidebarLayout with troubleshooting

**Components**:
- PageHeader: "Troubleshooting"
- Case list with filters:
  - Status (Open, In Progress, Resolved)
  - Severity
  - Category
- "Create Case" button

**Case Card**:
- Customer name
- Issue description
- Category
- Severity indicator
- Status badge
- Reported date
- Action buttons:
  - Start Investigation
  - View Details
  - Resolve

**Troubleshooting Form**:
- Customer information
- System details
- Issue description
- Category selection
- Severity selection
- Diagnostic steps:
  - Voltage measurements
  - Current measurements
  - System status indicators
- Root cause analysis
- Solution implemented
- Components replaced
- Resolve case button

### 6. System Monitoring Page (`/employee/system-monitoring`)

**Layout**: SidebarLayout with monitoring

**Components**:
- Customer list with system status
- System performance metrics:
  - Current power output
  - Daily generation
  - Efficiency
  - Temperature
- Active alerts
- Performance trends
- Historical data

**System Status Indicators**:
- Online/Offline status
- Performance rating
- Alert count
- Last maintenance date

---

## Android UI Workflow

### Mobile-Specific UI Patterns

**Bottom Navigation Bar**:
```
[Home] [Maintenance] [AMC] [Monitoring] [Profile]
```

**Home Tab**:
- Maintenance statistics
- Pending tasks
- AMC schedule
- Quick actions

**Maintenance Tab**:
- Maintenance task list
- Filter by type/status
- Quick create button
- Swipe actions

**AMC Tab**:
- AMC visit list
- Filter by status
- Start visit button
- Swipe actions

**Monitoring Tab**:
- System monitoring
- Alert notifications
- Performance metrics
- Customer list

**Profile Tab**:
- Personal profile
- Settings
- Logout

### Touch Interactions and Gestures

**Task Card Swipe Actions**:
- Swipe left: Start task
- Swipe right: View details
- Long press: Complete task

**Photo Upload Gestures**:
- Tap: Open camera/gallery
- Swipe: Navigate photos
- Pinch: Zoom photo

### Offline Capabilities

**Offline Mode**:
- Cache maintenance forms
- Cache system data
- Queue maintenance records
- Queue photo uploads
- Sync when connection restored

### Push Notifications

**Notification Types**:
- New maintenance task assigned
- AMC visit reminder
- System alert
- Troubleshooting case assigned
- Maintenance completed

---

## Maintenance Workflow

**1. Task Assignment**
```
Maintenance task created
    ↓
Assigned to O&M technician
    ↓
Technician receives notification
    ↓
Technician reviews task details
```

**2. Pre-Maintenance**
```
Technician arrives at site
    ↓
Reviews system status
    ↓
Identifies maintenance requirements
    ↓
Prepares tools and equipment
```

**3. Maintenance Execution**
```
Performs routine maintenance
    ↓
Documents system status before
    ↓
Identifies issues
    ↓
Performs corrective actions
    ↓
Replaces components if needed
    ↓
Documents actions taken
    ↓
Takes before/after photos
```

**4. Post-Maintenance**
```
Verifies system functionality
    ↓
Documents system status after
    ↓
Calculates duration
    ↓
Submits maintenance record
    ↓
System updated in database
```

---

## Data Flow Diagrams

### Maintenance Record Creation Flow

```
┌─────────────┐
│ Maintenance │
│    Tasks    │
└──────┬──────┘
       │ Click "Create Maintenance Record"
       ↓
┌─────────────┐
│ Maintenance │
│    Form     │
└──────┬──────┘
       │ Select customer
       │ Enter maintenance details
       ↓
┌─────────────┐
│ System      │
│  Status     │
└──────┬──────┘
       │ Document status before
       ↓
┌─────────────┐
│ Issues      │
│  Found      │
└──────┬──────┘
       │ Identify issues
       ↓
┌─────────────┐
│ Actions     │
│   Taken     │
└──────┬──────┘
       │ Document actions
       ↓
┌─────────────┐
│ Photo       │
│   Upload    │
└──────┬──────┘
       │ Upload before/after photos
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/maintenance-records
       ↓
┌─────────────┐
│ Maintenance │
│  Controller │
└──────┬──────┘
       │ Create MaintenanceRecord
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Insert MaintenanceRecord
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
│ Maintenance │
│    Tasks    │
└─────────────┘
```

---

## Related Files

### Frontend Files
- `src/pages/Login.tsx` - Login page with role selection
- `src/pages/employee/Dashboard.tsx` - Main dashboard (can be extended for O&M features)
- `src/pages/employee/AmcManagement.tsx` - AMC management
- `src/lib/auth.ts` - Authentication and role management
- `src/lib/api-client.ts` - API client implementation

### Backend Files
- `backend/prisma/schema.prisma` - Database schema (may need MaintenanceRecord table added)
- `employee-login-system/src/routes/authRoutes.ts` - Authentication routes

### Components
- `src/components/SidebarLayout.tsx` - Main layout
- `src/components/PageHeader.tsx` - Page headers
- `src/components/StatCard.tsx` - Statistics cards

---

## Security Considerations

### Access Control
- O&M technicians can only access assigned tasks
- Can view customer data for maintenance purposes only
- Cannot modify customer information
- Cannot access other technicians' records without permission

### Data Protection
- Maintenance photos protected
- System data secured
- Customer property information confidential
- Audit trail for all maintenance activities

### Audit Trail
- All maintenance activities logged
- All component replacements tracked
- All troubleshooting cases recorded
- All AMC visits documented

---

## Performance Optimization

### Maintenance Data Loading
- Lazy load maintenance details
- Cache system status data
- Optimize photo uploads
- Paginate task lists

### Real-Time Updates
- WebSocket for task notifications
- Real-time system monitoring
- Live alert updates

---

## Future Enhancements

### Planned Features
- AI-powered predictive maintenance
- Automated issue detection
- Mobile maintenance app with AR
- Integration with inverter monitoring systems
- Automated reporting
- Equipment tracking
- Inventory integration for spare parts
