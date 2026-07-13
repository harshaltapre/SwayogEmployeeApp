# Sub-Admin / Service Coordinator - Complete Workflow Documentation

## Role Overview

**Role Name**: Sub-Admin / Service Coordinator  
**Hierarchy Level**: Regional/Zone management (between department heads and admin)  
**Reports To**: Admin / Super-Admin  
**Manages**: Department heads, team leads, and field technicians in assigned zone  
**Access Level**: Regional management with customer oversight  

### Responsibilities
- Manage customer relationships in assigned zone/region
- Oversee service operations and AMC visits
- Monitor customer inverter generation data
- Handle customer escalations and complaints
- Coordinate service schedules with teams
- Manage customer credentials and inverter access
- Monitor zone-level performance metrics
- Generate customer and service reports
- Coordinate with admin on regional strategies

---

## Login Mechanism

### Authentication Flow

```
User enters credentials (Email/Login ID + Password)
    ↓
Role selection: "Employee" (with jobRole = "sub_admin" or "service_coordinator")
    ↓
POST /api/auth/login
    ↓
Backend validates credentials against User table
    ↓
Check: role = 'SUB_ADMIN' OR jobRole = 'sub_admin' OR jobRole = 'service_coordinator'
    ↓
Check: isActive = true
    ↓
Check: failedLoginAttempts < 5 and lockoutUntil is null/expired
    ↓
Generate JWT access token + refresh token
    ↓
Store tokens (access in localStorage, refresh in httpOnly cookie)
    ↓
Redirect to: /subadmin/dashboard
    ↓
Detected via: isSubAdminJobRole() function
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
export function isSubAdminJobRole(jobRole?: string): boolean {
  if (!jobRole) return false;
  const normalized = jobRole.trim().toLowerCase().replace(/[_\s-]+/g, "");
  return normalized === "subadmin" || normalized === "servicecoordinator";
}

export function getRoleDashboardPath(role: UserRole, jobRole?: string): string {
  if (role === 'sub_admin' || isSubAdminJobRole(jobRole)) {
    return '/subadmin/dashboard';
  }
  // ... other roles
}
```

**Job Role Detection**:
```typescript
// Sub-admin is identified by:
// - role = 'SUB_ADMIN' OR
// - jobRole = 'sub_admin' OR
// - jobRole = 'service_coordinator'
```

---

## Features & Capabilities

### Feature Access Matrix

| Feature | Access Level | Description |
|---------|-------------|-------------|
| Dashboard | ✅ Full | Customer overview, service metrics, zone performance |
| Customer Management | ✅ Full | View customers, update credentials, manage inverter access |
| Service Management | ✅ Full | AMC visits, service requests, task oversight |
| Inverter Monitoring | ✅ Full | Real-time generation data, historical trends |
| Team Management | ✅ Full | View teams in zone, assign service tasks |
| Attendance Tracking | ✅ Full | Zone attendance overview |
| Performance Tracking | ✅ Full | Zone and team performance metrics |
| Complaint Management | ✅ Full | Handle customer complaints and escalations |
| Credential Management | ✅ Full | Manage customer inverter credentials |
| Reporting | ✅ Full | Customer reports, service reports, generation reports |
| Profile Management | ✅ Full | Update personal information |
| Admin Features | ❌ No | No administrative access to system settings |

### Dashboard Components

**Stat Cards**:
- Total Customers in Zone
- Active AMC Contracts
- Pending Service Requests
- Today's Generation (kWh)
- Customer Satisfaction Score
- Tasks Assigned Today

**Main Sections**:
- Customer selection and overview
- Real-time inverter generation monitoring
- AMC visit scheduling and tracking
- Service request management
- Team assignment and coordination
- Customer credential management

---

## Database Integration

### Primary Tables Used

