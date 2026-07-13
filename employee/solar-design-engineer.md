# Solar Design Engineer - Complete Workflow Documentation

## Role Overview

**Role Name**: Solar Design Engineer  
**Hierarchy Level**: Technical/Engineering role  
**Reports To**: Team Lead / Department Head (Engineering/Design)  
**Manages**: Design projects and technical specifications  
**Access Level**: Engineering design access with project management capabilities  

### Responsibilities
- Design solar PV systems for customer installations
- Create technical drawings and schematics
- Calculate system sizing and energy output
- Prepare bill of materials (BOM) for installations
- Review site survey data
- Ensure designs comply with standards and regulations
- Coordinate with installation teams
- Optimize system performance through design
- Maintain design documentation and records

---

## Login Mechanism

### Authentication Flow

```
User enters credentials (Email/Login ID + Password)
    ↓
Role selection: "Employee" (with jobRole = "solar design engineer")
    ↓
POST /api/auth/login
    ↓
Backend validates credentials against User table
    ↓
Check: role = 'EMPLOYEE' with jobRole = 'solar design engineer'
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
Dashboard customized for design engineering features
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
  if (role === 'employee' && jobRole === 'solar design engineer') {
    return '/employee/dashboard';
  }
  // ... other roles
}
```

**Job Role Detection**:
```typescript
// Solar Design Engineer is identified by:
// - role = 'EMPLOYEE' with jobRole = 'solar design engineer'
```

---

## Features & Capabilities

### Feature Access Matrix

| Feature | Access Level | Description |
|---------|-------------|-------------|
| Dashboard | ✅ Full | Design projects overview, pending designs |
| Design Management | ✅ Full | Create, edit, submit solar designs |
| Project Management | ✅ Full | View assigned design projects |
| Site Survey Data | ✅ Full | Access survey data for design |
| BOM Management | ✅ Full | Create and manage bill of materials |
| Technical Drawings | ✅ Full | Upload and manage design drawings |
| Calculations | ✅ Full | System sizing and energy calculations |
| Design Review | ✅ Full | Review and approve designs |
| Attendance Tracking | ✅ Full | Own attendance tracking |
| Profile Management | ✅ Full | Update personal information |
| Task Management | ✅ Full | View design-related tasks |
| Customer Management | ❌ Limited | Can view customer data for design purposes |
| Admin Features | ❌ No | No administrative access |

### Dashboard Components

**Stat Cards**:
- Pending Designs
- Designs in Progress
- Completed Designs This Month
- Projects Assigned
- Average Design Time
- Designs Requiring Revision

**Main Sections**:
- Design project list
- Quick design creation
- Site survey integration
- BOM generator
- Design review queue
- Performance metrics

---

## Database Integration

### Primary Tables Used

**User Table** (Solar Design Engineer data)
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
  jobRole          String          @default("solar design engineer")
  zone             String?
  monthlySalaryInr Int?
  isActive         Boolean         @default(true)
  // ... other fields
}
```

**Customer Table** (For design projects)
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
  panelBrand          String?
  inverterBrand       String?
  inverterModel       String?
  projectStage        Int               @default(0)
  latitude            Float?
  longitude           Float?
  // ... other fields
}
```

**Task Table** (Design-related tasks)
```prisma
model Task {
  id                    Int              @id @default(autoincrement())
  jobType               String           // "Design", "Review", etc.
  description           String
  customerName          String
  customerPhone         String
  address               String
  status                TaskStatus       @default(ASSIGNED)
  scheduledTime         DateTime
  employeeUserId        String?          // Design engineer
  assignedById          String
  completedAt           DateTime?
  // ... other fields
}
```

### Custom Tables (Potential Future Implementation)

**SolarDesign Table** (Design project management)
```prisma
model SolarDesign {
  id                String   @id @default(uuid())
  customerId        Int
  designerId        String
  systemSizeKw      Float
  panelCount        Int
  inverterCapacity  Float
  designStatus      String   @default("draft")
  submittedAt       DateTime @default(now())
  reviewedAt        DateTime?
  reviewedBy        String?
  reviewNotes       String?
  bomUrl            String?
  drawingUrl        String?
  calculations      Json?
  customer          Customer @relation(fields: [customerId], references: [id])
  designer          User     @relation(fields: [designerId], references: [id])
}
```

**BillOfMaterials Table** (BOM management)
```prisma
model BillOfMaterials {
  id          String   @id @default(uuid())
  designId    String   @unique
  itemId      Int
  quantity    Int
  unitCost    Float
  totalCost   Float
  notes       String?
  design      SolarDesign @relation(fields: [designId], references: [id])
  item        Inventory  @relation(fields: [itemId], references: [id])
}
```

