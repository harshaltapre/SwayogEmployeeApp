# Department Head - Complete Workflow Documentation

## Role Overview

**Role Name**: Department Head  
**Hierarchy Level**: Senior management (overseeing entire department)  
**Reports To**: Sub-Admin / Admin / Super-Admin  
**Manages**: Team leads and their teams within the department  
**Access Level**: Department-level management access  

### Responsibilities
- Oversee entire department operations
- Manage multiple team leads and their teams
- Set department-level goals and targets
- Monitor department performance metrics
- Allocate resources across teams
- Handle high-level escalations
- Coordinate with other departments
- Report to sub-admin/admin on department progress
- Ensure department meets organizational objectives

---

## Login Mechanism

### Authentication Flow

```
User enters credentials (Email/Login ID + Password)
    ↓
Role selection: "Employee" (with role = 'DEPARTMENT_HEAD')
    ↓
POST /api/auth/login
    ↓
Backend validates credentials against User table
    ↓
Check: role = 'DEPARTMENT_HEAD'
    ↓
Check: departmentId is set
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
Additional check: isSubAdminJobRole() → false
    ↓
Additional check: isInventoryExecutiveJobRole() → false
    ↓
Final redirect: /employee/dashboard
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
if (role === 'team_lead' || role === 'department_head' || role === 'employee') {
  return '/employee/dashboard';
}
```

**Department Identification**:
```typescript
// Department head is identified by:
// - role = 'DEPARTMENT_HEAD'
// - departmentId must be set
// - Can view all users with same departmentId
```

---

## Features & Capabilities

### Feature Access Matrix

| Feature | Access Level | Description |
|---------|-------------|-------------|
| Dashboard | ✅ Full | Department overview + personal tasks |
| Task Management | ✅ Full | View all department tasks, assign to teams |
| Team Management | ✅ Full | View all team leads, their teams, performance |
| Department Management | ✅ Full | Department-level settings and policies |
| Attendance Tracking | ✅ Full | Department attendance overview and reports |
| Work Submissions | ✅ Full | Review all department work submissions |
| Daily Commits | ✅ Full | View all department daily commits |
| Performance Tracking | ✅ Full | Department performance analytics |
| Profile Management | ✅ Full | Update personal information |
| Calendar View | ✅ Full | Department schedule and resource planning |
| Resource Allocation | ✅ Full | Allocate resources across teams |
| Reporting | ✅ Full | Generate department-level reports |
| Customer Management | ❌ No | Cannot manage customer data |
| Admin Features | ❌ No | No administrative access |

### Dashboard Components

**Stat Cards**:
- Total Employees in Department
- Active Tasks (department-wide)
- Department Attendance %
- Department Performance Score
- Tasks Completed This Month
- Pending Escalations

**Main Sections**:
- Department overview metrics
- Team leads summary
- Department task distribution
- Department attendance trends
- Performance comparison across teams
- Resource utilization

---

## Database Integration

### Primary Tables Used

**User Table** (Department head data + department relationships)
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
  departmentId        String?               // Department head's department
  reportingManagerId  String?               // Department head's manager
  isActive            Boolean               @default(true)
  failedLoginAttempts Int                   @default(0)
  lockoutUntil        DateTime?
  lastFailedLoginAt   DateTime?
  // ... other fields
  department          Department?           @relation(fields: [departmentId], references: [id])
  directReports       User[]                @relation("user_reporting")  // Team leads
}
```

**Department Table**
```prisma
model Department {
  id          String         @id @default(uuid())
  code        DepartmentCode @unique
  name        String         @unique
  description String?
  isActive    Boolean        @default(true)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  users       User[]
}
```

**DepartmentCode Enum**
```prisma
enum DepartmentCode {
  OPERATIONS
  SERVICE_MAINTENANCE
  INVENTORY
  FINANCE
  SALES
  HR
}
```

**EmployeeProfile Table**
```prisma
model EmployeeProfile {
  id               String          @id @default(uuid())
  userId           String          @unique
  partnerId        String?
  jobRole          String          @default("department_head")
  zone             String?
  monthlySalaryInr Int?
  isActive         Boolean         @default(true)
  // ... other fields
}
```

**Task Table** (All department tasks)
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
  // ... other fields
  taskAssignments       TaskAssignment[]
}
```

