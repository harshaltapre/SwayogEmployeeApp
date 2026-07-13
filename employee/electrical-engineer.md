# Electrical Engineer - Complete Workflow Documentation

## Role Overview

**Role Name**: Electrical Engineer  
**Hierarchy Level**: Technical/Engineering role  
**Reports To**: Team Lead / Department Head (Engineering/Electrical)  
**Manages**: Electrical system design and installation oversight  
**Access Level**: Electrical engineering access with technical supervision capabilities  

### Responsibilities
- Design electrical systems for solar installations
- Create electrical schematics and single-line diagrams
- Calculate electrical loads and cable sizing
- Ensure compliance with electrical codes and standards
- Review installation electrical work
- Troubleshoot electrical issues
- Coordinate with solar design engineers
- Approve electrical drawings and specifications
- Monitor electrical safety during installations

---

## Login Mechanism

### Authentication Flow

```
User enters credentials (Email/Login ID + Password)
    ↓
Role selection: "Employee" (with jobRole = "electrical engineer")
    ↓
POST /api/auth/login
    ↓
Backend validates credentials against User table
    ↓
Check: role = 'EMPLOYEE' with jobRole = 'electrical engineer'
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
Dashboard customized for electrical engineering features
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
  if (role === 'employee' && jobRole === 'electrical engineer') {
    return '/employee/dashboard';
  }
  // ... other roles
}
```

**Job Role Detection**:
```typescript
// Electrical Engineer is identified by:
// - role = 'EMPLOYEE' with jobRole = 'electrical engineer'
```

---

## Features & Capabilities

### Feature Access Matrix

| Feature | Access Level | Description |
|---------|-------------|-------------|
| Dashboard | ✅ Full | Electrical projects overview, pending designs |
| Electrical Design | ✅ Full | Create electrical schematics and designs |
| Load Calculations | ✅ Full | Calculate electrical loads and cable sizing |
| Installation Oversight | ✅ Full | Review and approve electrical installations |
| Troubleshooting | ✅ Full | Diagnose and resolve electrical issues |
| Compliance Checking | ✅ Full | Ensure compliance with electrical codes |
| Drawing Management | ✅ Full | Manage electrical drawings and schematics |
| Safety Monitoring | ✅ Full | Monitor electrical safety during work |
| Attendance Tracking | ✅ Full | Own attendance tracking |
| Profile Management | ✅ Full | Update personal information |
| Task Management | ✅ Full | View electrical-related tasks |
| Customer Management | ❌ Limited | Can view customer data for electrical work |
| Admin Features | ❌ No | No administrative access |

### Dashboard Components

**Stat Cards**:
- Pending Electrical Designs
- Installations Under Review
- Active Troubleshooting Cases
- Compliance Approvals
- Safety Inspections Completed
- Electrical Tasks Assigned

**Main Sections**:
- Electrical project list
- Load calculation tools
- Installation review queue
- Troubleshooting dashboard
- Compliance checklist
- Safety reports

---

## Database Integration

### Primary Tables Used

**User Table** (Electrical Engineer data)
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
  departmentId        String?               // Engineering department
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
  jobRole          String          @default("electrical engineer")
  zone             String?
  monthlySalaryInr Int?
  isActive         Boolean         @default(true)
  // ... other fields
}
```

**Customer Table** (For electrical projects)
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
  projectStage        Int               @default(0)
  // ... other fields
}
```

**Task Table** (Electrical-related tasks)
```prisma
model Task {
  id                    Int              @id @default(autoincrement())
  jobType               String           // "Electrical Design", "Inspection", etc.
  description           String
  customerName          String
  customerPhone         String
  address               String
  status                TaskStatus       @default(ASSIGNED)
  scheduledTime         DateTime
  employeeUserId        String?          // Electrical engineer
  assignedById          String
  completedAt           DateTime?
  // ... other fields
}
```

### Custom Tables (Potential Future Implementation)

**ElectricalDesign Table** (Electrical design management)
```prisma
model ElectricalDesign {
  id                    String   @id @default(uuid())
  customerId            Int
  engineerId            String
  systemSizeKw          Float
  mainBreakerSize       Float
  cableSize             String
  designStatus          String   @default("draft")
  submittedAt           DateTime @default(now())
  reviewedAt            DateTime?
  reviewedBy            String?
  reviewNotes           String?
  schematicUrl          String?
  loadCalculations      Json?
  complianceCheck       Json?
  customer              Customer @relation(fields: [customerId], references: [id])
  engineer              User     @relation(fields: [engineerId], references: [id])
}
```

