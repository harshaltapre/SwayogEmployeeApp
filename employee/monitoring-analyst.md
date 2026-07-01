# Monitoring Analyst - Complete Workflow Documentation

## Role Overview

**Role Name**: Monitoring Analyst  
**Hierarchy Level**: Technical/Operations role  
**Reports To**: Team Lead / Department Head (Monitoring/Operations)  
**Manages**: System performance monitoring and analysis  
**Access Level: Monitoring access with analytics capabilities  

### Responsibilities
- Monitor solar system performance in real-time
- Analyze generation data and trends
- Identify performance anomalies and issues
- Generate performance reports
- Alert on system faults or underperformance
- Coordinate with service teams for issues
- Maintain monitoring dashboards
- Analyze inverter data and generation metrics
- Ensure optimal system performance

---

## Login Mechanism

### Authentication Flow

```
User enters credentials (Email/Login ID + Password)
    ↓
Role selection: "Employee" (with jobRole = "monitoring analyst")
    ↓
POST /api/auth/login
    ↓
Backend validates credentials against User table
    ↓
Check: role = 'EMPLOYEE' with jobRole = 'monitoring analyst'
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
Dashboard customized for monitoring features
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
  if (role === 'employee' && jobRole === 'monitoring analyst') {
    return '/employee/dashboard';
  }
  // ... other roles
}
```

**Job Role Detection**:
```typescript
// Monitoring Analyst is identified by:
// - role = 'EMPLOYEE' with jobRole = 'monitoring analyst'
```

---

## Features & Capabilities

### Feature Access Matrix

| Feature | Access Level | Description |
|---------|-------------|-------------|
| Dashboard | ✅ Full | Monitoring overview, system status |
| Real-Time Monitoring | ✅ Full | Monitor systems in real-time |
| Performance Analysis | ✅ Full | Analyze performance data and trends |
| Alert Management | ✅ Full | Manage and respond to alerts |
| Generation Tracking | ✅ Full | Track energy generation data |
| Inverter Monitoring | ✅ Full | Monitor inverter performance |
| Report Generation | ✅ Full | Generate performance reports |
| Anomaly Detection | ✅ Full | Identify performance anomalies |
| Attendance Tracking | ✅ Full | Own attendance tracking |
| Profile Management | ✅ Full | Update personal information |
| Task Management | ✅ Full | View monitoring-related tasks |
| Customer Management | ❌ Limited | Can view customer data for monitoring |
| Admin Features | ❌ No | No administrative access |

### Dashboard Components

**Stat Cards**:
- Systems Online
- Systems Offline
- Active Alerts
- Average Performance Ratio
- Total Generation Today
- Systems Underperforming

**Main Sections**:
- Real-time monitoring dashboard
- System status overview
- Alert management
- Performance analytics
- Generation tracking
- Report generation

---

## Database Integration

### Primary Tables Used

**User Table** (Monitoring Analyst data)
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
  departmentId        String?               // Monitoring/Operations department
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
  jobRole          String          @default("monitoring analyst")
  zone             String?
  monthlySalaryInr Int?
  isActive         Boolean         @default(true)
  // ... other fields
}
```

**Customer Table** (For monitoring)
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
  WaareeGeneration    WaareeGeneration?
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

**Task Table** (Monitoring-related tasks)
```prisma
model Task {
  id                    Int              @id @default(autoincrement())
  jobType               String           // "Monitoring", "Analysis", etc.
  description           String
  customerName          String
  customerPhone         String
  address               String
  status                TaskStatus       @default(ASSIGNED)
  scheduledTime         DateTime
  employeeUserId        String?          // Monitoring analyst
  assignedById          String
  completedAt           DateTime?
  // ... other fields
}
```

### Custom Tables (Potential Future Implementation)

**SystemAlert Table** (Alert management)
```prisma
model SystemAlert {
  id                    String   @id @default(uuid())
  customerId            Int
  alertType             String   // "Offline", "Underperformance", "Fault", etc.
  severity              String   // "Low", "Medium", "High", "Critical"
  alertMessage          String
  alertData             Json?
  triggeredAt           DateTime @default(now())
  acknowledgedAt        DateTime?
  resolvedAt            DateTime?
  acknowledgedBy        String?
  resolvedBy            String?
  status                String   @default("active")
  customer              Customer @relation(fields: [customerId], references: [id])
}
```

**PerformanceLog Table** (Performance tracking)
```prisma
model PerformanceLog {
  id                    String   @id @default(uuid())
  customerId            Int
  logDate               DateTime @db.Date
  dailyGeneration       Float
  performanceRatio      Float
  expectedGeneration    Float
  actualGeneration      Float
  weatherCondition      String?
  notes                 String?
  customer              Customer @relation(fields: [customerId], references: [id])
}
```

### Data Relationships

```
User (Monitoring Analyst)
  ├── EmployeeProfile (1:1)
  ├── Department (N:1) - Monitoring/Operations department
  ├── Task[] (assigned monitoring tasks)
  └── SystemAlert[] (acknowledged/resolved alerts)

