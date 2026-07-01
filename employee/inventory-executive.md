# Inventory Executive - Complete Workflow Documentation

## Role Overview

**Role Name**: Inventory Executive  
**Hierarchy Level**: Operational inventory management  
**Reports To**: Admin / Department Head (Inventory Department)  
**Manages**: Inventory stock, procurement, and dispatch operations  
**Access Level**: Inventory management access with customer dispatch capabilities  

### Responsibilities
- Manage inventory stock levels and procurement
- Track solar components and materials
- Process inventory dispatches to customers
- Monitor stock thresholds and reorder points
- Coordinate with suppliers for procurement
- Generate inventory reports
- Manage supplier relationships
- Track inventory movements and audits
- Ensure optimal stock levels for operations

---

## Login Mechanism

### Authentication Flow

```
User enters credentials (Email/Login ID + Password)
    ↓
Role selection: "Employee" (with jobRole = "inventory executive")
    ↓
POST /api/auth/login
    ↓
Backend validates credentials against User table
    ↓
Check: role = 'EMPLOYEE' with jobRole = 'inventory executive'
    ↓
Check: isActive = true
    ↓
Check: failedLoginAttempts < 5 and lockoutUntil is null/expired
    ↓
Generate JWT access token + refresh token
    ↓
Store tokens (access in localStorage, refresh in httpOnly cookie)
    ↓
Redirect to: /inventory/dashboard
    ↓
Detected via: isInventoryExecutiveJobRole() function
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
export function isInventoryExecutiveJobRole(jobRole?: string): boolean {
  if (!jobRole) return false;
  const normalized = jobRole.trim().toLowerCase().replace(/[_\s-]+/g, " ");
  return normalized === "inventory executive";
}

export function getRoleDashboardPath(role: UserRole, jobRole?: string): string {
  if (isInventoryExecutiveJobRole(jobRole)) {
    return '/inventory/dashboard';
  }
  // ... other roles
}
```

**Job Role Detection**:
```typescript
// Inventory Executive is identified by:
// - role = 'EMPLOYEE' with jobRole = 'inventory executive'
```

---

## Features & Capabilities

### Feature Access Matrix

| Feature | Access Level | Description |
|---------|-------------|-------------|
| Dashboard | ✅ Full | Inventory overview, stock levels, alerts |
| Inventory Management | ✅ Full | Add, edit, delete inventory items |
| Stock Tracking | ✅ Full | Monitor stock levels, thresholds |
| Dispatch Management | ✅ Full | Process dispatches to customers |
| Supplier Management | ✅ Full | Manage supplier information |
| Reporting | ✅ Full | Generate inventory reports |
| Low Stock Alerts | ✅ Full | Receive and manage low stock alerts |
| Procurement | ✅ Full | Manage procurement requests |
| Audit Trail | ✅ Full | View inventory movement history |
| Profile Management | ✅ Full | Update personal information |
| Task Management | ❌ No | Cannot access task management |
| Customer Management | ❌ Limited | Can only dispatch to existing customers |
| Admin Features | ❌ No | No administrative access |

### Dashboard Components

**Stat Cards**:
- Total Items in Inventory
- Low Stock Items (below threshold)
- Out of Stock Items
- Total Categories
- Today's Dispatches
- Pending Procurement Requests

**Main Sections**:
- Inventory list with search and filters
- Stock level indicators
- Quick add item button
- Dispatch management
- Low stock alerts
- Recent dispatches

---

## Database Integration

### Primary Tables Used