**User Table** (Sub-admin data)
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
  departmentId        String?
  reportingManagerId  String?
  isActive            Boolean               @default(true)
  failedLoginAttempts Int                   @default(0)
  lockoutUntil        DateTime?
  lastFailedLoginAt   DateTime?
  // ... other fields
}
```

**EmployeeProfile Table**
```prisma
model EmployeeProfile {
  id               String          @id @default(uuid())
  userId           String          @unique
  partnerId        String?
  jobRole          String          @default("sub_admin")
  zone             String?         // Sub-admin's zone
  monthlySalaryInr Int?
  isActive         Boolean         @default(true)
  // ... other fields
}
```

**Customer Table** (Customer management)
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
  warrantyExpiry      DateTime?
  panelBrand          String?
  inverterBrand       String?
  inverterModel       String?
  amcStatus           CustomerAmcStatus @default(NONE)
  amcExpiryDate       DateTime?
  status              CustomerStatus    @default(ACTIVE)
  partnerId           String?
  userId              String?           @unique
  projectStage        Int               @default(0)
  assignedEmployeeId  String?
  commissionAmount    Float?
  commissionStatus    CommissionStatus  @default(PENDING)
  inverterLoginId     String?
  inverterPassword    String?
  inverterApiKey       String?
  inverterDeviceSn     String?
  portalPassword      String?
  latitude            Float?
  longitude           Float?
  // ... other fields
  AmcContract         AmcContract[]
  AmcVisit            AmcVisit[]
  serviceRequests     ServiceRequest[]
  payments            Payment[]
  notifications       CustomerNotification[]
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

**ServiceRequest Table** (Customer complaints)
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

**WaareeGeneration Table** (Inverter generation data)
```prisma
model WaareeGeneration {
  id                Int             @id @default(autoincrement())
  customerId        Int             @unique @map("customer_id")
  todayGeneration   Float           @default(0) @map("today_generation")
  monthlyGeneration Float           @default(0) @map("monthly_generation")
  yearlyGeneration  Float           @default(0) @map("yearly_generation")
  totalGeneration   Float           @default(0) @map("total_generation")
  currentPower      Float           @default(0) @map("current_power")
  status            String          @default("offline")
  lastUpdated       DateTime        @default(now()) @map("last_updated")
  customer          Customer        @relation(fields: [customerId], references: [id])
}
```

**Task Table** (Service tasks)
```prisma
model Task {
  id                    Int              @id @default(autoincrement())
  jobType               String
  description           String
  customerName          String
  customerPhone         String
  address               String
  latitude              Float?
  longitude             Float?
  status                TaskStatus       @default(ASSIGNED)
  scheduledTime         DateTime
  employeeUserId        String?
  assignedById          String
  completionMessage     String?
  completionDocumentUrl String?
  completedAt           DateTime?
  customerId            Int?
  // ... other fields
  taskAssignments       TaskAssignment[]
  taskImages            TaskImage[]
  payments              Payment[]
}
```

### Data Relationships

```
User (Sub-Admin)
  ├── EmployeeProfile (1:1)
  ├── zone (assigned zone)
  ├── AttendanceRecord[] (1:N)
  ├── Task[] (assigned tasks)
  ├── WorkSubmission[] (1:N)
  └── manages customers in zone

Customer
  ├── AmcContract[] (1:N)
  ├── AmcVisit[] (1:N)
  ├── ServiceRequest[] (1:N)
  ├── Payment[] (1:N)
  ├── WaareeGeneration (1:1)
  └── assignedEmployeeId → User (Field Technician)

AmcVisit
  └── assignedEmployee → User (Field Technician)

Task
  ├── employee → User (Field Technician)
  └── assignedBy → User (Sub-Admin/Team Lead)
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

### Customer Management Endpoints

**GET /api/customers**
- Query params: `?city={city}&limit={limit}`
- Response: `Customer[]` in zone/city
- Used in: `src/pages/employee/SubAdminDashboard.tsx`

**GET /api/customers/{id}**
- Response: Single Customer object
- Used in: Customer detail view

**PUT /api/customers/{id}/credentials**
- Request: `{ inverterBrand, inverterLoginId, inverterPassword, inverterApiKey, inverterDeviceSn, city, address, projectStage }`
- Response: Updated Customer
- Used in: `src/pages/employee/SubAdminDashboard.tsx`

**GET /api/subadmin/customer-summary**
- Query params: `?customerId={id}`
- Response: Customer summary with generation data
- Used in: `src/pages/employee/SubAdminDashboard.tsx`

### Inverter Monitoring Endpoints

**GET /api/customers/{id}/inverter-generation**
- Query params: `?period={realtime|daily|monthly|yearly}`
- Response: Inverter generation data
- Used in: `src/pages/employee/SubAdminDashboard.tsx`

**GET /api/customers/{id}/inverter-history**
- Query params: `?period={daily|monthly|yearly}`
- Response: Historical generation data
- Used in: `src/pages/employee/SubAdminDashboard.tsx`

### AMC Management Endpoints

**GET /api/amc-visits**
- Query params: `?customerId={id}&status={status}`
- Response: `AmcVisit[]`
- Used in: `src/pages/employee/AmcManagement.tsx`

**POST /api/amc-visits**
- Request: `{ customerId, scheduledDate, assignedEmployeeId, cleaningNumber, timeSlot }`
- Response: Created AmcVisit
- Used in: Scheduling AMC visits