### Data Relationships

```
User (Solar Design Engineer)
  ├── EmployeeProfile (1:1)
  ├── Department (N:1) - Engineering department
  ├── Task[] (assigned design tasks)
  ├── SolarDesign[] (1:N) - Designs created
  └── AttendanceRecord[] (1:N)

SolarDesign
  ├── Customer (N:1) - Customer for design
  ├── Designer (N:1) - User who created design
  └── BillOfMaterials[] (1:N) - BOM items

BillOfMaterials
  ├── SolarDesign (N:1) - Associated design
  └── Inventory (N:1) - Item from inventory
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

### Design Management Endpoints

**GET /api/designs**
- Query params: `?designerId={id}&status={status}`
- Response: `SolarDesign[]`
- Used in: Design project list

**POST /api/designs**
- Request: `{ customerId, designerId, systemSizeKw, panelCount, inverterCapacity, calculations, bomUrl, drawingUrl }`
- Response: Created SolarDesign object
- Used in: Creating new design

**PUT /api/designs/{id}**
- Request: `{ systemSizeKw, panelCount, inverterCapacity, calculations, bomUrl, drawingUrl }`
- Response: Updated SolarDesign object
- Used in: Editing design

**POST /api/designs/{id}/submit**
- Request: `{}`
- Response: Updated SolarDesign with status = "submitted"
- Used in: Submitting design for review

**PUT /api/designs/{id}/review**
- Request: `{ reviewStatus, reviewNotes, reviewedBy }`
- Response: Updated SolarDesign with review data
- Used in: Reviewing designs

### BOM Management Endpoints

**GET /api/bom/{designId}**
- Response: `BillOfMaterials[]` for design
- Used in: Viewing BOM

**POST /api/bom**
- Request: `{ designId, itemId, quantity, unitCost, notes }`
- Response: Created BillOfMaterials object
- Used in: Adding BOM items

**PUT /api/bom/{id}**
- Request: `{ quantity, unitCost, notes }`
- Response: Updated BillOfMaterials object
- Used in: Editing BOM items

**DELETE /api/bom/{id}**
- Response: `{ message: "BOM item deleted successfully" }`
- Used in: Removing BOM items

### Site Survey Data Endpoints

**GET /api/site-surveys/{customerId}**
- Response: Site survey data for customer
- Used in: Accessing survey data for design

**GET /api/customers/{id}/survey-data**
- Response: Customer survey data including roof dimensions, shading analysis, etc.
- Used in: Design calculations

---

## Web UI Workflow

### Screen-by-Screen Navigation

```
Login Page (/login)
    ↓ [Authenticate as Solar Design Engineer]
Employee Dashboard (/employee/dashboard)
    ├── Design Projects (/employee/design-projects)
    ├── Create Design (/employee/create-design)
    ├── Design Review (/employee/design-review)
    ├── BOM Management (/employee/bom-management)
    ├── Technical Drawings (/employee/technical-drawings)
    ├── Calculations (/employee/calculations)
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

**Solar Design Engineer Specific**:
- Select "Employee" role
- Backend detects solar design engineer via `jobRole = 'solar design engineer'`
- Redirects to `/employee/dashboard` with design engineering features

### 2. Employee Dashboard (`/employee/dashboard`)

**Layout**: SidebarLayout with navigation

**Solar Design Engineer Specific Components**:
- Design project statistics cards
- Pending designs count
- Designs in progress
- Completed designs
- Quick create design button
- Design review queue

**Enhanced Task List**:
- Shows design-related tasks
- Filter by task type (Design, Review, Calculation)
- Priority indicators

### 3. Design Projects Page (`/employee/design-projects`)

**Layout**: SidebarLayout with project management

**Components**:
- PageHeader: "Design Projects"
- Project list with filters:
  - Status (Draft, Submitted, Under Review, Approved, Rejected)
  - Customer
  - Date range
- Search bar
- "Create New Design" button

**Project Card**:
- Customer name and ID
- System size (kW)
- Design status badge
- Submission date
- Review status
- Action buttons:
  - View/Edit
  - Submit
  - Delete (if draft)

**Project Detail View**:
- Customer information
- Site survey data summary
- Design parameters
- System specifications
- Calculations display
- BOM list
- Technical drawings
- Submission history
- Review feedback

### 4. Create Design Page (`/employee/create-design`)

**Layout**: SidebarLayout with design form