**User Table** (Inventory Executive data)
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
  departmentId        String?               // INVENTORY department
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
  jobRole          String          @default("inventory executive")
  zone             String?
  monthlySalaryInr Int?
  isActive         Boolean         @default(true)
  // ... other fields
}
```

**Inventory Table** (Core inventory management)
```prisma
model Inventory {
  id           Int              @id @default(autoincrement())
  sku          String           @unique
  name         String
  category     String
  inStock      Int              @default(0)
  minThreshold Int              @default(0)
  supplier     String?
  pricePerUnit Float            @default(0)
  entryDate    DateTime         @default(now())
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  dispatches   DispatchRecord[]
}
```

**DispatchRecord Table** (Inventory dispatch tracking)
```prisma
model DispatchRecord {
  id           String    @id @default(uuid())
  customerId   Int
  itemId       Int
  quantity     Int
  dispatchedAt DateTime  @default(now())
  notes        String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  customer     Customer  @relation(fields: [customerId], references: [id])
  item         Inventory @relation(fields: [itemId], references: [id])
}
```

**Customer Table** (For dispatch destinations)
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
  // NEW FIELDS (Added for Android sync)
  cleaningWindow1     String?
  cleaningWindow2     String?
  cleaningWindow3     String?
  cleaningsPerMonth   Int?
  clientType          String?
  consumerNumber      String?
  contractEndDate     DateTime?
  contractStartDate   DateTime?
  monthlyCleaningRate Float?
  paymentTerms        String?
  remarks             String?
  cleaningWindow4     String?
  cleaningWindow5     String?
  cleaningWindow6     String?
  cleaningWindow7     String?
  cleaningWindow8     String?
  commissionProofUrl  String?
  commissionPaidAt    DateTime?
  apartmentId         Int?
  // ... other fields
  dispatchRecords     DispatchRecord[]
  invoices            Invoice[]
  payments            Payment[]
}
```

**Invoice Table** (NEW - Invoice tracking for inventory)
```prisma
model Invoice {
  id            String   @id @default(uuid())
  invoiceNumber String?
  customerId    Int
  invoiceType   String
  amount        Float
  paymentStatus String
  amountPaid    Float
  invoiceDate   DateTime
  paymentDate   DateTime?
  zone          String?
  state         String?
  partnerId     String?
  description   String?
  paymentMethod String?
  proofUrl      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  customer      Customer @relation(fields: [customerId], references: [id])
}
```

**Payment Table** (NEW - Payment processing)
```prisma
model Payment {
  id           String   @id @default(uuid())
  taskId       Int?
  customerId   Int
  amount       Float
  paymentMethod String?
  paymentStatus String
  transactionId String?
  paidBy       String?
  paidAt       DateTime?
  processedBy  String?
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  customer     Customer @relation(fields: [customerId], references: [id])
}
```

**TaskAssignment Table** (NEW - Multi-employee task assignment)
```prisma
model TaskAssignment {
  id             String   @id @default(uuid())
  taskId         Int
  employeeUserId String
  assignedAt     DateTime @default(now())
  status         String
}
```

**TaskImage Table** (NEW - Geo-tagged task images)
```prisma
model TaskImage {
  id            String   @id @default(uuid())
  taskId        Int
  employeeUserId String
  type          String
  url           String
  latitude      Float?
  longitude     Float?
  watermarkText String?
  uploadedAt    DateTime @default(now())
}
```

### Data Relationships

```
User (Inventory Executive)
  ├── EmployeeProfile (1:1)
  ├── Department (N:1) - Inventory department
  └── manages inventory

Inventory
  ├── DispatchRecord[] (1:N) - All dispatches of this item
  └── supplier (string field)

DispatchRecord
  ├── Inventory (N:1) - Item being dispatched
  └── Customer (N:1) - Customer receiving item

Customer
  └── DispatchRecord[] (1:N) - All items dispatched to customer
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

### Inventory Management Endpoints

**GET /api/inventory**
- Query params: `?category={category}&search={search}`
- Response: `Inventory[]`
- Used in: `src/pages/inventory/InventoryDashboard.tsx`

**POST /api/inventory**
- Request: `{ sku, name, category, inStock, minThreshold, supplier, pricePerUnit }`
- Response: Created Inventory object
- Used in: Adding new inventory items

**PUT /api/inventory/{id}**
- Request: `{ sku, name, category, inStock, minThreshold, supplier, pricePerUnit }`
- Response: Updated Inventory object
- Used in: Editing inventory items

**DELETE /api/inventory/{id}**
- Response: `{ message: "Item deleted successfully" }`
- Used in: Deleting inventory items

**GET /api/inventory/low-stock**
- Response: `Inventory[]` with inStock <= minThreshold
- Used in: Low stock alerts

**GET /api/inventory/out-of-stock**
- Response: `Inventory[]` with inStock = 0
- Used in: Out of stock alerts

### Dispatch Management Endpoints

**GET /api/dispatches**
- Query params: `?customerId={id}&itemId={id}`
- Response: `DispatchRecord[]`
- Used in: Viewing dispatch history

**POST /api/dispatches**
- Request: `{ customerId, itemId, quantity, notes }`
- Response: Created DispatchRecord
- Used in: Creating dispatches

**PUT /api/dispatches/{id}**
- Request: `{ quantity, notes }`
- Response: Updated DispatchRecord
- Used in: Modifying dispatches

**DELETE /api/dispatches/{id}**
- Response: `{ message: "Dispatch deleted successfully" }`
- Used in: Canceling dispatches

**GET /api/dispatches/today**
- Response: `DispatchRecord[]` for today
- Used in: Today's dispatches overview

### Reporting Endpoints

**GET /api/inventory/report**
- Query params: `?startDate={date}&endDate={date}`
- Response: Inventory report with movements
- Used in: Generating inventory reports

**GET /api/dispatches/report**
- Query params: `?startDate={date}&endDate={date}`
- Response: Dispatch report
- Used in: Generating dispatch reports

---

## Web UI Workflow

### Screen-by-Screen Navigation

```
Login Page (/login)
    ↓ [Authenticate as Inventory Executive]