WaareeGeneration
  └── Customer (N:1) - Customer being monitored

SystemAlert
  ├── Customer (N:1) - Customer with alert
  └── acknowledgedBy → User (Monitoring Analyst)
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

### Monitoring Endpoints

**GET /api/customers/{id}/generation**
- Query params: `?period={realtime|daily|monthly|yearly}`
- Response: Generation data for customer
- Used in: `src/pages/employee/SubAdminDashboard.tsx` (can be extended for monitoring)

**GET /api/monitoring/systems**
- Query params: `?status={online|offline}`
- Response: System status list
- Used in: System monitoring dashboard

**GET /api/monitoring/alerts**
- Query params: `?status={active|acknowledged|resolved}&severity={severity}`
- Response: `SystemAlert[]`
- Used in: Alert management

**POST /api/monitoring/alerts/{id}/acknowledge**
- Request: `{ acknowledgedBy }`
- Response: Updated SystemAlert
- Used in: Acknowledging alerts

**POST /api/monitoring/alerts/{id}/resolve**
- Request: `{ resolvedBy, resolutionNotes }`
- Response: Updated SystemAlert
- Used in: Resolving alerts

### Performance Endpoints

**GET /api/performance/customer/{id}**
- Query params: `?startDate={date}&endDate={date}`
- Response: Performance data for customer
- Used in: Performance analysis

**GET /api/performance/aggregate**
- Query params: `?zone={zone}&period={daily|monthly|yearly}`
- Response: Aggregated performance data
- Used in: Performance reports

### Report Endpoints

**POST /api/reports/performance**
- Request: `{ customerId, startDate, endDate, reportType }`
- Response: Generated performance report
- Used in: Report generation

---

## Web UI Workflow

### Screen-by-Screen Navigation

```
Login Page (/login)
    ↓ [Authenticate as Monitoring Analyst]
Employee Dashboard (/employee/dashboard)
    ├── Monitoring Dashboard (/employee/monitoring-dashboard)
    ├── System Alerts (/employee/system-alerts)
    ├── Performance Analytics (/employee/performance-analytics)
    ├── Generation Tracking (/employee/generation-tracking)
    ├── Reports (/employee/monitoring-reports)
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

**Monitoring Analyst Specific**:
- Select "Employee" role
- Backend detects monitoring analyst via `jobRole = 'monitoring analyst'`
- Redirects to `/employee/dashboard` with monitoring features

### 2. Employee Dashboard (`/employee/dashboard`)

**Layout**: SidebarLayout with navigation

**Monitoring Analyst Specific Components**:
- Monitoring statistics cards
- Systems online/offline count
- Active alerts
- Average performance ratio
- Total generation today
- Quick view monitoring dashboard button

### 3. Monitoring Dashboard (`/employee/monitoring-dashboard`)

**Layout**: SidebarLayout with monitoring

**Components**:
- PageHeader: "System Monitoring Dashboard"
- Real-time system grid:
  - Customer name
  - System size
  - Current power output
  - Status (online/offline)
  - Performance ratio
  - Last updated
- Filter by status
- Filter by zone/city
- Search by customer
- Auto-refresh toggle

**System Detail View**:
- Customer information
- System specifications
- Real-time metrics:
  - Current power
  - Today's generation
  - Monthly generation
  - Performance ratio
- Historical trends chart
- Alert history
- Action buttons:
  - View alerts
  - Generate report
  - Contact customer

### 4. System Alerts Page (`/employee/system-alerts`)

**Layout**: SidebarLayout with alert management

**Components**:
- PageHeader: "System Alerts"
- Alert list with filters:
  - Status (Active, Acknowledged, Resolved)
  - Severity (Low, Medium, High, Critical)
  - Alert type
  - Date range
- Alert statistics cards

**Alert Card**:
- Customer name
- Alert type
- Severity indicator (color-coded)
- Alert message
- Triggered time
- Status badge
- Action buttons:
  - Acknowledge
  - Resolve
  - View Details

**Alert Detail View**:
- Customer information
- Alert details
- System status at time of alert
- Alert data (JSON view)
- Acknowledgment history
- Resolution notes
- Acknowledge/Resolve buttons

### 5. Performance Analytics Page (`/employee/performance-analytics`)

**Layout**: SidebarLayout with analytics

**Components**:
- PageHeader: "Performance Analytics"
- Customer selector
- Date range picker
- Performance metrics:
  - Daily generation chart
  - Performance ratio trend
  - Comparison with expected
  - Weather correlation
- Anomaly detection:
  - Underperformance alerts
  - Performance drop indicators
  - Fault detection
- Export data button
- Generate report button

### 6. Generation Tracking Page (`/employee/generation-tracking`)

**Layout**: SidebarLayout with generation tracking

**Components**:
- PageHeader: "Generation Tracking"
- Customer list with generation data:
  - Today's generation
  - Monthly generation
  - Yearly generation
  - Total generation
  - Performance ratio
- Filter by zone/city
- Sort by generation
- Aggregate view:
  - Total generation across all systems
  - Average performance ratio
  - Top performers
  - Underperforming systems

### 7. Reports Page (`/employee/monitoring-reports`)

**Layout**: SidebarLayout with reporting

**Components**:
- PageHeader: "Monitoring Reports"
- Report types:
  - System performance report
  - Generation report
  - Alert summary report
  - Anomaly report
- Report parameters:
  - Customer selection
  - Date range
  - Report format (PDF, Excel)
- Generate report button
- Report history
- Download report button

---

## Android UI Workflow

### Mobile-Specific UI Patterns

**Bottom Navigation Bar**:
```
[Home] [Monitoring] [Alerts] [Analytics] [Profile]
```

**Home Tab**:
- Monitoring statistics
- Active alerts count
- Quick actions
- Notifications

**Monitoring Tab**:
- System grid view
- Filter by status
- Tap for details
- Pull-to-refresh

**Alerts Tab**:
- Alert list
- Filter by severity
- Acknowledge/Resolve buttons
- Swipe actions

**Analytics Tab**:
- Performance charts
- Generation trends
- Anomaly indicators
- Export options

**Profile Tab**:
- Personal profile
- Settings
- Logout

### Touch Interactions and Gestures

**System Card Swipe Actions**:
- Swipe left: View alerts
- Swipe right: Generate report
- Tap: View system details

**Alert Card Swipe Actions**:
- Swipe left: Acknowledge
- Swipe right: Resolve
- Tap: View alert details

### Offline Capabilities

**Offline Mode**:
- Cache system status data
- Cache generation data
- Queue alert acknowledgments
- Sync when connection restored

### Push Notifications

**Notification Types**:
- New system alert
- System offline
- Performance anomaly
- Critical fault
- Report generation complete

---

## Alert Management Workflow

**1. Alert Triggered**
```
System detects anomaly
    ↓
