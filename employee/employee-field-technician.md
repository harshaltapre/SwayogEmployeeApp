# Employee (Field Technician) - Complete Workflow Documentation

## Role Overview

**Role Name**: Field Technician (Employee)  
**Hierarchy Level**: Front-line operational staff  
**Reports To**: Team Lead / Department Head / Sub-Admin  
**Access Level**: Operational access to assigned tasks, attendance, and personal performance data  

### Responsibilities
- Execute assigned field tasks (installations, services, AMC visits, complaints, surveys)
- Track daily attendance with check-in/check-out and location verification
- Submit work descriptions and daily commits
- Upload task completion evidence (photos with geo-tagging)
- Monitor personal performance metrics
- Manage customer interactions during field visits

---

## Login Mechanism

### Authentication Flow

```
User enters credentials (Email/Login ID + Password)
    ↓
Role selection: "Employee"
    ↓
POST /api/auth/login
    ↓
Backend validates credentials against User table
    ↓
Check: role = 'EMPLOYEE' and isActive = true
    ↓
Check: failedLoginAttempts < 5 and lockoutUntil is null/expired
    ↓
Generate JWT access token + refresh token
    ↓
Store tokens (access in localStorage, refresh in httpOnly cookie)
    ↓
Redirect to: /employee/dashboard
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
if (role === 'employee') {
  return '/employee/dashboard';
}
```

---

## Features & Capabilities

### Feature Access Matrix

| Feature | Access Level | Description |
|---------|-------------|-------------|
| Dashboard | ✅ Full | Personal task overview, attendance, performance |
| Task Management | ✅ Full | View assigned tasks, update status, complete tasks |
| Attendance Tracking | ✅ Full | Check-in/out, location verification, break tracking |
| Work Submissions | ✅ Full | Submit work descriptions, upload evidence |
| Daily Commits | ✅ Full | Daily work summaries, tomorrow's planning |
| Performance Tracking | ✅ Full | View personal performance metrics |
| Profile Management | ✅ Full | Update personal information, photo |
| Calendar View | ✅ Full | View task schedule, attendance calendar |
| Team Management | ❌ No | Cannot view/manage other employees |
| Customer Management | ❌ No | Cannot manage customer data |
| Admin Features | ❌ No | No administrative access |

### Dashboard Components

**Stat Cards**:
- Active Tasks count
- Completed Tasks count
- Upcoming Tasks count
- Attendance status card

**Main Sections**:
- All Assigned Tasks list
- Current Work Description input
- Attendance controls (Check In/Check Out)
- Performance metrics display

---

## Database Integration

### Primary Tables Used

**User Table** (Core employee data)
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
  jobRole          String          @default("field_technician")
  zone             String?
  monthlySalaryInr Int?
  isActive         Boolean         @default(true)
  // ... other fields
}
```

**Task Table**
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
  beforeImageUrl        String?
  afterImageUrl         String?
  // ... other fields
}
```

**AttendanceRecord Table**
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
  // ... other fields
}
```

**WorkSubmission Table**
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
  // ... other fields
}
```

**DailyCommit Table**
```prisma
model DailyCommit {
  id             String   @id @default(uuid())
  employeeId     String
  commitDate     DateTime @db.Date
  taskWorkedOn   String
  workSummary    String
  hoursSpent     Float
  issuesBlockers String?
  tomorrowPlan   String?
  attachmentUrl  String?
  submittedAt    DateTime @default(now())
  // ... other fields
}
```

**TaskImage Table**
```prisma
model TaskImage {
  id           String   @id @default(uuid())
  taskId       Int
  employeeUserId String
  type         String   // before, after
  url          String
  latitude     Float?
  longitude    Float?
  watermarkText String?
  uploadedAt   DateTime @default(now())
  // ... other fields
}
```

### Data Relationships