Inventory Dashboard (/inventory/dashboard)
    ├── Inventory List (/inventory/inventory)
    ├── Dispatch Management (/inventory/dispatches)
    ├── Inventory Customers (/inventory/customers)
    ├── Settings (/inventory/settings)
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

**Inventory Executive Specific**:
- Select "Employee" role
- Backend detects inventory executive via `jobRole = 'inventory executive'`
- Redirects to `/inventory/dashboard`

### 2. Inventory Dashboard (`/inventory/dashboard`)

**Layout**: SidebarLayout with inventory management

**Components**:
- PageHeader: "Inventory Management"
- Statistics cards:
  - Total Items
  - Low Stock Items
  - Out of Stock Items
  - Total Categories
  - Today's Dispatches
- Search bar
- Category filter dropdown
- "Add Item" button
- Inventory list/table

**Inventory List Features**:
- Search by name or SKU
- Filter by category
- Sort by stock level, name, category
- Color-coded stock indicators:
  - Green: Stock above threshold
  - Yellow: Stock at or near threshold
  - Red: Stock below threshold
- Action buttons per item:
  - Edit
  - Delete
  - Dispatch
  - View History

**Stock Level Indicators**:
- Visual progress bar showing stock level
- Threshold marker
- Current stock count
- Percentage of threshold

**Quick Actions**:
- Add new item button
- Export inventory list
- Generate report
- View low stock items

### 3. Inventory Item Management

**Add Item Modal**:
- SKU input (auto-generated or manual)
- Name input
- Category dropdown
- Initial stock quantity
- Minimum threshold
- Supplier dropdown/input
- Price per unit
- Entry date (auto-filled)
- Save button

**Edit Item Modal**:
- All fields from add modal
- Pre-filled with current data
- Stock adjustment option
- Supplier update option
- Price update option
- Save changes button

**Delete Confirmation**:
- Warning message
- Item details
- Confirm delete button
- Cancel button

### 4. Dispatch Management

**Dispatch Creation**:
- Customer selection (dropdown with search)
- Item selection (dropdown with search)
- Quantity input
- Notes textarea (optional)
- Check stock availability
- Create dispatch button

**Dispatch List**:
- All dispatches
- Filter by date, customer, item
- Sort by date, quantity
- Status indicators
- Action buttons:
  - View details
  - Modify
  - Cancel

**Dispatch Details**:
- Customer information
- Item details
- Quantity dispatched
- Dispatch date/time
- Notes
- Dispatched by

### 5. Inventory Customers (`/inventory/customers`)

**Customer List for Dispatch**:
- Searchable customer list
- Filter by city, status
- Customer details:
  - Name
  - Customer code
  - Address
  - Phone
  - System size
- Dispatch history button
- Quick dispatch button

**Customer Dispatch History**:
- All dispatches to customer
- Item details
- Quantities
- Dates
- Notes

### 6. Inventory Settings (`/inventory/settings`)

**Settings Sections**:
- Default threshold values by category
- Supplier management
- Notification preferences
- Report settings
- Export settings

**Supplier Management**:
- Add supplier
- Edit supplier
- Delete supplier
- View supplier items

---

## Android UI Workflow

### Mobile-Specific UI Patterns

**Bottom Navigation Bar**:
```
[Home] [Inventory] [Dispatch] [Customers] [Profile]
```

**Home Tab**:
- Inventory statistics cards
- Low stock alerts
- Today's dispatches
- Quick actions

**Inventory Tab**:
- Inventory list with search
- Filter by category
- Stock level indicators
- Quick add button
- Swipe actions (edit, delete, dispatch)

**Dispatch Tab**:
- Today's dispatches
- Create new dispatch
- Dispatch history
- Filter by status