**ElectricalInspection Table** (Installation inspection)
```prisma
model ElectricalInspection {
  id                    String   @id @default(uuid())
  customerId            Int
  inspectorId           String
  inspectionDate        DateTime
  inspectionType        String   // "Pre-installation", "Post-installation"
  inspectionStatus      String   @default("pending")
  safetyChecklist       Json?
  complianceStatus      String?
  findings              String?
  approvedAt            DateTime?
  approvedBy            String?
  customer              Customer @relation(fields: [customerId], references: [id])
  inspector             User     @relation(fields: [inspectorId], references: [id])
}
```

### Data Relationships

```
User (Electrical Engineer)
  ├── EmployeeProfile (1:1)
  ├── Department (N:1) - Engineering department
  ├── Task[] (assigned electrical tasks)
  ├── ElectricalDesign[] (1:N) - Designs created
  └── ElectricalInspection[] (1:N) - Inspections performed

ElectricalDesign
  ├── Customer (N:1) - Customer for design
  ├── Engineer (N:1) - User who created design
  └── LoadCalculations (embedded JSON)

ElectricalInspection
  ├── Customer (N:1) - Customer being inspected
  └── Inspector (N:1) - User performing inspection
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

### Electrical Design Endpoints

**GET /api/electrical-designs**
- Query params: `?engineerId={id}&status={status}`
- Response: `ElectricalDesign[]`
- Used in: Electrical design list

**POST /api/electrical-designs**
- Request: `{ customerId, engineerId, systemSizeKw, mainBreakerSize, cableSize, loadCalculations, schematicUrl }`
- Response: Created ElectricalDesign object
- Used in: Creating electrical design

**PUT /api/electrical-designs/{id}**
- Request: `{ systemSizeKw, mainBreakerSize, cableSize, loadCalculations, schematicUrl }`
- Response: Updated ElectricalDesign object
- Used in: Editing electrical design

**POST /api/electrical-designs/{id}/submit**
- Request: `{}`
- Response: Updated ElectricalDesign with status = "submitted"
- Used in: Submitting design for review

**POST /api/electrical-designs/{id}/compliance-check**
- Request: `{}`
- Response: Compliance check results
- Used in: Running compliance checks

### Inspection Endpoints

**GET /api/electrical-inspections**
- Query params: `?inspectorId={id}&status={status}`
- Response: `ElectricalInspection[]`
- Used in: Inspection list

**POST /api/electrical-inspections**
- Request: `{ customerId, inspectorId, inspectionDate, inspectionType, safetyChecklist }`
- Response: Created ElectricalInspection object
- Used in: Creating inspection

**PUT /api/electrical-inspections/{id}**
- Request: `{ inspectionStatus, complianceStatus, findings }`
- Response: Updated ElectricalInspection object
- Used in: Updating inspection

**POST /api/electrical-inspections/{id}/approve**
- Request: `{ approvedBy, approvalNotes }`
- Response: Updated ElectricalInspection with approval
- Used in: Approving installation

### Load Calculation Endpoints

**POST /api/electrical/calculations/load**
- Request: `{ systemSizeKw, inverterCapacity, distance, voltage }`
- Response: Load calculation results
- Used in: Calculating electrical loads

**POST /api/electrical/calculations/cable**
- Request: `{ current, distance, voltageDrop }`
- Response: Cable sizing recommendations
- Used in: Calculating cable sizes

---

## Web UI Workflow

### Screen-by-Screen Navigation

```
Login Page (/login)
    ↓ [Authenticate as Electrical Engineer]
Employee Dashboard (/employee/dashboard)
    ├── Electrical Designs (/employee/electrical-designs)
    ├── Load Calculations (/employee/load-calculations)
    ├── Inspections (/employee/electrical-inspections)
    ├── Troubleshooting (/employee/troubleshooting)
    ├── Compliance (/employee/compliance)
    ├── Safety Reports (/employee/safety-reports)
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

**Electrical Engineer Specific**:
- Select "Employee" role
- Backend detects electrical engineer via `jobRole = 'electrical engineer'`
- Redirects to `/employee/dashboard` with electrical engineering features

### 2. Employee Dashboard (`/employee/dashboard`)

**Layout**: SidebarLayout with navigation

**Electrical Engineer Specific Components**:
- Electrical project statistics cards
- Pending electrical designs
- Installations requiring inspection
- Active troubleshooting cases
- Quick create design button
- Inspection queue

### 3. Electrical Designs Page (`/employee/electrical-designs`)

**Layout**: SidebarLayout with design management

**Components**:
- PageHeader: "Electrical Designs"
- Design list with filters:
  - Status (Draft, Submitted, Approved, Rejected)
  - Customer
  - Date range