```
User (Employee)
  ├── EmployeeProfile (1:1)
  ├── AttendanceRecord[] (1:N)
  ├── Task[] (assigned tasks via employeeUserId)
  ├── WorkSubmission[] (1:N)
  ├── DailyCommit[] (1:N)
  ├── TaskImage[] (uploaded images)
  └── PerformanceSnapshot[] (1:N)

User (Employee)
  └── reportingManager → User (Team Lead/Dept Head)
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
- Response: `Task[]`
- Used in: `src/pages/employee/Dashboard.tsx`, `src/pages/employee/Tasks.tsx`

**POST /api/tasks/{id}/complete**
- Request: `{ completionMessage, completionDocumentUrl, beforeImageUrl, afterImageUrl, beforeLatitude, beforeLongitude, afterLatitude, afterLongitude }`
- Response: Updated Task object
- Used in: `src/pages/employee/Tasks.tsx`

**POST /api/tasks/{id}/images**
- Request: `{ type: "before"|"after", url, latitude, longitude, watermarkText }`
- Response: TaskImage object
- Used in: `src/pages/employee/Tasks.tsx`

### Attendance Endpoints

**POST /api/attendance/check-in**
- Request: `{ selfieUrl?, latitude?, longitude? }`
- Response: AttendanceRecord object
- Used in: `src/hooks/useAttendance.ts`

**POST /api/attendance/check-out**
- Request: `{}`
- Response: Updated AttendanceRecord object
- Used in: `src/hooks/useAttendance.ts`

**GET /api/attendance/today**
- Response: Today's AttendanceRecord
- Used in: `src/hooks/useAttendance.ts`

**GET /api/attendance/monthly**
- Query params: `?month={month}&year={year}`
- Response: AttendanceRecord[] for the month
- Used in: `src/pages/employee/Attendance.tsx`

### Work Submission Endpoints

**POST /api/work-submissions**
- Request: `{ employeeId, taskId?, title, description, proofUrl?, proofNotes?, hoursSpent }`
- Response: WorkSubmission object
- Used in: `src/hooks/useAttendance.ts`

**GET /api/work-submissions**
- Query params: `?employeeId={id}`
- Response: WorkSubmission[]
- Used in: `src/hooks/useAttendance.ts`

### Daily Commit Endpoints

**POST /api/daily-commits**
- Request: `{ employeeId, commitDate, taskWorkedOn, workSummary, hoursSpent, issuesBlockers?, tomorrowPlan?, attachmentUrl? }`
- Response: DailyCommit object
- Used in: `src/pages/employee/DailyCommit.tsx`

**GET /api/daily-commits**
- Query params: `?employeeId={id}`
- Response: DailyCommit[]
- Used in: `src/pages/employee/DailyCommit.tsx`

### Performance Endpoints

**GET /api/performance/{employeeId}**
- Query params: `?month={month}&year={year}`
- Response: PerformanceSnapshot object
- Used in: `src/hooks/useAttendance.ts`

### Employee Data Endpoints

**GET /api/employees**
- Response: User[] with role = employee
- Used in: `src/lib/api-client.ts`

**GET /api/employees/{id}**
- Response: Single User object
- Used in: `src/lib/api-client.ts`

---

## Web UI Workflow

### Screen-by-Screen Navigation

```
Login Page (/login)
    ↓ [Authenticate as Employee]
Employee Dashboard (/employee/dashboard)
    ├── Tasks Page (/employee/tasks)
    ├── Attendance Page (/employee/attendance)
    ├── Daily Commit Page (/employee/daily-commit)
    ├── Profile Page (/employee/profile)
    ├── Settings Page (/employee/settings)
    ├── AMC Management (/employee/amc-management)
    ├── Waaree Solar Dashboard (/employee/waaree-solar-dashboard)
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

**State Management**:
```typescript
const form = useForm<LoginFormValues>({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    identifier: "",
    password: "",
    role: "employee",
  },
});
```

**User Flow**:
1. Select "Employee" role from role selector
2. Enter email or login ID (e.g., EMP-XXXXXX)
3. Enter password
4. Click "Sign in as Employee"
5. On success → redirect to `/employee/dashboard`
6. On failure → show error toast

### 2. Employee Dashboard (`/employee/dashboard`)

**Layout**: SidebarLayout with navigation

**Components**:
- PageHeader: "My Dashboard" with description
- Stat Cards grid (4 cards)
- All Assigned Tasks card
- Current Work Description card
- Attendance card with Check In/Check Out buttons

**Stat Cards**:
```typescript
<StatCard title="Active Tasks" value={activeCount} icon={<Clock />} />
<StatCard title="Completed Tasks" value={completedCount} icon={<CheckCircle />} />
<StatCard title="Upcoming" value={tasks?.length} icon={<Calendar />} />
<Card>Attendance status and controls</Card>
```

**Task List**:
- Shows all assigned tasks
- Each task displays: job type, scheduled time, address, customer name, status badge
- Click to view details

