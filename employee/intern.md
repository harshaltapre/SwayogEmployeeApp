# Intern - Complete Workflow Documentation

## Role Overview

**Role Name**: Intern  
**Hierarchy Level**: Entry-level/Learning role  
**Reports To**: Team Lead / Department Head / Mentor  
**Manages**: Learning tasks and assigned projects  
**Access Level**: Limited access with supervision requirements  

### Responsibilities
- Learn company processes and systems
- Assist with assigned tasks under supervision
- Shadow senior team members
- Complete training modules
- Document learning progress
- Participate in team meetings
- Contribute to projects as assigned
- Follow mentor guidance
- Maintain learning records

---

## Login Mechanism

### Authentication Flow

```
User enters credentials (Email/Login ID + Password)
    ↓
Role selection: "Employee" (with jobRole = "intern")
    ↓
POST /api/auth/login
    ↓
Backend validates credentials against User table
    ↓
Check: role = 'EMPLOYEE' with jobRole = 'intern'
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
Dashboard customized for intern features with restricted access
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
  if (role === 'employee' && jobRole === 'intern') {
    return '/employee/dashboard';
  }
  // ... other roles
}
```

**Job Role Detection**:
```typescript
// Intern is identified by:
// - role = 'EMPLOYEE' with jobRole = 'intern'
```

---

## Features & Capabilities

### Feature Access Matrix

| Feature | Access Level | Description |
|---------|-------------|-------------|
| Dashboard | ✅ Limited | Learning overview, assigned tasks |
| Task Management | ✅ Limited | View assigned learning tasks only |
| Training Modules | ✅ Full | Access training materials |
| Learning Progress | ✅ Full | Track learning progress |
| Shadowing | ✅ Full | View mentor activities (read-only) |
| Attendance Tracking | ✅ Full | Own attendance tracking |
| Profile Management | ✅ Full | Update personal information |
| Team Communication | ✅ Limited | Read-only access to team communications |
| Customer Management | ❌ No | No customer access |
| System Configuration | ❌ No | No system configuration access |
| Admin Features | ❌ No | No administrative access |

### Dashboard Components

**Stat Cards**:
- Assigned Learning Tasks
- Training Modules Completed
- Learning Progress %
- Shadowing Sessions
- Days in Internship
- Upcoming Training

**Main Sections**:
- Learning task list
- Training modules
- Learning progress tracker
- Mentor assignments
- Attendance tracking
- Resources and documentation

---

## Database Integration

### Primary Tables Used

**User Table** (Intern data)
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
  reportingManagerId  String?               // Mentor/Team Lead
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
  jobRole          String          @default("intern")
  zone             String?
  monthlySalaryInr Int?
  isActive         Boolean         @default(true)
  internshipStartDate DateTime?
  internshipEndDate   DateTime?
  // ... other fields
}
```

**Task Table** (Learning-related tasks)
```prisma
model Task {
  id                    Int              @id @default(autoincrement())
  jobType               String           // "Training", "Learning", "Shadowing"
  description           String
  customerName          String?          // May be null for learning tasks
  status                TaskStatus       @default(ASSIGNED)
  scheduledTime         DateTime
  employeeUserId        String?          // Intern
  assignedById          String
  completedAt           DateTime?
  // ... other fields
}
```

### Custom Tables (Potential Future Implementation)

**TrainingModule Table** (Training content)
```prisma
model TrainingModule {
  id                    String   @id @default(uuid())
  title                 String
  description           String
  moduleType            String   // "Video", "Document", "Quiz", "Hands-on"
  contentUrl            String?
  duration              Int?     // in minutes
  department            String?
  requiredForRole       String?
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  progress              TrainingProgress[]
}
```

**TrainingProgress Table** (Learning tracking)
```prisma
model TrainingProgress {
  id                    String   @id @default(uuid())
  internId              String
  moduleId              String
  status                String   @default("not_started") // "not_started", "in_progress", "completed"
  progressPercent       Int      @default(0)
  startedAt             DateTime?
  completedAt           DateTime?
  quizScore             Int?
  notes                 String?
  intern                User     @relation(fields: [internId], references: [id])
  module                TrainingModule @relation(fields: [moduleId], references: [id])
}
```

**LearningRecord Table** (Learning activities)
```prisma
model LearningRecord {
  id                    String   @id @default(uuid())
  internId              String
  activityType          String   // "Training", "Shadowing", "Project", "Meeting"
  activityTitle         String
  activityDate          DateTime
  duration              Float    // in hours
  mentorId              String?
  learningObjectives    String[]
  keyLearnings          String?
  mentorFeedback        String?
  status                String   @default("completed")
  intern                User     @relation(fields: [internId], references: [id])
  mentor                User?    @relation(fields: [mentorId], references: [id])
}
```

### Data Relationships

```
User (Intern)
  ├── EmployeeProfile (1:1)
  ├── Department (N:1) - Assigned department
  ├── reportingManager → User (Mentor)
  ├── Task[] (assigned learning tasks)
  ├── TrainingProgress[] (1:N) - Training progress
  └── LearningRecord[] (1:N) - Learning activities