**AttendanceRecord Table** (Department attendance)
```prisma
model AttendanceRecord {
  id           String           @id @default(uuid())
  employeeId   String
  date         DateTime         @db.Date
  checkInTime  DateTime?
  checkOutTime DateTime?
  totalMinutes Int?
  status       AttendanceStatus @default(PRESENT)
  notes        String?
  employee     User             @relation(fields: [employeeId], references: [id])
}
```

**WorkSubmission Table** (All department work submissions)
```prisma
model WorkSubmission {
  id          String     @id @default(uuid())
  employeeId  String
  taskId      Int?
  title       String
  description String
  proofUrl    String?
  proofNotes  String?
  hoursSpent  Float      @default(0)
  submittedAt DateTime   @default(now())
  reviewedAt  DateTime?
  reviewedBy  String?
  reviewScore Int?
  reviewNotes String?
  status      WorkStatus @default(PENDING)
  employee    User       @relation(fields: [employeeId], references: [id])
}
```

**PerformanceSnapshot Table** (Department performance)
```prisma
model PerformanceSnapshot {
  id                 String   @id @default(uuid())
  employeeId         String
  month              Int
  year               Int
  attendancePercent  Float    @default(0)
  taskCompletionRate Float    @default(0)
  avgWorkScore       Float    @default(0)
  totalHoursLogged   Float    @default(0)
  performanceScore   Float    @default(0)
  daysPresent        Int      @default(0)
  daysAbsent         Int      @default(0)
  tasksAssigned      Int      @default(0)
  tasksCompleted     Int      @default(0)
  workSubmissions    Int      @default(0)
  employee           User     @relation(fields: [employeeId], references: [id])
}
```

### Data Relationships

```
User (Department Head)
  ├── EmployeeProfile (1:1)
  ├── Department (N:1) - Belongs to department
  ├── AttendanceRecord[] (1:N) - Own attendance
  ├── Task[] (assigned tasks via employeeUserId)
  ├── WorkSubmission[] (1:N) - Own submissions
  ├── DailyCommit[] (1:N) - Own commits
  ├── PerformanceSnapshot[] (1:N) - Own performance
  └── directReports[] (1:N) - Team leads in department

Department
  └── users[] (1:N) - All employees in department

User (Team Lead)
  └── reportingManager → User (Department Head)
  └── directReports[] → User (Team Members)

User (Team Member)
  └── reportingManager → User (Team Lead)
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

### Department Management Endpoints

**GET /api/departments/{id}**
- Response: Department object with all users
- Used in: Department overview

**GET /api/departments/{id}/employees**
- Query params: `?includeTeamLeads=true`
- Response: `User[]` all employees in department
- Used in: Department employee list

**GET /api/departments/{id}/team-leads**
- Response: `User[]` team leads in department
- Used in: Team lead management

**GET /api/departments/{id}/statistics**
- Query params: `?month={month}&year={year}`
- Response: Department statistics (attendance, performance, tasks)
- Used in: Department dashboard

**GET /api/departments/{id}/performance**
- Query params: `?month={month}&year={year}`
- Response: Aggregated performance metrics for department
- Used in: Department performance tracking

### Task Management Endpoints

**GET /api/tasks**
- Query params: `?departmentId={id}`
- Response: `Task[]` all tasks in department
- Used in: Department task overview

**POST /api/tasks**
- Request: `{ jobType, description, customerName, customerPhone, address, latitude, longitude, scheduledTime, employeeUserId, assignedById }`
- Response: Created Task object
- Used in: Creating department tasks

**POST /api/tasks/{id}/reassign**
- Request: `{ newEmployeeUserId, reason }`
- Response: Updated Task
- Used in: Reassigning tasks across teams

### Attendance Endpoints

**GET /api/attendance/department**
- Query params: `?departmentId={id}&month={month}&year={year}`
- Response: `AttendanceRecord[]` for entire department
- Used in: Department attendance reports

**GET /api/attendance/department-summary**
- Query params: `?departmentId={id}&month={month}&year={year}`
- Response: Aggregated attendance statistics
- Used in: Department attendance overview

### Performance Endpoints

**GET /api/performance/department**
- Query params: `?departmentId={id}&month={month}&year={year}`
- Response: `PerformanceSnapshot[]` for all department employees
- Used in: Department performance analysis

**GET /api/performance/department-comparison**
- Query params: `?departmentId={id}&month={month}&year={year}`
- Response: Performance comparison across teams
- Used in: Team performance comparison

### Work Review Endpoints

**GET /api/work-submissions/department**
- Query params: `?departmentId={id}&status={status}`
- Response: `WorkSubmission[]` for department
- Used in: Department work review

**PUT /api/work-submissions/{id}/review**
- Request: `{ reviewScore, reviewNotes, status: "APPROVED"|"REJECTED"|"REVISION" }`
- Response: Updated WorkSubmission
- Used in: Reviewing department work

---

## Web UI Workflow

### Screen-by-Screen Navigation

```
Login Page (/login)
    ↓ [Authenticate as Department Head]