**Customers Tab**:
- Customer list
- Quick dispatch
- Customer details
- Dispatch history

**Profile Tab**:
- Personal profile
- Settings
- Logout

### Touch Interactions and Gestures

**Inventory Item Swipe Actions**:
- Swipe left: Edit item
- Swipe right: Dispatch item
- Long press: Quick actions menu
- Tap: View item details

**Dispatch Gestures**:
- Swipe left: View details
- Swipe right: Cancel dispatch
- Tap: Modify dispatch

**Customer Card Swipe Actions**:
- Swipe left: View dispatch history
- Swipe right: Quick dispatch
- Tap: View customer details

### Offline Capabilities

**Offline Mode**:
- Cache inventory data
- Cache customer data
- Queue dispatch creations
- Queue inventory updates
- Sync when connection restored

**Data Persistence**:
- IndexedDB for inventory data
- localStorage for preferences
- Service worker for offline support

### Push Notifications

**Notification Types**:
- Low stock alert
- Out of stock alert
- Dispatch confirmation
- Procurement reminder
- Supplier update
- Inventory audit reminder

**Notification Handling**:
- Tap: Navigate to relevant screen
- Low stock notification → Open inventory list
- Dispatch notification → Open dispatch details
- Swipe: Dismiss
- Long press: Notification options

---

## Data Flow Diagrams

### Inventory Item Creation Flow

```
┌─────────────┐
│ Inventory   │
│  Dashboard  │
└──────┬──────┘
       │ Click "Add Item"
       ↓
┌─────────────┐
│ Add Item    │
│   Modal     │
└──────┬──────┘
       │ Fill item details
       │ Enter SKU, name, category
       │ Set stock and threshold
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ POST /api/inventory
       ↓
┌─────────────┐
│ Inventory   │
│  Controller │
└──────┬──────┘
       │ Validate SKU uniqueness
       │ Validate data
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Insert Inventory record
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Created Inventory object
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show success message
       │ Refresh inventory list
       ↓
┌─────────────┐
│ Inventory   │
│  Dashboard  │
└─────────────┘
```

### Dispatch Creation Flow

```
┌─────────────┐
│ Dispatch    │
│   Page      │
└──────┬──────┘
       │ Click "Create Dispatch"
       ↓
┌─────────────┐
│ Dispatch    │
│   Form      │
└──────┬──────┘
       │ Select customer
       │ Select item
       │ Enter quantity
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ Check stock availability
       │ POST /api/dispatches
       ↓
┌─────────────┐
│ Dispatch    │
│  Controller │
└──────┬──────┘
       │ Validate stock >= quantity
       │ Create DispatchRecord
       │ Update Inventory stock
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Insert DispatchRecord
       │ Update Inventory (inStock -= quantity)
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Created DispatchRecord
       ↓
┌─────────────┐
│  UI Update  │
└──────┬──────┘
       │ Show success message
       │ Refresh inventory list
       │ Refresh dispatch list
       ↓
┌─────────────┐
│ Dispatch    │
│   Page      │
└─────────────┘
```

### Low Stock Alert Flow

```
┌─────────────┐
│ Inventory   │
│  Dashboard  │
└──────┬──────┘
       │ Load inventory
       ↓
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ GET /api/inventory
       ↓
┌─────────────┐
│ Inventory   │
│  Controller │
└──────┬──────┘
       │ Query Inventory table
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │ Inventory[]
       ↓
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ Inventory[]
       ↓
┌─────────────┐
│ Stock Check │
└──────┬──────┘
       │ Filter: inStock <= minThreshold
       ↓
┌─────────────┐
│  UI Render  │
└──────┬──────┘
       │ Highlight low stock items
       │ Show alert badge
       │ Send notification if new
       ↓
┌─────────────┐
│ Inventory   │
│  Dashboard  │
└─────────────┘
```

---

## Feature-Specific Workflows

### Inventory Management Workflow

**1. Item Procurement**
```
Inventory item needed
    ↓
Check supplier availability
    ↓
Create procurement request
    ↓
Receive items from supplier
    ↓
Add items to inventory
    ↓
Update stock levels
```

**2. Stock Monitoring**
```
Inventory Executive reviews dashboard
    ↓
Checks stock levels
    ↓
Identifies low stock items
    ↓
Initiates procurement
    ↓
Updates thresholds if needed
```