TrainingProgress
  ├── Intern (N:1) - User taking training
  └── Module (N:1) - TrainingModule

LearningRecord
  ├── Intern (N:1) - User who performed activity
  └── Mentor (N:1) - User who supervised
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

### Training Endpoints

**GET /api/training-modules**
- Query params: `?department={dept}&role={role}`
- Response: `TrainingModule[]`
- Used in: Training module list

**GET /api/training-progress/{internId}**
- Response: `TrainingProgress[]` for intern
- Used in: Learning progress tracking

**POST /api/training-progress/{internId}/{moduleId}/start**
- Request: `{}`
- Response: Updated TrainingProgress with status = "in_progress"
- Used in: Starting training module

**POST /api/training-progress/{internId}/{moduleId}/complete**
- Request: `{ quizScore, notes }`
- Response: Updated TrainingProgress with status = "completed"
- Used in: Completing training module

### Learning Record Endpoints

**GET /api/learning-records/{internId}**
- Query params: `?activityType={type}&startDate={date}&endDate={date}`
- Response: `LearningRecord[]`
- Used in: Learning history

**POST /api/learning-records**
- Request: `{ internId, activityType, activityTitle, activityDate, duration, mentorId, learningObjectives, keyLearnings }`
- Response: Created LearningRecord object
- Used in: Creating learning record

**PUT /api/learning-records/{id}/feedback**
- Request: `{ mentorFeedback, mentorId }`
- Response: Updated LearningRecord with mentor feedback
- Used in: Adding mentor feedback

---

## Web UI Workflow

### Screen-by-Screen Navigation

```
Login Page (/login)
    ↓ [Authenticate as Intern]
Employee Dashboard (/employee/dashboard)
    ├── Learning Tasks (/employee/learning-tasks)
    ├── Training Modules (/employee/training-modules)
    ├── Learning Progress (/employee/learning-progress)
    ├── Shadowing Schedule (/employee/shadowing-schedule)
    ├── Learning History (/employee/learning-history)
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

**Intern Specific**:
- Select "Employee" role
- Backend detects intern via `jobRole = 'intern'`
- Redirects to `/employee/dashboard` with intern features and restricted access

### 2. Employee Dashboard (`/employee/dashboard`)

**Layout**: SidebarLayout with navigation

**Intern Specific Components**:
- Learning statistics cards
- Assigned learning tasks
- Training modules progress
- Shadowing sessions
- Days remaining in internship
- Quick access to training

### 3. Learning Tasks Page (`/employee/learning-tasks`)

**Layout**: SidebarLayout with task management

**Components**:
- PageHeader: "Learning Tasks"
- Task list with filters:
  - Type (Training, Shadowing, Project)
  - Status (Assigned, In Progress, Completed)
  - Priority
- Task details

**Task Card**:
- Task title
- Task type
- Description
- Assigned mentor
- Due date
- Status badge
- Action buttons:
  - Start Task
  - View Details
  - Complete

**Learning Task Form**:
- Task description
- Learning objectives
- Resources provided
- Mentor information
- Progress tracking
- Notes section
- Complete task button

### 4. Training Modules Page (`/employee/training-modules`)

**Layout**: SidebarLayout with training

**Components**:
- PageHeader: "Training Modules"
- Module list with filters:
  - Type (Video, Document, Quiz, Hands-on)
  - Status (Not Started, In Progress, Completed)
  - Department
- Progress indicators

**Module Card**:
- Module title
- Description
- Type indicator
- Duration
- Progress bar
- Status badge
- Action buttons:
  - Start Module
  - Continue
  - Review

**Module Viewer**:
- Content display (video player, document viewer, quiz interface)
- Progress tracker
- Notes section
- Complete module button
- Quiz (if applicable)

### 5. Learning Progress Page (`/employee/learning-progress`)

**Layout**: SidebarLayout with progress tracking

**Components**:
- PageHeader: "Learning Progress"
- Overall progress indicator
- Module completion chart
- Skills acquired list
- Time spent learning
- Certifications earned
- Progress by category

**Progress Details**:
- Completed modules
- In-progress modules
- Upcoming modules
- Skills matrix
- Learning goals progress

### 6. Shadowing Schedule Page (`/employee/shadowing-schedule`)

**Layout**: SidebarLayout with shadowing

**Components**:
- PageHeader: "Shadowing Schedule"
- Shadowing session list
- Mentor assignments
- Session details:
  - Mentor name
  - Department/Role
  - Date and time
  - Duration
  - Learning objectives
- Session notes section
- Post-session reflection

**Shadowing Session Form**:
- Mentor information
- Session objectives
- Activities observed
- Key learnings
- Questions for mentor
- Session feedback

### 7. Learning History Page (`/employee/learning-history`)

**Layout**: SidebarLayout with history

**Components**:
- PageHeader: "Learning History"
- Activity timeline
- Filter by activity type
- Filter by date range
- Activity details:
  - Activity type
  - Title
  - Date
  - Duration
  - Mentor
  - Key learnings
  - Mentor feedback
- Export history button

---

## Android UI Workflow

### Mobile-Specific UI Patterns

**Bottom Navigation Bar**:
```
[Home] [Training] [Tasks] [Progress] [Profile]
```

**Home Tab**:
- Learning statistics
- Today's tasks
- Training progress
- Quick actions

**Training Tab**:
- Training module list
- Filter by type
- Start/Continue buttons
- Progress indicators

**Tasks Tab**:
- Learning task list
- Filter by status
- Start task button
- Due date indicators

**Progress Tab**:
- Overall progress
- Skills matrix
- Time spent
- Certifications

**Profile Tab**:
- Personal profile
- Internship details
- Settings
- Logout

### Touch Interactions and Gestures

**Module Card Swipe Actions**:
- Swipe left: Start module
- Swipe right: View details
- Tap: Open module

**Task Card Swipe Actions**:
- Swipe left: Start task
- Swipe right: View details
- Tap: Open task form

### Offline Capabilities

**Offline Mode**:
- Cache training materials
- Cache learning tasks
- Queue learning record submissions
- Sync when connection restored

### Push Notifications

**Notification Types**:
- New learning task assigned
- Training module available
- Shadowing session reminder
- Mentor feedback received
- Training deadline reminder

---

## Learning Workflow

**1. Onboarding**
```
Intern joins company
    ↓