Alert created in database
    ↓
Monitoring analyst notified
    ↓
Alert appears in alert queue
```

**2. Alert Acknowledgment**
```
Analyst reviews alert
    ↓
Assesses severity
    ↓
Acknowledges alert
    ↓
Investigates issue
    ↓
Coordinates with service team if needed
```

**3. Alert Resolution**
```
Issue resolved
    ↓
Analyst documents resolution
    ↓
Resolves alert in system
    ↓
Alert marked as resolved
    ↓
Resolution logged
```

---

## Data Flow Diagrams

### Real-Time Monitoring Flow

```
┌─────────────┐
│ Monitoring  │
│  Dashboard  │
└──────┬──────┘
       │ Load dashboard
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ GET /api/monitoring/systems
       │ GET /api/monitoring/alerts?status=active
       ↓
┌─────────────┐
│ Monitoring  │
│  Controller │
└──────┬──────┘
       │ Query WaareeGeneration
       │ Query SystemAlert
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ System status data
       │ Active alerts
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ System status + alerts
       ↓
┌─────────────┐
│  UI Render  │
└──────┬──────┘
       │ Display system grid
       │ Show active alerts
       ↓
┌─────────────┐
│ Auto-Refresh│
└──────┬──────┘
       │ Refresh every 30 seconds
       ↓
┌─────────────┐
│ Monitoring  │
│  Dashboard  │
└─────────────┘
```

---

## Related Files

### Frontend Files
- `src/pages/Login.tsx` - Login page with role selection
- `src/pages/employee/Dashboard.tsx` - Main dashboard (can be extended for monitoring features)
- `src/pages/employee/SubAdminDashboard.tsx` - Has generation monitoring features
- `src/lib/auth.ts` - Authentication and role management
- `src/lib/api-client.ts` - API client implementation

### Backend Files
- `backend/prisma/schema.prisma` - Database schema (has WaareeGeneration table)
- `employee-login-system/src/routes/authRoutes.ts` - Authentication routes

### Components
- `src/components/SidebarLayout.tsx` - Main layout
- `src/components/PageHeader.tsx` - Page headers
- `src/components/StatCard.tsx` - Statistics cards

---

## Security Considerations

### Access Control
- Monitoring analysts can view all system data
- Cannot modify customer information
- Cannot modify system configurations
- Alert acknowledgment requires proper authorization

### Data Protection
- Generation data protected
- System configuration secured
- Alert history confidential
- Audit trail for all alert actions

### Audit Trail
- All alert acknowledgments logged
- All alert resolutions tracked
- All report generations documented
- All data access recorded

---

## Performance Optimization

### Monitoring Data Loading
- Lazy load system details
- Cache generation data
- Optimize alert queries
- Paginate system lists

### Real-Time Updates
- WebSocket for real-time alerts
- Live system status updates
- Auto-refresh dashboard

---

## Future Enhancements

### Planned Features
- AI-powered anomaly detection
- Predictive maintenance alerts
- Advanced analytics dashboard
- Mobile monitoring app
- Automated report scheduling
- Integration with weather APIs
- Performance benchmarking
- Custom alert rules