**3. Inventory Audit**
```
Schedule inventory audit
    ↓
Perform physical count
    ↓
Compare with system records
    ↓
Identify discrepancies
    ↓
Adjust system records
    ↓
Document findings
```

### Dispatch Management Workflow

**1. Dispatch Request**
```
Customer needs items
    ↓
Inventory Executive receives request
    ↓
Checks stock availability
    ↓
Creates dispatch record
    ↓
Updates inventory
    ↓
Notifies customer
```

**2. Dispatch Processing**
```
Dispatch created
    ↓
Items picked from inventory
    ↓
Items packaged
    ↓
Dispatch handed to courier
    ↓
Dispatch status updated
    ↓
Customer notified
```

**3. Dispatch Tracking**
```
Monitor dispatch status
    ↓
Track delivery progress
    ↓
Confirm delivery
    ↓
Update dispatch record
    ↓
Close dispatch
```

### Supplier Management Workflow

**1. Supplier Onboarding**
```
New supplier identified
    ↓
Add supplier to system
    ↓
Enter supplier details
    ↓
Link supplier to items
    ↓
Set pricing terms
```

**2. Supplier Performance**
```
Monitor supplier deliveries
    ↓
Track delivery times
    ↓
Assess quality
    ↓
Rate supplier performance
    ↓
Address issues
```

**3. Procurement Coordination**
```
Identify procurement needs
    ↓
Contact suppliers
    ↓
Get quotes
    ↓
Select supplier
    ↓
Place order
    ↓
Track delivery
    ↓
Receive and verify
```

### Reporting Workflow

**1. Inventory Report**
```
Select report type
    ↓
Set date range
    ↓
Apply filters
    ↓
Generate report
    ↓
Review data
    ↓
Export (PDF/Excel)
```

**2. Dispatch Report**
```
Select report parameters
    ↓
Set date range
    ↓
Filter by customer/item
    ↓
Generate report
    ↓
Review dispatch data
    ↓
Export report
```

**3. Stock Analysis**
```
Select analysis period
    ↓
Generate stock trends
    ↓
Identify patterns
    ↓
Make recommendations
    ↓
Share with management
```

---

## Related Files

### Frontend Files
- `src/pages/Login.tsx` - Login page with role selection
- `src/pages/inventory/InventoryDashboard.tsx` - Main inventory dashboard
- `src/pages/inventory/Inventory.tsx` - Inventory management
- `src/pages/inventory/InventoryCustomers.tsx` - Customer dispatch management
- `src/pages/inventory/Settings.tsx` - Inventory settings
- `src/lib/auth.ts` - Authentication and role management
- `src/lib/api-client.ts` - API client with inventory endpoints

### Backend Files
- `backend/prisma/schema.prisma` - Database schema with Inventory and DispatchRecord
- `backend/src/modules/inventory/inventory.routes.ts` - Inventory routes
- `backend/src/modules/inventory/inventory.service.ts` - Inventory service
- `backend/src/modules/inventory/inventory.controller.ts` - Inventory controller
- `backend/src/modules/inventory/inventory.schemas.ts` - Inventory validation schemas

### Components
- `src/components/SidebarLayout.tsx` - Main layout
- `src/components/PageHeader.tsx` - Page headers
- `src/components/StatCard.tsx` - Statistics cards
- `src/components/ConfirmModal.tsx` - Confirmation dialogs
- `src/pages/admin/AdminInventoryFormModal.tsx` - Inventory form modal

---

## Security Considerations

### Access Control
- Inventory executives can only access inventory-related features
- Cannot access task management or customer management beyond dispatch
- Cannot modify system settings
- Dispatch limited to existing customers

### Data Integrity
- Stock updates require validation
- Dispatch creation checks stock availability
- SKU uniqueness enforced
- Audit trail for all inventory movements

### Audit Trail
- All inventory changes logged
- All dispatches tracked
- Stock adjustments recorded
- User actions attributed

---

## Performance Optimization

### Inventory Data Loading
- Lazy load inventory details
- Cache inventory lists
- Paginate large inventories
- Optimize stock queries

### Real-Time Updates
- WebSocket for stock alerts
- Real-time dispatch updates
- Live inventory synchronization

---

## Future Enhancements

### Planned Features
- Barcode/QR code scanning for items
- Automated procurement suggestions
- Supplier portal integration
- Mobile inventory scanning app
- Predictive stock forecasting
- Multi-warehouse support
- Integration with accounting systems
- Automated reordering