**Components**:
- Customer selection (dropdown with search)
- Site survey data display
- System parameters form:
  - System size (kW)
  - Panel type and count
  - Inverter selection
  - Orientation and tilt
  - Shading considerations
- Calculations section:
  - Energy output estimation
  - Production forecast
  - ROI calculation
- BOM generator:
  - Auto-generate from design
  - Manual adjustments
  - Cost estimation
- Drawing upload section:
  - Single line diagram
  - Layout drawing
  - Electrical schematic
- Save as draft button
- Submit for review button

### 5. Design Review Page (`/employee/design-review`)

**Layout**: SidebarLayout with review management

**Components**:
- Review queue list
- Filter by status (Pending, Approved, Rejected)
- Review detail view

**Review Process**:
- View design details
- Check calculations
- Review BOM
- Examine drawings
- Add review notes
- Approve or reject design
- Request revisions if needed

### 6. BOM Management Page (`/employee/bom-management`)

**Layout**: SidebarLayout with BOM management

**Components**:
- BOM list by design
- Item details
- Quantity and cost
- Supplier information
- Export BOM

**BOM Actions**:
- Add item
- Edit item
- Remove item
- Update costs
- Generate purchase order

### 7. Technical Drawings Page (`/employee/technical-drawings`)

**Layout**: SidebarLayout with drawing management

**Components**:
- Drawing list by design
- Drawing viewer
- Upload new drawing
- Version control
- Approval workflow

**Drawing Types**:
- Single line diagram
- Panel layout
- Electrical schematic
- Structural details
- Installation guide

### 8. Calculations Page (`/employee/calculations`)

**Layout**: SidebarLayout with calculation tools

**Components**:
- System sizing calculator
- Energy output calculator
- Production forecast
- ROI calculator
- Savings calculator

**Calculation Tools**:
- Input parameters
- Real-time calculations
- Results display
- Export calculations
- Save to design

---

## Android UI Workflow

### Mobile-Specific UI Patterns

**Bottom Navigation Bar**:
```
[Home] [Designs] [BOM] [Tasks] [Profile]
```

**Home Tab**:
- Design statistics
- Pending designs
- Quick actions
- Notifications

**Designs Tab**:
- Design project list
- Filter by status
- Quick create button
- Swipe actions (edit, submit, delete)

**BOM Tab**:
- BOM list
- Item details
- Cost summary
- Export options

**Tasks Tab**:
- Design-related tasks
- Task priority
- Due dates
- Progress tracking

**Profile Tab**:
- Personal profile
- Settings
- Logout

### Touch Interactions and Gestures

**Design Card Swipe Actions**:
- Swipe left: Edit design
- Swipe right: Submit design
- Long press: Quick actions menu
- Tap: View design details

**BOM Item Gestures**:
- Swipe left: Edit item
- Swipe right: Remove item
- Tap: View item details

**Calculation Input**:
- Touch-friendly input fields
- Slider controls for parameters
- Real-time result updates

### Offline Capabilities

**Offline Mode**:
- Cache design data
- Cache survey data
- Queue design submissions
- Queue BOM updates
- Sync when connection restored

### Push Notifications

**Notification Types**:
- Design review completed
- Design approved/rejected
- Revision requested
- New design assignment
- BOM update required
- Drawing approval

---

## Data Flow Diagrams

### Design Creation Flow

```
┌─────────────┐
│ Design      │
│  Projects   │
└──────┬──────┘
       │ Click "Create New Design"
       ↓
┌─────────────┐
│ Create      │
│  Design     │
│    Form     │
└──────┬──────┘
       │ Select customer
       │ Load survey data
       │ Enter system parameters
       ↓
┌─────────────┐
│ Calculations│
└──────┬──────┘
       │ Auto-calculate system specs
       │ Generate energy output
       ↓
┌─────────────┐
│ BOM         │
│ Generator   │
└──────┬──────┘
       │ Auto-generate BOM
       │ Calculate costs
       ↓
┌─────────────┐
│ Drawing     │
│   Upload    │
└──────┬──────┘
       │ Upload technical drawings
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/designs
       │ POST /api/bom (multiple)
       ↓
┌─────────────┐
│ Design      │
│  Controller │
└──────┬──────┘
       │ Create SolarDesign record
       │ Create BillOfMaterials records
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Insert SolarDesign
       │ Insert BillOfMaterials[]
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Created design with BOM
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show success message
       │ Refresh design list
       ↓
┌─────────────┐
│ Design      │
│  Projects   │
└─────────────┘
```

### Design Submission Flow