- Search bar
- "Create New Design" button

**Design Card**:
- Customer name and ID
- System size (kW)
- Main breaker size
- Design status badge
- Submission date
- Action buttons:
  - View/Edit
  - Submit
  - Run Compliance Check

**Design Detail View**:
- Customer information
- System specifications
- Load calculations display
- Cable sizing results
- Schematic viewer
- Compliance checklist
- Submission history

### 4. Load Calculations Page (`/employee/load-calculations`)

**Layout**: SidebarLayout with calculation tools

**Components**:
- Load calculation form:
  - System size (kW)
  - Inverter capacity
  - Distance to grid
  - Voltage level
- Cable sizing calculator:
  - Current (Amps)
  - Cable length
  - Voltage drop limit
- Real-time results display
- Save to design button
- Export calculations button

### 5. Inspections Page (`/employee/electrical-inspections`)

**Layout**: SidebarLayout with inspection management

**Components**:
- Inspection list with filters:
  - Type (Pre-installation, Post-installation)
  - Status (Pending, In Progress, Completed)
  - Date
- "Create Inspection" button

**Inspection Card**:
- Customer name
- Inspection type
- Scheduled date
- Inspection status
- Action buttons:
  - Start Inspection
  - View Details
  - Complete Inspection

**Inspection Form**:
- Safety checklist:
  - Grounding verification
  - Cable routing check
  - Breaker sizing verification
  - Protection devices check
  - Labeling verification
- Compliance status
- Findings textarea
- Photo upload
- Approve/Reject buttons

### 6. Troubleshooting Page (`/employee/troubleshooting`)

**Layout**: SidebarLayout with troubleshooting

**Components**:
- Active troubleshooting cases
- Case details:
  - Issue description
  - Customer information
  - System details
  - Reported symptoms
- Diagnostic tools:
  - Voltage measurement inputs
  - Current measurement inputs
  - System status indicators
- Resolution form:
  - Root cause analysis
  - Solution implemented
  - Parts replaced
  - Time spent
- Close case button

### 7. Compliance Page (`/employee/compliance`)

**Layout**: SidebarLayout with compliance management

**Components**:
- Compliance checklist by project
- Electrical code requirements:
  - NEC compliance
  - Local code requirements
  - Utility requirements
- Compliance status indicators
- Non-compliance items tracking
- Resolution tracking

---

## Android UI Workflow

### Mobile-Specific UI Patterns

**Bottom Navigation Bar**:
```
[Home] [Designs] [Inspections] [Tasks] [Profile]
```

**Home Tab**:
- Electrical statistics
- Pending designs
- Inspection queue
- Quick actions

**Designs Tab**:
- Electrical design list
- Filter by status
- Quick create button
- Swipe actions

**Inspections Tab**:
- Inspection list
- Filter by type
- Start inspection button
- Swipe actions

**Tasks Tab**:
- Electrical tasks
- Priority indicators
- Due dates

**Profile Tab**:
- Personal profile
- Settings
- Logout

### Touch Interactions and Gestures

**Design Card Swipe Actions**:
- Swipe left: Edit design
- Swipe right: Run compliance check
- Long press: Quick actions

**Inspection Card Swipe Actions**:
- Swipe left: Start inspection
- Swipe right: View details
- Tap: Open inspection form

### Offline Capabilities

**Offline Mode**:
- Cache design data
- Cache customer data
- Queue inspection reports
- Queue design submissions
- Sync when connection restored

### Push Notifications

**Notification Types**:
- Inspection assigned
- Design review completed
- Troubleshooting case assigned
- Compliance alert
- Safety reminder

---

## Data Flow Diagrams

### Electrical Design Creation Flow

```
┌─────────────┐
│ Electrical  │
│  Designs    │
└──────┬──────┘
       │ Click "Create New Design"
       ↓
┌─────────────┐
│ Create      │
│  Design     │
│    Form     │
└──────┬──────┘
       │ Select customer
       │ Enter system parameters
       ↓
┌─────────────┐
│ Load        │
│ Calculations│
└──────┬──────┘
       │ Calculate loads
       │ Size breakers
       ↓
┌─────────────┐
│ Cable       │
│  Sizing     │
└──────┬──────┘
       │ Calculate cable sizes
       │ Check voltage drop
       ↓
┌─────────────┐
│ Schematic   │
│   Upload    │
└──────┬──────┘
       │ Upload electrical schematic
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/electrical-designs
       ↓
┌─────────────┐
│ Electrical  │
│  Controller │
└──────┬──────┘
       │ Create ElectricalDesign record
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Insert ElectricalDesign
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Created design
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show success message
       ↓
┌─────────────┐
│ Electrical  │
│  Designs    │
└─────────────┘
```