Employee Dashboard (/employee/dashboard)
    ├── Tasks Page (/employee/tasks)
    ├── Attendance Page (/employee/attendance)
    ├── Daily Commit Page (/employee/daily-commit)
    ├── Profile Page (/employee/profile)
    ├── Settings Page (/employee/settings)
    ├── Employees Under Me (/employee/employees-under-me)
    ├── Department Overview (/employee/department-overview) [DEPT HEAD ONLY]
    ├── Team Leads Management (/employee/team-leads) [DEPT HEAD ONLY]
    ├── Department Reports (/employee/department-reports) [DEPT HEAD ONLY]
    └── Dashboard Home (/employee/dashboard-home)
```

### 1. Login Screen (`/login`)

**Components**:
- Role selector (Employee, Admin, Partner, Customer, Super Admin)
- Email/Login ID input
- Password input with show/hide toggle
- "Keep me logged in" checkbox
- Sign in button
- "Forgot Password" link

**Department Head Specific**:
- Select "Employee" role
- Backend detects department head via `role = 'DEPARTMENT_HEAD'`
- Redirects to `/employee/dashboard` with department-level permissions

### 2. Employee Dashboard (`/employee/dashboard`)

**Layout**: SidebarLayout with navigation

**Department Head Specific Components**:
- Department statistics cards
- Total employees count
- Department attendance %
- Department performance score
- Active tasks (department-wide)
- "View Department" button linking to Department Overview

**Enhanced Task List**:
- Shows personal tasks
- Shows department tasks overview
- Filter by "My Tasks" vs "Department Tasks"

**Enhanced Attendance Card**:
- Shows own attendance
- Shows department attendance summary

### 3. Department Overview Page (`/employee/department-overview`) [DEPT HEAD ONLY]

**Layout**: SidebarLayout with department management

**Components**:
- PageHeader: "Department Overview" with department name
- Department statistics cards:
  - Total Employees
  - Total Team Leads
  - Active Tasks
  - Department Attendance %
  - Department Performance Score
  - Pending Escalations

**Team Leads Section**:
- List of all team leads in department
- Each team lead shows:
  - Name and photo
  - Team size
  - Team performance
  - Active tasks
  - Attendance %
- Action buttons: View Team, Assign Task

**Department Tasks Section**:
- Task distribution by team
- Task status breakdown
- Priority tasks
- Overdue tasks

**Department Performance Section**:
- Performance trends chart
- Team comparison chart
- Top performers
- Areas needing improvement

**Department Attendance Section**:
- Attendance calendar (department view)
- Attendance trends
- Absenteeism analysis
- Leave patterns

### 4. Team Leads Management Page (`/employee/team-leads`) [DEPT HEAD ONLY]

**Layout**: SidebarLayout with team lead management

**Components**:
- PageHeader: "Team Leads Management"
- Team leads list with detailed stats
- Performance comparison
- Workload distribution
- Resource allocation tools

**Team Lead Detail View**:
- Team lead profile
- Team overview
- Team performance metrics
- Team task distribution
- Team attendance
- Action buttons:
  - View team details
  - Reassign resources
  - Set targets
  - Schedule review

### 5. Department Reports Page (`/employee/department-reports`) [DEPT HEAD ONLY]

**Layout**: SidebarLayout with reporting

**Report Types**:
- Performance Report
- Attendance Report
- Task Report
- Resource Utilization Report
- Escalation Report

**Report Generation**:
- Select report type
- Select date range
- Select filters (team, employee, etc.)
- Generate report
- Export (PDF/Excel)
- Schedule recurring reports

---

## Android UI Workflow

### Mobile-Specific UI Patterns

**Bottom Navigation Bar**:
```
[Home] [Department] [Teams] [Reports] [Profile]
```

**Home Tab**:
- Department stat cards
- Personal task overview
- Quick actions
- Notifications

**Department Tab** [DEPT HEAD ONLY]:
- Department overview
- Department metrics
- Department tasks
- Department attendance

**Teams Tab** [DEPT HEAD ONLY]:
- Team leads list
- Team performance comparison
- Resource allocation
- Team communication

**Reports Tab** [DEPT HEAD ONLY]:
- Report generation
- Scheduled reports
- Report history
- Analytics dashboard

**Profile Tab**:
- Personal profile
- Department settings
- Notification preferences
- Logout

### Touch Interactions and Gestures

**Team Lead Card Swipe Actions**:
- Swipe left: View team details
- Swipe right: Quick actions menu
- Long press: Performance details

**Report Generation Flow**:
- Tap report type
- Select parameters
- Tap "Generate"
- View report
- Tap "Export"

**Resource Allocation Gestures**:
- Drag and drop employees to teams
- Pinch to resize resource allocation
- Tap to edit allocation

### Offline Capabilities

**Offline Mode**:
- Cache department data
- Cache team lead data
- Cache reports
- Queue report generation
- Sync when connection restored

### Push Notifications

**Notification Types**:
- Department performance alerts
- Team lead escalations
- Resource shortage alerts
- Attendance anomalies
- Task deadline alerts
- Report generation complete

---

## Data Flow Diagrams

### Department Data Retrieval Flow

```
┌─────────────┐
│ Department  │
│  Overview   │
│    Page     │
└──────┬──────┘
       │ Load page
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ GET /api/departments/{id}/statistics
       │ GET /api/departments/{id}/team-leads
       │ GET /api/departments/{id}/performance
       ↓