**Work Description**:
- Textarea for current work description
- "Save & Send to Admin" button
- Auto-clears after successful submission

**Attendance Controls**:
- Check In button (disabled if already checked in)
- Check Out button (disabled if not checked in or already checked out)
- Shows current attendance status
- Shows performance score

### 3. Tasks Page (`/employee/tasks`)

**Layout**: SidebarLayout with tabs

**Tabs**:
- Assigned Tasks
- In Progress
- Completed
- All Tasks

**Task Card Components**:
- Job type with icon (🔧 Installation, 🛠️ Service, 📋 AMC Visit, ⚠️ Complaint, 📐 Survey)
- Customer name and phone
- Address with MapPin
- Scheduled time
- Status badge (assigned/in_progress/completed)
- Action buttons based on status

**Task Detail Drawer**:
- Full task information
- Customer contact details
- Navigation button (opens Google Maps)
- "Start Task" button (changes status to in_progress)
- "Complete Task" button (opens completion dialog)

**Task Completion Dialog**:
- Completion message textarea
- Before photo upload (with geo-tagging)
- After photo upload (with geo-tagging)
- Hours spent input
- Submit button

**Photo Upload with Watermark**:
```typescript
function watermarkImage(file: File, label: string): Promise<string> {
  // Standardizes image to max 1200px
  // Adds watermark with employee name, date, time, location
  // Returns base64 string
}
```

### 4. Attendance Page (`/employee/attendance`)

**Layout**: SidebarLayout with calendar view

**Components**:
- Monthly calendar view
- Attendance status indicators (present/absent/late/leave/half-day)
- Today's attendance detail card
- Check In/Check Out buttons with location
- Break tracking (short break, lunch break)
- Statistics cards (present days, absent days, average hours)

**Calendar Features**:
- Color-coded status dots
- Today highlighted with orange ring
- Click on day to view details
- Month navigation

**Check In Flow**:
1. Click "Check In" button
2. Request location permission
3. Capture current GPS coordinates
4. Optional: Take selfie
5. Submit to API
6. Update UI to show checked in status

**Check Out Flow**:
1. Click "Check Out" button
2. Calculate total work hours
3. Submit to API
4. Update UI to show checked out status

**Break Tracking**:
- Start short break (15 min)
- Start lunch break (60 min)
- Auto-end break or manual end
- Break time deducted from total hours

### 5. Daily Commit Page (`/employee/daily-commit`)

**Layout**: SidebarLayout with form

**Form Fields**:
- Date (auto-filled with today)
- Task worked on (dropdown from assigned tasks)
- Work summary (textarea)
- Hours spent (number input)
- Issues/Blockers (textarea, optional)
- Tomorrow's plan (textarea, optional)
- Attachment upload (optional)

**Submission Flow**:
1. Fill in required fields
2. Click "Submit Daily Commit"
3. Validate all fields
4. Submit to API
5. Show success toast
6. Reset form

**History View**:
- List of previous daily commits
- Filter by date range
- View/edit previous commits

### 6. Profile Page (`/employee/profile`)

**Layout**: SidebarLayout with profile card

**Components**:
- Profile photo with upload button
- Personal information display
- Edit mode toggle
- Save/Cancel buttons

**Profile Fields**:
- Name
- Email
- Phone number
- Employee ID
- Designation
- Department
- Join date
- Address
- Emergency contact

**Photo Upload**:
- Click camera icon or photo
- Select image from device
- Auto-resize and compress
- Save to localStorage
- Update avatar display

**Edit Mode**:
- Toggle edit mode
- Fields become editable inputs
- Save updates localStorage
- Cancel reverts changes

### 7. Settings Page (`/employee/settings`)

**Layout**: SidebarLayout with sections

**Sections**:
- Account settings
- Notification preferences
- Theme selection
- Language selection
- Privacy settings
- Logout button

**Account Settings**:
- Change password
- Update email
- Two-factor authentication toggle

**Notification Preferences**:
- Push notifications toggle
- Email notifications toggle
- SMS notifications toggle
- Task reminders toggle

---

## Android UI Workflow

### Mobile-Specific UI Patterns

**Bottom Navigation Bar**:
```
[Home] [Tasks] [Attendance] [Profile] [More]
```

**Home Tab**:
- Quick stat cards (horizontal scroll)
- Today's tasks (vertical list)
- Quick check-in button (floating action button)
- Attendance status indicator