**PUT /api/amc-visits/{id}/complete**
- Request: `{ completedAt, notes, beforeImageUrl, afterImageUrl, completedByEmployeeId }`
- Response: Updated AmcVisit
- Used in: Completing AMC visits

### Service Request Endpoints

**GET /api/service-requests**
- Query params: `?customerId={id}&status={status}`
- Response: `ServiceRequest[]`
- Used in: `src/pages/employee/SubAdminComplaints.tsx`

**POST /api/service-requests**
- Request: `{ customerId, title, description, address, latitude, longitude }`
- Response: Created ServiceRequest
- Used in: Creating service requests

**PUT /api/service-requests/{id}**
- Request: `{ status, scheduledDate, scheduledTime }`
- Response: Updated ServiceRequest
- Used in: Updating service requests

### Task Management Endpoints

**GET /api/tasks**
- Query params: `?customerId={id}&status={status}`
- Response: `Task[]`
- Used in: Customer task overview

**POST /api/tasks**
- Request: `{ jobType, description, customerName, customerPhone, address, latitude, longitude, scheduledTime, employeeUserId, assignedById, customerId }`
- Response: Created Task
- Used in: Creating service tasks

### Employee Management Endpoints

**GET /api/employees**
- Query params: `?zone={zone}`
- Response: `User[]` in zone
- Used in: Zone team management

---

## Web UI Workflow

### Screen-by-Screen Navigation

```
Login Page (/login)
    ↓ [Authenticate as Sub-Admin]
Sub-Admin Dashboard (/subadmin/dashboard)
    ├── Sub-Admin Dashboard Home (/subadmin/dashboard)
    ├── Sub-Admin Calendar (/subadmin/calendar)
    ├── Sub-Admin Complaints (/subadmin/complaints)
    ├── Sub-Admin Employees (/subadmin/employees)
    ├── Sub-Admin Financials (/subadmin/financials)
    ├── AMC Management (/employee/amc-management)
    ├── Waaree Solar Dashboard (/employee/waaree-solar-dashboard)
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

**Sub-Admin Specific**:
- Select "Employee" role
- Backend detects sub-admin via `jobRole = 'sub_admin'` or `'service_coordinator'`
- Redirects to `/subadmin/dashboard`

### 2. Sub-Admin Dashboard (`/subadmin/dashboard`)

**Layout**: SubAdminLayout with navigation

**Components**:
- PageHeader: "Sub-Admin Dashboard"
- Customer selector (dropdown with search)
- Zone/City filter
- Customer statistics cards

**Customer Selection**:
- Command palette for customer search
- Filter by city
- Shows customer name, ID, location
- Select to view customer details

**Customer Overview Section**:
- Customer information card
- Inverter brand and model
- System size (kW)
- Installation date
- AMC status
- Current generation metrics

**Generation Monitoring Section**:
- Real-time generation display (current power)
- Today's generation (kWh)
- Monthly generation (kWh)
- Yearly generation (kWh)
- Total generation (kWh)
- Generation trend chart
- Period selector (realtime, daily, monthly, yearly)

**Credential Management Section**:
- Inverter brand display
- Connection type (e.g., GrowattPortal, Waaree, Solarman)
- Login ID (with copy button)
- Password (masked, with copy button)
- API Key (if applicable)
- Device Serial Number
- Edit credentials button

**AMC Visits Section**:
- Upcoming AMC visits
- Completed AMC visits
- Schedule new AMC visit button
- AMC visit status tracking

**Service Requests Section**:
- Pending service requests
- In-progress requests
- Completed requests
- Create service request button

### 3. Sub-Admin Calendar (`/subadmin/calendar`)

**Layout**: SubAdminLayout with calendar view

**Components**:
- Monthly calendar view
- Task/visit markers on dates
- Filter by type (AMC visits, service requests, tasks)
- Day detail view
- Drag-and-drop scheduling

**Calendar Features**:
- Color-coded event types
- Click day to view details
- Drag event to reschedule
- Filter by employee
- Export calendar

### 4. Sub-Admin Complaints (`/subadmin/complaints`)

**Layout**: SubAdminLayout with complaint management

**Components**:
- Complaint list with status
- Filter by status (pending, in-progress, resolved)
- Filter by customer
- Complaint detail view
- Resolution tracking

**Complaint Workflow**:
- View complaint details
- Assign to employee
- Schedule resolution
- Track progress
- Update status
- Mark as resolved

### 5. Sub-Admin Employees (`/subadmin/employees`)

**Layout**: SubAdminLayout with employee management

**Components**:
- Employee list in zone
- Filter by role/team
- Employee performance overview
- Task assignment
- Attendance overview

**Employee Management**:
- View employee details
- Assign tasks
- View performance
- Track attendance
- Manage workload

### 6. Sub-Admin Financials (`/subadmin/financials`)

**Layout**: SubAdminLayout with financial overview

**Components**:
- Revenue overview
- Payment tracking
- Commission tracking
- Expense tracking
- Financial reports

### 7. AMC Management (`/employee/amc-management`)

**Layout**: SidebarLayout with AMC management

**Components**:
- AMC contract list
- AMC visit scheduling
- Visit tracking
- Completion verification
- Customer notifications

**AMC Workflow**:
- View AMC contracts
- Schedule cleaning visits
- Assign employees
- Track completion
- Verify with photos
- Update customer

### 8. Waaree Solar Dashboard (`/employee/waaree-solar-dashboard`)

**Layout**: SidebarLayout with inverter monitoring

**Components**:
- Customer inverter list
- Real-time generation data
- Historical trends
- Performance alerts
- System health status

---

## Android UI Workflow

### Mobile-Specific UI Patterns

**Bottom Navigation Bar**:
```
[Home] [Customers] [AMC] [Tasks] [Profile]
```

**Home Tab**:
- Zone statistics
- Today's schedule
- Urgent service requests
- Quick customer search

**Customers Tab**:
- Customer list with search
- Filter by city/status
- Customer detail view
- Inverter monitoring
- Credential management

**AMC Tab**:
- AMC visit calendar
- Upcoming visits
- Visit history
- Schedule new visit

**Tasks Tab**:
- Assigned tasks
- Service requests
- Task assignment
- Progress tracking

**Profile Tab**:
- Personal profile
- Zone settings
- Notification preferences
- Logout

### Touch Interactions and Gestures

**Customer Card Swipe Actions**:
- Swipe left: View inverter data
- Swipe right: Create service request
- Long press: Quick actions menu

**AMC Visit Gestures**:
- Drag to reschedule
- Tap to view details
- Swipe to complete

**Task Assignment Flow**:
- Tap employee
- Tap "Assign Task"
- Fill details
- Submit

### Offline Capabilities

**Offline Mode**:
- Cache customer data
- Cache AMC schedules
- Queue service requests
- Queue task assignments
- Sync when connection restored

### Push Notifications

**Notification Types**:
- New service request
- AMC visit due
- Inverter alert
- Task completion
- Customer escalation
- Generation anomaly

---

## Data Flow Diagrams

### Customer Selection and Data Loading Flow

```
┌─────────────┐
│ Sub-Admin   │
│  Dashboard  │
└──────┬──────┘
       │ Load page
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ GET /api/customers?city={city}&limit=200
       ↓