Account created
    ↓
Assigned to mentor
    ↓
Given access to training materials
    ↓
Orientation session conducted
```

**2. Learning Path**
```
Mentor assigns learning tasks
    ↓
Intern reviews objectives
    ↓
Accesses training modules
    ↓
Completes training at own pace
    ↓
Documents learnings
```

**3. Shadowing**
```
Scheduled shadowing session
    ↓
Intern shadows mentor
    ↓
Observes activities
    ↓
Takes notes
    ↓
Asks questions
    ↓
Documents key learnings
```

**4. Project Work**
```
Assigned to project under supervision
```

**5. Progress Review**
```
Regular check-ins with mentor
    ↓
Review learning progress
    ↓
Discuss challenges
    ↓
Adjust learning plan
    ↓
Provide feedback
```

---

## Data Flow Diagrams

### Training Module Completion Flow

```
┌─────────────┐
│ Training    │
│  Modules   │
└──────┬──────┘
       │ Select module
       ↓
┌─────────────┐
│ Module      │
│  Viewer     │
└──────┬──────┘
       │ Start module
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/training-progress/{internId}/{moduleId}/start
       ↓
┌─────────────┐
│ Training    │
│  Controller │
└──────┬──────┘
       │ Update TrainingProgress
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Update TrainingProgress
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Updated progress
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show in-progress status
       ↓
┌─────────────┐
│ Module      │
│  Viewer     │
└──────┬──────┘
       │ Complete module
       ↓
┌─────────────┐
│ Quiz/Notes  │
└──────┬──────┘
       │ Complete quiz
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/training-progress/{internId}/{moduleId}/complete
       ↓
┌─────────────┐
│ Training    │
│  Controller │
└──────┬──────┘
       │ Update TrainingProgress
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Update TrainingProgress
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Completed progress
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show completed status
       ↓
┌─────────────┐
│ Training    │
│  Modules   │
└─────────────┘
```

---

## Related Files

### Frontend Files
- `src/pages/Login.tsx` - Login page with role selection
- `src/pages/employee/Dashboard.tsx` - Main dashboard (can be extended for intern features)
- `src/lib/auth.ts` - Authentication and role management
- `src/lib/api-client.ts` - API client implementation

### Backend Files
- `backend/prisma/schema.prisma` - Database schema (may need TrainingModule table added)
- `employee-login-system/src/routes/authRoutes.ts` - Authentication routes

### Components
- `src/components/SidebarLayout.tsx` - Main layout
- `src/components/PageHeader.tsx` - Page headers
- `src/components/StatCard.tsx` - Statistics cards

---

## Security Considerations

### Access Control
- Interns have restricted access to system features
- Can only view assigned learning tasks
- Cannot access customer data
- Cannot modify system configurations
- All actions require supervisor approval

### Data Protection
- Learning progress data protected
- Intern information secured
- Mentor feedback confidential
- Audit trail for all learning activities

### Audit Trail
- All learning activities logged
- All training module access tracked
- All shadowing sessions recorded
- All mentor feedback documented

---

## Performance Optimization

### Training Data Loading
- Lazy load training content
- Cache training materials
- Optimize progress queries
- Paginate module lists

### Real-Time Updates
- WebSocket for task notifications
- Real-time progress updates
- Live mentor communications

---

## Future Enhancements

### Planned Features
- AI-powered learning recommendations
- Interactive training simulations
- Gamification of learning
- Peer learning communities
- Certification tracking
- Skill assessment tools
- Career path mapping
- Integration with external learning platforms