**Tasks Tab**:
- Filter chips (All, Assigned, In Progress, Completed)
- Task cards with swipe actions
- Pull-to-refresh
- Infinite scroll for task history

**Attendance Tab**:
- Calendar view (month selector)
- Today's attendance detail
- Large check-in/check-out buttons
- Location indicator
- Break tracking

**Profile Tab**:
- Profile photo with edit overlay
- Quick stats (tasks completed, attendance %)
- Settings access
- Logout button

### Touch Interactions and Gestures

**Task Card Swipe Actions**:
- Swipe left: Call customer
- Swipe right: Navigate to location
- Long press: Show task details

**Calendar Gestures**:
- Swipe left/right: Change month
- Tap day: View attendance details
- Pinch: Zoom (if needed)

**Photo Upload**:
- Tap: Open camera
- Long press: Open gallery
- Drag: Reposition photo (if editing)

### Offline Capabilities

**Offline Mode**:
- Cache assigned tasks
- Cache attendance records
- Queue work submissions
- Sync when connection restored

**Data Persistence**:
- IndexedDB for task data
- localStorage for user preferences
- Service worker for offline support

**Conflict Resolution**:
- Last write wins for simple fields
- Manual resolution for conflicts
- Server timestamp as authority

### Push Notifications

**Notification Types**:
- New task assigned
- Task reminder (1 hour before)
- Check-in reminder (if not checked in by 10 AM)
- Task completion confirmation
- Performance update
- Admin message

**Notification Handling**:
- Tap: Navigate to relevant screen
- Swipe: Dismiss
- Long press: Show notification options

**Deep Linking**:
- Task notification → Open task detail
- Attendance reminder → Open attendance tab
- Admin message → Open messages

### Location Services Integration

**Background Location**:
- Track location during work hours
- Verify check-in location
- Verify task completion location
- Geofence customer locations

**Location Accuracy**:
- High accuracy mode for check-in
- Balanced accuracy for task completion
- Low accuracy for periodic updates

**Battery Optimization**:
- Adaptive location tracking
- Pause location when not needed
- Use significant location changes

**Privacy**:
- User consent required
- Location data encrypted
- Auto-delete after 30 days
- Only store work-related locations

---

## Data Flow Diagrams

### Login Data Flow

```
┌─────────────┐
│   Login UI  │
└──────┬──────┘
       │ identifier, password, role
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/auth/login
       ↓
┌─────────────┐
│   Auth      │
│  Controller │
└──────┬──────┘
       │ validate credentials
       ↓
┌─────────────┐
│  Auth       │
│  Service    │
└──────┬──────┘
       │ check User table
       │ verify password hash
       │ check lockout status
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ user data
       ↓
┌─────────────┐
│  JWT        │
│  Generator  │
└──────┬──────┘
       │ access token, refresh token
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ { token, refreshToken, user }
       ↓
┌─────────────┐
│  Auth Store │ (Zustand)
└─────────────┘
       │ localStorage.setItem('token')
       │ localStorage.setItem('user')
       ↓
┌─────────────┐
│  Redirect   │
└──────┬──────┘
       │ /employee/dashboard
       ↓
┌─────────────┐
│ Dashboard   │
│    UI       │
└─────────────┘
```

### Task Completion Data Flow

```
┌─────────────┐
│ Task Detail │
│    Drawer   │
└──────┬──────┘
       │ Click "Complete Task"
       ↓
┌─────────────┐
│ Completion  │
│   Dialog    │
└──────┬──────┘
       │ Fill completion message
       │ Upload before photo
       │ Upload after photo
       │ Enter hours spent
       ↓
┌─────────────┐
│ Photo       │
│ Watermarker │
└──────┬──────┘
       │ Add watermark
       │ Geo-tag photos
       │ Compress images
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/tasks/{id}/complete
       │ POST /api/tasks/{id}/images
       ↓
┌─────────────┐
│  Task       │
│  Controller │
└──────┬──────┘
       │ Update task status
       │ Save completion data
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Update Task table
       │ Insert TaskImage records
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Updated task object
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Refresh task list
       │ Show success toast
       │ Close dialog
       ↓
┌─────────────┐
│ Task List   │
│    UI       │
└─────────────┘
```

### Attendance Check-In Data Flow