┌─────────────┐
│  Customer   │
│  Controller │
└──────┬──────┘
       │ Query Customer table
       │ Filter by city
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Customer[]
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Customer[] with basic info
       ↓
┌─────────────┐
│ Customer    │
│  Selector   │
└──────┬──────┘
       │ User selects customer
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ GET /api/subadmin/customer-summary?customerId={id}
       │ GET /api/customers/{id}/inverter-generation?period=realtime
       ↓
┌─────────────┐
│  Customer   │
│  Controller │
└──────┬──────┘
       │ Query Customer
       │ Query WaareeGeneration
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Customer with full details
       │ WaareeGeneration data
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Complete customer data
       ↓
┌─────────────┐
│  UI Render  │
└──────┬──────┘
       │ Display customer overview
       │ Show generation data
       │ Render charts
       ↓
┌─────────────┐
│ Sub-Admin   │
│  Dashboard  │
└─────────────┘
```

### Credential Update Flow

```
┌─────────────┐
│ Credential  │
│   Modal     │
└──────┬──────┘
       │ Click "Edit Credentials"
       ↓
┌─────────────┐
│ Credential  │
│   Form      │
└──────┬──────┘
       │ Fill inverter details
       │ Enter login credentials
       │ Enter API key/device SN
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ PUT /api/customers/{id}/credentials
       ↓
┌─────────────┐
│  Customer   │
│  Controller │
└──────┬──────┘
       │ Validate credentials
       │ Update Customer record
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Update Customer
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Updated Customer
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show success message
       │ Update credential display
       ↓
┌─────────────┐
│ Sub-Admin   │
│  Dashboard  │
└─────────────┘
```

---

## Feature-Specific Workflows

### Customer Management Workflow

**1. Customer Onboarding**
```
Sub-Admin receives new customer
    ↓
Creates customer record
    ↓
Enters system details
    ↓
Sets up inverter credentials
    ↓
