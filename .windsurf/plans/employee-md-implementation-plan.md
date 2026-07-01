# Employee MD Files Implementation Plan

## Overview
This plan outlines the implementation of features from the markdown documentation files for each employee role into the Android application.

## Current Status Analysis

### Existing Implementations (Verified Complete)
1. **Sub-Admin/Service Coordinator** - `CoordinatorDashboard.kt`
   - Customer management UI
   - Inverter monitoring with live generation
   - AMC progress tracking
   - Complaint management
   - Credential management modal
   - Visit log table
   - Task assignment

2. **Site Survey Engineer** - `SurveyDashboard.kt`
   - GPS geofence verification
   - Rooftop dimensions input
   - Shading factor checklist
   - Photo documentation with compression
   - Survey submission

3. **Solar Design Engineer** - `DesignDashboard.kt`
   - Survey report queue
   - Technical parameters input
   - CAD/SLD file upload
   - Design review pipeline
   - Design submission

4. **Electrical Engineer** - `ElectricalDashboard.kt`
   - Commissioning queue
   - SLD schematic visualization
   - Compliance checklist
   - Earthing resistance validation
   - Document scanning
   - Commissioning submission

5. **Inventory Executive** - `InventoryDashboard.kt`
   - Stock ledger with alerts
   - QR/barcode scanner
   - Stock adjustment
   - Dispatch management

### Missing Database Entities
The following entities are referenced in the markdown docs but not yet implemented in the local database:

1. **CustomerEntity** - For local customer data storage
2. **DispatchRecordEntity** - For inventory dispatch tracking
3. **SolarDesignEntity** - For solar design management
4. **ElectricalDesignEntity** - For electrical design management

### Missing API Endpoints
The following endpoints are documented but may need to be added to ApiService.kt:

1. Customer management endpoints (partially implemented)
2. Dispatch record endpoints
3. Solar design endpoints
4. Electrical design endpoints

## Implementation Steps

### Step 1: Add Missing Database Entities

#### 1.1 Create CustomerEntity.kt
- Fields: id, customerCode, fullName, email, phoneNumber, city, address, systemSizeKw, installationDate, inverterBrand, inverterModel, amcStatus, status, inverterLoginId, inverterPassword, inverterApiKey, inverterDeviceSn, latitude, longitude
- Purpose: Local storage of customer data for offline access

#### 1.2 Create DispatchRecordEntity.kt
- Fields: id, customerId, itemId, quantity, dispatchedAt, notes
- Purpose: Track inventory dispatches locally

#### 1.3 Create SolarDesignEntity.kt
- Fields: id, customerId, engineerId, panelCount, inverterModel, systemCapacityKw, tiltAngle, cadLayoutPath, sldDiagramPath, designStatus, submittedAt, reviewedAt, reviewedBy
- Purpose: Store solar design data locally

#### 1.4 Create ElectricalDesignEntity.kt
- Fields: id, customerId, engineerId, systemSizeKw, mainBreakerSize, cableSize, designStatus, schematicUrl, loadCalculations, complianceCheck, submittedAt, reviewedAt
- Purpose: Store electrical design data locally

#### 1.5 Create Corresponding DAOs
- CustomerDao
- DispatchRecordDao
- SolarDesignDao
- ElectricalDesignDao

#### 1.6 Update AppDatabase.kt
- Add new entities to @Database annotation
- Add abstract DAO methods

### Step 2: Add Missing API Endpoints

#### 2.1 Update ApiService.kt
Add endpoints for:
- Dispatch records (GET, POST)
- Solar designs (GET, POST, PUT)
- Electrical designs (GET, POST, PUT)
- Customer operations (verify existing endpoints)

### Step 3: Update ViewModels

#### 3.1 Update MainViewModel.kt
Add StateFlow and methods for:
- Customer data management
- Dispatch record management
- Solar design management
- Electrical design management

### Step 4: Update Dashboard Screens (if needed)

#### 4.1 Review each dashboard for completeness
- Ensure all markdown features are represented
- Add any missing UI components

### Step 5: Testing

#### 5.1 Verify role-based routing
- Test login for each role
- Verify correct dashboard loads

#### 5.2 Verify offline functionality
- Test data persistence
- Test sync with outbox queue

#### 5.3 Verify feature completeness
- Test each feature against markdown requirements

## Priority Order
1. High: Database entities (foundational)
2. High: API endpoints (connectivity)
3. Medium: ViewModel updates (data layer)
4. Medium: UI enhancements (if needed)
5. Low: Testing and validation

## Notes
- The current implementation is quite comprehensive
- Most UI dashboards already implement the documented features
- Main gaps are in local data persistence for some entities
- API endpoints may need verification against backend implementation