```
┌─────────────┐
│ Design      │
│   Detail    │
└──────┬──────┘
       │ Click "Submit for Review"
       ↓
┌─────────────┐
│ Submission  │
│  Confirm    │
└──────┬──────┘
       │ Review design summary
       │ Confirm submission
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/designs/{id}/submit
       ↓
┌─────────────┐
│ Design      │
│  Controller │
└──────┬──────┘
       │ Update design status
       │ Set submittedAt timestamp
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Update SolarDesign
       ↓
┌─────────────┐
│ Notification│
│  Service    │
└──────┬──────┘
       │ Notify reviewer
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Updated design
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show submitted status
       │ Disable edit
       ↓
┌─────────────┐
│ Design      │
│   Detail    │
└─────────────┘
```

---

## Feature-Specific Workflows

### Design Creation Workflow

**1. Initial Design**
```
Receive design request
    ↓
Select customer from list
    ↓
Load site survey data
    ↓
Review customer requirements
    ↓
Begin design process
```

**2. System Sizing**
```
Analyze site survey data
    ↓
Calculate optimal system size
    ↓
Select panel type and quantity
    ↓
Select inverter capacity
    ↓
Determine array configuration
    ↓
Calculate energy output
```

**3. BOM Generation**
```
Auto-generate BOM from design
    ↓
Review generated items
    ↓
Adjust quantities if needed
    ↓
Update costs
    ↓
Finalize BOM
```

**4. Drawing Creation**
```
Create single line diagram
    ↓
Create panel layout
    ↓
Create electrical schematic
    ↓
Add technical notes
    ↓
Upload drawings to system
```

**5. Design Submission**
```
Review complete design
    ↓
Verify all components
    ↓
Check calculations
    ↓
Submit for review
    ↓
Await feedback
```

### Design Review Workflow

**1. Review Assignment**
```
Design submitted for review
    ↓
Reviewer assigned
    ↓
Reviewer receives notification
    ↓
Reviewer opens design
```

**2. Design Evaluation**
```
Review system specifications
    ↓
Check calculations
    ↓
Verify BOM accuracy
    ↓
Examine drawings
    ↓
Assess compliance
```

**3. Review Decision**
```
Approve design
    ↓
OR Request revisions
    ↓
OR Reject design
    ↓
Add feedback notes
    ↓
Notify designer
```

**4. Revision Process**
```
Designer receives revision request
    ↓
Reviews feedback
    ↓
Makes required changes
    ↓
Resubmits design
    ↓
Goes through review again
```

### BOM Management Workflow

**1. BOM Creation**
```
Design completed
    ↓
Auto-generate BOM
    ↓
Review generated items
    ↓
Add or remove items
    ↓
Update quantities
    ↓
Finalize BOM
```

**2. BOM Updates**
```
Design changes required
    ↓
Update BOM accordingly
    ↓
Adjust quantities
    ↓
Update costs
    ↓
Save changes
```

**3. BOM Procurement**
```
BOM finalized
    ↓
Generate purchase order
    ↓
Send to suppliers
    ↓
Track delivery
    ↓
Update inventory
```

---

## Related Files

### Frontend Files
- `src/pages/Login.tsx` - Login page with role selection
- `src/pages/employee/Dashboard.tsx` - Main dashboard (can be extended for design features)
- `src/lib/auth.ts` - Authentication and role management
- `src/lib/api-client.ts` - API client implementation

### Backend Files
- `backend/prisma/schema.prisma` - Database schema (may need SolarDesign table added)
- `employee-login-system/src/routes/authRoutes.ts` - Authentication routes

### Components
- `src/components/SidebarLayout.tsx` - Main layout
- `src/components/PageHeader.tsx` - Page headers
- `src/components/StatCard.tsx` - Statistics cards

---

## Security Considerations

### Access Control
- Design engineers can only access their own designs
- Can view customer data for design purposes only
- Cannot modify customer information
- Cannot access other engineers' designs without permission

### Data Protection
- Design drawings protected
- Calculation data secured
- BOM information confidential
- Audit trail for all design changes

### Audit Trail
- All design creations logged
- All design modifications tracked
- All submissions recorded
- All reviews documented

---

## Performance Optimization

### Design Data Loading
- Lazy load design details
- Cache survey data
- Optimize calculation queries
- Paginate design lists

### Real-Time Updates
- WebSocket for review notifications
- Real-time collaboration on designs
- Live calculation updates

---

## Future Enhancements

### Planned Features
- AI-powered design optimization
- 3D design visualization
- Automated compliance checking
- Integration with CAD software
- Mobile design app
- Real-time collaboration tools
- Advanced simulation tools
- Integration with procurement systems