```
┌─────────────┐
│ Attendance  │
│    Page     │
└──────┬──────┘
       │ Click "Check In"
       ↓
┌─────────────┐
│ Geolocation │
│   API       │
└──────┬──────┘
       │ Request location
       ↓
┌─────────────┐
│  Browser    │
│  Permission │
└──────┬──────┘
       │ User allows location
       ↓
┌─────────────┐
│ GPS         │
│ Coordinates │
└──────┬──────┘
       │ latitude, longitude
       ↓
┌─────────────┐
│ Camera      │
│   API       │ (optional)
└──────┬──────┘
       │ Capture selfie
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/attendance/check-in
       │ { selfieUrl?, latitude, longitude }
       ↓
┌─────────────┐
│ Attendance  │
│  Controller │
└──────┬──────┘
       │ Create/Update AttendanceRecord
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Insert AttendanceRecord
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ AttendanceRecord object
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show checked in status
       │ Disable check-in button
       │ Enable check-out button
       ↓
┌─────────────┐
│ Attendance  │
│    Page     │
└─────────────┘
```

---

## Feature-Specific Workflows

### Task Management Workflow

**1. Task Assignment** (Admin → Employee)
```
Admin creates task
    ↓
Task assigned to employee (employeeUserId)
    ↓
Employee receives notification
    ↓
Task appears in employee dashboard
```

**2. Task Acceptance** (Employee)
```
Employee views assigned tasks
    ↓
Clicks on task to view details
    ↓
Reviews task information
    ↓
Clicks "Start Task" (optional)
    ↓
Task status changes to IN_PROGRESS
```

**3. Task Execution** (Employee)
```
Employee navigates to customer location
    ↓
Performs required work (installation/service/etc.)
    ↓
Takes "before" photo with geo-tagging
    ↓
Completes the work
    ↓
Takes "after" photo with geo-tagging
    ↓
Clicks "Complete Task"
```

**4. Task Completion** (Employee)
```
Fills completion message
    ↓
Uploads before/after photos
    ↓
Enters hours spent
    ↓
Submits completion
    ↓
Task status changes to COMPLETED
    ↓
Admin receives notification
    ↓
Admin reviews completion
    ↓
Admin approves/rejects
```

### Attendance Tracking Workflow

**1. Daily Attendance Start**
```
Employee arrives at work/location
    ↓
Opens attendance page
    ↓
Clicks "Check In"
    ↓
Grants location permission
    ↓
GPS coordinates captured
    ↓
Optional: Takes selfie
    ↓
Check-in recorded with timestamp and location
    ↓
Status: CHECKED_IN
```

**2. During Work Day**
```
Employee takes breaks
    ↓
Clicks "Start Short Break" or "Start Lunch Break"
    ↓
Break timer starts
    ↓
Work timer pauses
    ↓
Clicks "End Break"
    ↓
Break duration recorded
    ↓
Work timer resumes
```

**3. Daily Attendance End**
```
Employee finishes work
    ↓
Clicks "Check Out"
    ↓
Total work hours calculated
    ↓
Check-out recorded with timestamp
    ↓
Status: CHECKED_OUT
    ↓
Attendance record finalized
```

**4. Attendance Review**
```
Employee views monthly calendar
    ↓
Color-coded status indicators
    ↓
Click on specific day
    ↓
View detailed attendance record
    ↓
See check-in/out times, breaks, total hours
```

### Performance Monitoring Workflow

**1. Performance Calculation** (Automated)
```
System runs daily at midnight
    ↓
Calculates attendance percentage
    ↓
Calculates task completion rate
    ↓
Calculates average work score
    ↓
Calculates total hours logged
    ↓
Computes overall performance score
    ↓
Saves to PerformanceSnapshot table
```

**2. Performance Viewing** (Employee)
```
Employee opens dashboard
    ↓
Views performance card
    ↓
Shows current month's score
    ↓
Shows attendance %
    ↓
Shows tasks completed/assigned
    ↓
Click to view detailed metrics
```

**3. Performance Metrics**
```
Attendance % = (Days Present / Total Working Days) × 100
Task Completion Rate = (Tasks Completed / Tasks Assigned) × 100
Average Work Score = Average of all work submission scores
Performance Score = Weighted average of all metrics
```

### Communication Workflow

**1. Work Description Submission**
```
Employee opens dashboard
    ↓
Fills "Current Work Description" textarea
    ↓
Clicks "Save & Send to Admin"
    ↓
Description saved to database
    ↓
Admin receives notification
    ↓
Admin can view employee's current work
```