┌─────────────┐
│ Department  │
│  Controller │
└──────┬──────┘
       │ Query Department table
       │ Query User table (filter by departmentId)
       │ Query PerformanceSnapshot (aggregate)
       │ Query AttendanceRecord (aggregate)
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Department data
       │ User[] (department employees)
       │ Aggregated statistics
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Complete department data
       ↓
┌─────────────┐
│  UI Render  │
└──────┬──────┘
       │ Display department overview
       │ Render team leads
       │ Show performance charts
       ↓
┌─────────────┐
│ Department  │
│  Overview   │
│    Page     │
└─────────────┘
```

### Department Performance Analysis Flow

```
┌─────────────┐
│ Department  │
│ Performance │
│    Section  │
└──────┬──────┘
       │ Select month/year
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ GET /api/performance/department?departmentId={id}&month={m}&year={y}
       │ GET /api/performance/department-comparison?departmentId={id}&month={m}&year={y}
       ↓
┌─────────────┐
│ Performance │
│  Controller │
└──────┬──────┘
       │ Query PerformanceSnapshot
       │ Filter by departmentId
       │ Aggregate by team
       │ Calculate trends
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ PerformanceSnapshot[]
       │ Aggregated team data
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Performance data with team breakdown
       ↓
┌─────────────┐
│ Chart       │
│  Rendering  │
└──────┬──────┘
       │ Generate performance charts
       │ Team comparison charts
       │ Trend lines
       ↓
┌─────────────┐
│ Department  │
│ Performance │
│    Section  │
└─────────────┘
```

---

## Feature-Specific Workflows

### Department Management Workflow

**1. Department Overview**
```
Department Head logs in
    ↓
Navigates to "Department Overview"
    ↓
Views department statistics
    ↓