### Inspection Completion Flow

```
┌─────────────┐
│ Inspection  │
│    Form     │
└──────┬──────┘
       │ Complete safety checklist
       │ Enter findings
       ↓
┌─────────────┐
│ Compliance  │
│   Check     │
└──────┬──────┘
       │ Verify compliance
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ PUT /api/electrical-inspections/{id}
       ↓
┌─────────────┐
│ Electrical  │
│  Controller │
└──────┬──────┘
       │ Update inspection record
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Update ElectricalInspection
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Updated inspection
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show completion status
       ↓
┌─────────────┐
│ Inspection  │
│    List     │
└─────────────┘
```

---

## Feature-Specific Workflows

### Electrical Design Workflow

**1. Design Initiation**
```
Receive electrical design request
    ↓
Review solar design specifications
    ↓
Understand system requirements
    ↓
Begin electrical design
```

**2. Load Calculations**
```
Calculate total system load
    ↓
Size main breaker
    ↓
Calculate branch circuit loads
    ↓
Size breakers for each circuit
    ↓
Verify protection coordination
```

**3. Cable Sizing**
```
Calculate current for each circuit
    ↓
Determine cable length
    ↓
Calculate voltage drop
    ↓
Select appropriate cable size
    ↓
Verify ampacity
```

**4. Schematic Creation**
```
Create single-line diagram
    ↓
Show system configuration
    ↓
Include protection devices
    ↓
Add grounding scheme
    ↓
Upload schematic
```

**5. Compliance Verification**
```
Run compliance check
    ↓
Verify NEC compliance
    ↓
Check local code requirements
    ↓
Verify utility requirements
    ↓
Address any non-compliance
```

### Inspection Workflow

**1. Pre-Installation Inspection**
```
Schedule pre-installation inspection
    ↓
Review electrical design
    ↓
Verify site readiness
    ↓
Check electrical infrastructure
    ↓
Document findings
```

**2. Post-Installation Inspection**
```
Installation completed
    ↓
Perform electrical inspection
    ↓
Verify installation per design
    ↓
Check safety requirements
    ↓
Test system functionality
    ↓
Document results
    ↓
Approve or require corrections
```

**3. Safety Verification**
```
Verify grounding system
    ↓
Check cable routing
    ↓
Verify breaker sizing
    ↓
Test protection devices
    ↓
Verify labeling
    ↓
Document safety status
```

### Troubleshooting Workflow

**1. Issue Identification**
```
Receive troubleshooting request
    ↓
Review issue description
    ↓
Gather system information
    ↓
Analyze symptoms
```

**2. Diagnostic Process**
```
Perform voltage measurements
    ↓
Measure current draw
    ↓
Check system status
    ↓
Identify root cause
```

**3. Resolution Implementation**
```
Implement solution
    ↓
Replace faulty components
    ↓
Verify fix
    ↓
Document resolution
    ↓
Close case
```

---

## Related Files

### Frontend Files
- `src/pages/Login.tsx` - Login page with role selection
- `src/pages/employee/Dashboard.tsx` - Main dashboard (can be extended for electrical features)
- `src/lib/auth.ts` - Authentication and role management
- `src/lib/api-client.ts` - API client implementation

### Backend Files
- `backend/prisma/schema.prisma` - Database schema (may need ElectricalDesign table added)
- `employee-login-system/src/routes/authRoutes.ts` - Authentication routes

### Components
- `src/components/SidebarLayout.tsx` - Main layout
- `src/components/PageHeader.tsx` - Page headers
- `src/components/StatCard.tsx` - Statistics cards

---

## Security Considerations

### Access Control
- Electrical engineers can only access their own designs
- Can view customer data for electrical work only
- Cannot modify customer information
- Cannot access other engineers' designs without permission

### Data Protection
- Electrical drawings protected
- Calculation data secured
- Inspection reports confidential
- Audit trail for all changes

### Audit Trail
- All design creations logged
- All inspections tracked
- All troubleshooting cases recorded
- All compliance checks documented

---

## Performance Optimization

### Design Data Loading
- Lazy load design details
- Cache calculation results
- Optimize inspection queries
- Paginate design lists

### Real-Time Updates
- WebSocket for inspection notifications
- Real-time collaboration on designs
- Live calculation updates

---

## Future Enhancements

### Planned Features
- AI-powered load optimization
- 3D electrical modeling
- Automated compliance checking
- Integration with electrical CAD software
- Mobile inspection app
- Real-time monitoring integration
- Advanced diagnostic tools
- Integration with utility systems