**2. Daily Commit Submission**
```
Employee opens daily commit page
    ↓
Fills form (task, summary, hours, etc.)
    ↓
Clicks "Submit Daily Commit"
    ↓
Commit saved to database
    ↓
Admin receives notification
    ↓
Admin reviews daily progress
```

**3. Admin Communication**
```
Admin sends message to employee
    ↓
Employee receives notification
    ↓
Employee views message in inbox
    ↓
Employee can respond (if implemented)
```

### Reporting Workflow

**1. Task Report**
```
Employee views task list
    ↓
Filters by status/date
    ↓
Exports task report (PDF/Excel)
    ↓
Shows task details, completion status, hours
```

**2. Attendance Report**
```
Employee views attendance calendar
    ↓
Selects month/year
    ↓
Exports attendance report
    ↓
Shows check-in/out times, breaks, total hours
```

**3. Performance Report**
```
Employee views performance metrics
    ↓
Selects time period
    ↓
Exports performance report
    ↓
Shows all performance metrics over time
```

---

## Related Files

### Frontend Files
- `src/pages/Login.tsx` - Login page with role selection
- `src/pages/employee/Dashboard.tsx` - Main employee dashboard
- `src/pages/employee/Tasks.tsx` - Task management page
- `src/pages/employee/Attendance.tsx` - Attendance tracking page
- `src/pages/employee/DailyCommit.tsx` - Daily commit submission
- `src/pages/employee/Profile.tsx` - Employee profile management
- `src/pages/employee/Settings.tsx` - Employee settings
- `src/lib/auth.ts` - Authentication and role management
- `src/lib/api-client.ts` - API client implementation
- `src/hooks/useAttendance.ts` - Attendance-related hooks

### Backend Files
- `backend/prisma/schema.prisma` - Database schema
- `backend/routes/employees.js` - Employee routes (legacy)
- `employee-login-system/src/routes/authRoutes.ts` - Authentication routes
- `employee-login-system/src/routes/employeeRoutes.ts` - Employee-specific routes
- `employee-login-system/src/controllers/authController.ts` - Auth controller
- `employee-login-system/src/controllers/employeeController.ts` - Employee controller

### Components
- `src/components/SidebarLayout.tsx` - Main layout component
- `src/components/PageHeader.tsx` - Page header component
- `src/components/StatCard.tsx` - Statistics card component
- `src/components/employee/EmployeeCalendar.tsx` - Employee calendar component

---

## Security Considerations

### Data Protection
- All API calls use HTTPS
- Sensitive data encrypted at rest
- Passwords hashed with bcrypt
- Location data encrypted
- Photos watermarked for authenticity

### Access Control
- Role-based access control (RBAC)
- Employees can only access their own data
- No access to other employees' data
- No access to admin functions
- Session timeout after inactivity

### Audit Trail
- All actions logged in AuditLog table
- Tracks who did what and when
- Used for compliance and troubleshooting

### Input Validation
- All inputs validated on client and server
- SQL injection prevention
- XSS prevention
- CSRF protection

---

## Performance Optimization

### Frontend Optimization
- Lazy loading of components
- Image compression and optimization
- Caching of API responses
- Debouncing of search inputs
- Virtual scrolling for long lists

### Backend Optimization
- Database indexing on frequently queried fields
- Query optimization
- Pagination for large datasets
- Connection pooling
- Response compression

### Mobile Optimization
- Progressive web app (PWA) capabilities
- Offline data caching
- Optimized images for mobile
- Touch-friendly UI elements
- Reduced network requests

---

## Testing Considerations

### Unit Tests
- Test all API client functions
- Test authentication flow
- Test form validation
- Test utility functions

### Integration Tests
- Test complete user flows
- Test API integration
- Test database operations
- Test error handling

### End-to-End Tests
- Test login flow
- Test task completion flow
- Test attendance tracking flow
- Test cross-browser compatibility
- Test mobile responsiveness

---

## Future Enhancements

### Planned Features
- Voice commands for task updates
- Augmented reality for installation guidance
- AI-powered task recommendations
- Real-time chat with admin
- Video call support for complex issues
- Integration with wearable devices
- Automated expense tracking
- Integration with payment systems

### Mobile-Only Features
- Push notifications for urgent tasks
- Background location tracking
- Offline-first architecture
- Biometric authentication
- Voice notes for work descriptions
- AR measurement tools
