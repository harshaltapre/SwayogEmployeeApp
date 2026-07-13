# Other Position - Complete Workflow Documentation

## Role Overview

**Role Name**: Other Position  
**Hierarchy Level**: Variable (depends on specific position)  
**Reports To**: Variable (depends on department and role)  
**Manages**: Variable (depends on specific position)  
**Access Level**: Variable access based on assigned permissions  

### Responsibilities
- Responsibilities vary based on specific position
- May include general administrative tasks
- May include specialized functions not covered by other roles
- Follows department-specific workflows
- Adheres to company policies and procedures
- Coordinates with relevant teams as needed
- Maintains records and documentation
- Reports to assigned supervisor
- Completes assigned tasks and projects

---

## Login Mechanism

### Authentication Flow

```
User enters credentials (Email/Login ID + Password)
    ↓
Role selection: "Employee" (with jobRole = "other position")
    ↓
POST /api/auth/login
    ↓
Backend validates credentials against User table
    ↓
Check: role = 'EMPLOYEE' with jobRole = 'other position'
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
Dashboard customized based on specific position permissions
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
  if (role === 'employee' && jobRole === 'other position') {
    return '/employee/dashboard';
  }
  // ... other roles
}
```

**Job Role Detection**:
```typescript
// Other Position is identified by:
// - role = 'EMPLOYEE' with jobRole = 'other position'
```

---

## Features & Capabilities

### Feature Access Matrix

| Feature | Access Level | Description |
|---------|-------------|-------------|
| Dashboard | ✅ Variable | Based on specific position permissions |
| Task Management | ✅ Variable | View assigned tasks based on role |
| Attendance Tracking | ✅ Full | Own attendance tracking |
| Profile Management | ✅ Full | Update personal information |
| Department Access | ✅ Variable | Based on assigned department |
| Customer Management | ❌ Variable | Based on specific position needs |
| System Configuration | ❌ No | No system configuration access |
| Admin Features | ❌ No | No administrative access |

### Dashboard Components

**Stat Cards** (Variable based on position):
- Assigned Tasks
- Pending Items
- Completed Items
- Attendance Status
- Department-specific metrics

**Main Sections** (Variable based on position):
- Task list
- Department-specific tools
- Attendance tracking
- Profile management
- Resources and documentation

---

## Database Integration

### Primary Tables Used