Schedules installation
    ↓
Assigns to team
```

**2. Customer Monitoring**
```
Sub-Admin selects customer
    ↓
Views generation data
    ↓
Checks system health
    ↓
Identifies issues
    ↓
Takes corrective action
```

**3. Credential Management**
```
Customer reports inverter access issue
    ↓
Sub-Admin opens customer profile
    ↓
Edits credentials
    ↓
Tests connection
    ↓
Updates customer
```

### AMC Management Workflow

**1. AMC Contract Setup**
```
Customer purchases AMC
    ↓
Sub-Admin creates AMC contract
    ↓
Sets contract duration
    ↓
Defines cleaning schedule
    ↓
Assigns to zone
```

**2. AMC Visit Scheduling**
```
AMC visit due
    ↓
Sub-Admin schedules visit
    ↓
Selects date and time
    ↓
Assigns employee
    ↓
Notifies customer
    ↓
Notifies employee
```

**3. AMC Visit Completion**
```
Employee completes AMC visit
    ↓
Submits before/after photos
    ↓
Sub-Admin reviews completion
    ↓
Verifies work quality
    ↓
Approves completion
    ↓
Updates customer
```

### Service Request Workflow

**1. Service Request Creation**
```
Customer reports issue
    ↓
Sub-Admin creates service request
    ↓
Enters issue details
    ↓
Sets priority
    ↓
Assigns to employee
```

**2. Service Request Resolution**
```
Employee addresses issue
    ↓
Updates request status
    ↓
Sub-Admin monitors progress
    ↓
Customer confirms resolution
    ↓
Request marked complete
```

**3. Escalation Handling**
```
Issue not resolved
    ↓
Customer escalates
    ↓
Sub-Admin investigates
    ↓
Reassigns if needed
    ↓
Provides update to customer
```

### Inverter Monitoring Workflow

**1. Real-Time Monitoring**
```
Sub-Admin opens customer dashboard
    ↓
Views real-time generation
    ↓
Checks current power output
    ↓
Compares to expected output
    ↓
Identifies underperformance
```

**2. Historical Analysis**
```
Sub-Admin selects period
    ↓
Views generation trends
    ↓
Identifies patterns
    ↓
Compares to previous periods
    ↓
Generates insights
```

**3. Alert Management**
```
System detects anomaly
    ↓
Sends alert to sub-admin
    ↓
Sub-Admin investigates
    ↓
Determines cause
    ↓
Takes corrective action
```

---

## Related Files

### Frontend Files
- `src/pages/Login.tsx` - Login page with role selection
- `src/pages/employee/SubAdminDashboard.tsx` - Main sub-admin dashboard
- `src/pages/employee/SubAdminCalendar.tsx` - Calendar view
- `src/pages/employee/SubAdminComplaints.tsx` - Complaint management
- `src/pages/employee/SubAdminEmployees.tsx` - Employee management
- `src/pages/employee/SubAdminFinancials.tsx` - Financial overview
- `src/pages/employee/AmcManagement.tsx` - AMC management
- `src/pages/employee/WaareeSolarDashboard.tsx` - Inverter monitoring
- `src/lib/auth.ts` - Authentication and role management
- `src/lib/api-client.ts` - API client with sub-admin endpoints

### Backend Files
- `backend/prisma/schema.prisma` - Database schema
- `backend/routes/customers.js` - Customer routes
- `employee-login-system/src/routes/authRoutes.ts` - Authentication routes

### Components
- `src/components/subadmin/SubAdminLayout.tsx` - Sub-admin layout
- `src/components/PageHeader.tsx` - Page headers
- `src/components/StatCard.tsx` - Statistics cards

---

## Security Considerations

### Access Control
- Sub-admins can only access customers in their zone
- Cannot access other zones' data
- Cannot access system-level settings
- Credential access requires special permissions

### Data Privacy
- Customer credentials encrypted
- Inverter data protected
- Personal information secured
- Access logged and audited

### Audit Trail
- All credential changes logged
- All service requests tracked
- All AMC visits recorded
- All customer access logged

---

## Performance Optimization

### Customer Data Loading
- Lazy load customer details
- Cache generation data
- Paginate customer lists
- Optimize inverter API calls

### Real-Time Updates
- WebSocket for generation updates
- Real-time service request alerts
- Live AMC visit tracking

---

## Future Enhancements

### Planned Features
- AI-powered anomaly detection
- Predictive maintenance scheduling
- Automated customer insights
- Mobile customer app integration
- Advanced generation analytics
- Smart AMC scheduling
- Integration with payment gateways
- Customer self-service portal