Reviews team leads and their teams
    ↓
Identifies areas needing attention
```

**2. Team Lead Management**
```
Department Head selects team lead
    ↓
Views team lead's performance
    ↓
Reviews team under team lead
    ↓
Identifies issues or opportunities
    ↓
Takes action (reassign resources, set targets, etc.)
```

**3. Resource Allocation**
```
Department Head reviews resource utilization
    ↓
Identifies resource gaps or surpluses
    ↓
Reallocates resources across teams
    ↓
Monitors impact of changes
    ↓
Adjusts allocation as needed
```

### Performance Management Workflow

**1. Department Performance Monitoring**
```
Department Head views department performance dashboard
    ↓
Reviews department-level metrics
    ↓
Compares across teams
    ↓
Identifies top and bottom performing teams
    ↓
Investigates performance variations
```

**2. Team Lead Performance Review**
```
Department Head schedules team lead review
    ↓
Gathers team performance data
    ↓
Reviews team lead's management effectiveness
    ↓
Provides feedback and coaching
    ↓
Sets improvement goals
```

**3. Department Performance Planning**
```
Department Head sets department goals
    ↓
Breaks down goals by team
    ↓
Communicates with team leads
    ↓
Monitors progress regularly
    ↓
Adjusts strategies as needed
```

### Escalation Handling Workflow

**1. High-Level Escalations**
```
Team lead escalates issue
    ↓
Department Head receives notification
    ↓
Assesses escalation severity
    ↓
Determines if can resolve or needs to escalate further
    ↓
Takes appropriate action or escalates to sub-admin
```

**2. Cross-Department Coordination**
```
Issue requires cross-department coordination
    ↓
Department Head contacts other department heads
    ↓
Coordinates resources and efforts
    ↓
Monitors progress
    ↓
Ensures resolution
```

### Reporting Workflow

**1. Report Generation**
```
Department Head selects report type
    ↓
Sets parameters (date range, filters)
    ↓
Generates report
    ↓
Reviews report for accuracy
    ↓
Exports or shares report
```

**2. Scheduled Reports**
```
Department Head sets up recurring report
    ↓
Defines schedule (daily, weekly, monthly)
    ↓
Sets recipients
    ↓
System automatically generates and sends
    ↓
Department Head reviews and acts on insights
```

**3. Analytics Dashboard**
```
Department Head opens analytics dashboard
    ↓
Views key performance indicators
    ↓
Drills down into specific metrics
    ↓
Identifies trends and patterns
    ↓
Makes data-driven decisions
```

---

## Related Files

### Frontend Files
- `src/pages/Login.tsx` - Login page with role selection
- `src/pages/employee/Dashboard.tsx` - Main dashboard with department overview
- `src/pages/employee/EmployeesUnderMe.tsx` - Team management (can be extended for department view)
- `src/lib/auth.ts` - Authentication and role management
- `src/lib/api-client.ts` - API client with department endpoints

### Backend Files
- `backend/prisma/schema.prisma` - Database schema with department relationships
- `employee-login-system/src/routes/authRoutes.ts` - Authentication routes

### Components
- `src/components/SidebarLayout.tsx` - Main layout
- `src/components/PageHeader.tsx` - Page headers
- `src/components/StatCard.tsx` - Statistics cards

---

## Security Considerations

### Access Control
- Department heads can only access their department data
- Cannot access other departments' data
- Cannot access organization-level data
- Review permissions limited to own department

### Data Privacy
- Department-level performance data visible only to department head
- Team lead performance visible to department head
- Personal information protected

### Audit Trail
- All resource allocations logged
- All performance changes logged
- All escalations tracked
- All report generations logged

---

## Performance Optimization

### Department Data Loading
- Lazy load team details
- Cache department statistics
- Paginate employee lists
- Optimize aggregation queries

### Real-time Updates
- WebSocket for department alerts
- Real-time performance updates
- Live attendance monitoring

---

## Future Enhancements

### Planned Features
- AI-powered resource optimization
- Predictive performance analytics
- Automated department insights
- Cross-department collaboration tools
- Advanced department reporting
- Mobile department management app
- Integration with HR systems
- Budget and cost tracking