**User Table** (Other Position data)
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
  departmentId        String?               // Assigned department
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
  jobRole          String          @default("other position")
  zone             String?
  monthlySalaryInr Int?
  isActive         Boolean         @default(true)
  customFields     Json?           // For position-specific data
  // ... other fields
}
```

**Task Table** (Position-specific tasks)
```prisma
model Task {
  id                    Int              @id @default(autoincrement())
  jobType               String           // Variable based on position
  description           String
  customerName          String?          // May or may not be applicable
  status                TaskStatus       @default(ASSIGNED)
  scheduledTime         DateTime
  employeeUserId        String?          // Other position employee
  assignedById          String
  completedAt           DateTime?
  // ... other fields
}
```

### Custom Tables (Potential Future Implementation)

**CustomWorkflow Table** (Position-specific workflows)
```prisma
model CustomWorkflow {
  id                    String   @id @default(uuid())
  positionName          String
  workflowName          String
  workflowSteps         Json
  requiredFields        Json
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

**PositionPermissions Table** (Permission management)
```prisma
model PositionPermissions {
  id                    String   @id @default(uuid())
  positionName          String
  permissionKey         String
  permissionValue       Boolean
  department            String?
  createdAt             DateTime @default(now())
}
```

### Data Relationships

```
User (Other Position)
  ├── EmployeeProfile (1:1)
  ├── Department (N:1) - Assigned department
  ├── reportingManager → User (Supervisor)
  └── Task[] (assigned tasks based on position)
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

### Task Management Endpoints

**GET /api/tasks**
- Query params: `?employeeUserId={id}`
- Response: `Task[]` assigned to employee
- Used in: Task list

**POST /api/tasks/{id}/complete**
- Request: `{ completionMessage, completedAt }`
- Response: Updated Task
- Used in: Completing tasks

### Custom Workflow Endpoints

**GET /api/custom-workflows/{positionName}**
- Response: `CustomWorkflow[]` for position
- Used in: Loading position-specific workflows

**POST /api/custom-workflows/execute**
- Request: `{ workflowId, data }`
- Response: Workflow execution result
- Used in: Executing custom workflows

---

## Web UI Workflow

### Screen-by-Screen Navigation

```
Login Page (/login)
    ↓ [Authenticate as Other Position]
Employee Dashboard (/employee/dashboard)
    ├── Tasks Page (/employee/tasks)
    ├── Department Tools (/employee/department-tools) [Variable]
    ├── Attendance Page (/employee/attendance)
    ├── Profile Page (/employee/profile)
    └── Custom Workflows (/employee/custom-workflows) [Variable]
```

### 1. Login Screen (`/login`)

**Components**:
- Role selector (Employee, Admin, Partner, Customer, Super Admin)
- Email/Login ID input
- Password input with show/hide toggle
- "Keep me logged in" checkbox
- Sign in button
- "Forgot Password" link

**Other Position Specific**:
- Select "Employee" role
- Backend detects other position via `jobRole = 'other position'`
- Redirects to `/employee/dashboard` with features based on specific position

### 2. Employee Dashboard (`/employee/dashboard`)

**Layout**: SidebarLayout with navigation

**Other Position Specific Components**:
- Dashboard varies based on specific position
- May include department-specific tools
- May include custom workflows
- Task list based on position
- Attendance tracking

### 3. Tasks Page (`/employee/tasks`)

**Layout**: SidebarLayout with task management

**Components**:
- PageHeader: "Tasks"
- Task list with filters:
  - Status
  - Priority
  - Date range
- Task details

**Task Card**:
- Task title
- Description
- Job type
- Due date
- Status badge
- Action buttons:
  - Start Task
  - View Details
  - Complete

### 4. Department Tools Page (`/employee/department-tools`) [Variable]

**Layout**: Variable based on department

**Components**:
- PageHeader: Department-specific header
- Department-specific tools and forms
- Custom workflows
- Department resources
- Reports and analytics

### 5. Custom Workflows Page (`/employee/custom-workflows`) [Variable]

**Layout**: Variable based on workflow

**Components**:
- Available workflows list
- Workflow execution forms
- Workflow history
- Workflow status tracking

---

## Android UI Workflow

### Mobile-Specific UI Patterns

**Bottom Navigation Bar** (Variable based on position):
```
[Home] [Tasks] [Tools] [Profile]
```

**Home Tab**:
- Position-specific statistics
- Assigned tasks
- Quick actions

**Tasks Tab**:
- Task list
- Filter by status
- Start/Complete buttons

**Tools Tab**:
- Department-specific tools
- Custom workflows
- Resources

**Profile Tab**:
- Personal profile
- Settings
- Logout

### Touch Interactions and Gestures

**Task Card Swipe Actions**:
- Swipe left: Start task
- Swipe right: View details
- Tap: Open task form

### Offline Capabilities

**Offline Mode**:
- Cache task data
- Cache department tools
- Queue workflow executions
- Sync when connection restored

### Push Notifications

**Notification Types**:
- New task assigned
- Workflow completion
- Department-specific alerts
- Attendance reminders

---

## Position-Specific Workflow

**Note**: Workflows vary significantly based on the specific position. Common patterns include:

**1. General Administrative Tasks**
```
Receive administrative task
    ↓
Review requirements
    ↓
Execute task
    ↓
Document completion
    ↓
Submit for review
```

**2. Department-Specific Tasks**
```
Receive department task
    ↓
Access department tools
    ↓
Execute workflow
    ↓
Document results
    ↓
Complete task
```

**3. Custom Workflow Execution**
```
Select custom workflow
    ↓
Fill required fields
    ↓
Execute workflow
    ↓
Review results
    ↓
Document completion
```

---

## Data Flow Diagrams

### Generic Task Completion Flow

```
┌─────────────┐
│ Tasks       │
│    Page     │
└──────┬──────┘
       │ Select task
       ↓
┌─────────────┐
│ Task        │
│   Detail    │
└──────┬──────┘
       │ Start task
       ↓
┌─────────────┐
│ Task        │
│   Form      │
└──────┬──────┘
       │ Complete task
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/tasks/{id}/complete
       ↓
┌─────────────┐
│  Task       │
│  Controller │
└──────┬──────┘
       │ Update Task status
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Update Task
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Updated task
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show completion status
       ↓
┌─────────────┐
│ Tasks       │
│    Page     │
└─────────────┘
```

---

## Related Files

### Frontend Files
- `src/pages/Login.tsx` - Login page with role selection
- `src/pages/employee/Dashboard.tsx` - Main dashboard (can be extended for position-specific features)
- `src/lib/auth.ts` - Authentication and role management
- `src/lib/api-client.ts` - API client implementation

### Backend Files
- `backend/prisma/schema.prisma` - Database schema (may need custom tables for position-specific data)
- `employee-login-system/src/routes/authRoutes.ts` - Authentication routes

### Components
- `src/components/SidebarLayout.tsx` - Main layout
- `src/components/PageHeader.tsx` - Page headers
- `src/components/StatCard.tsx` - Statistics cards

---

## Security Considerations

### Access Control
- Access varies based on specific position
- Permissions managed through role-based access control
- Cannot access features outside assigned permissions
- Cannot modify system configurations

### Data Protection
- Position-specific data protected
- Department information secured
- Audit trail for all activities

### Audit Trail
- All task activities logged
- All workflow executions tracked
- All data access recorded

---

## Performance Optimization

### Data Loading
- Lazy load position-specific data
- Cache department tools
- Optimize task queries
- Paginate lists

### Real-Time Updates
- WebSocket for task notifications
- Real-time workflow status updates

---

## Future Enhancements

### Planned Features
- Dynamic permission management
- Custom workflow builder
- Position-specific dashboards
- Advanced reporting tools
- Integration with external systems
- Mobile position-specific apps
- Automated task routing
