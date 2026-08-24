# Web App Optimization - Implementation Guide

## Phase 1: Database Schema & Migrations

### Changes Made
- Added `InverterInstallation` model - for managing multiple inverters per customer
- Added `GenerationLog` model - for historical generation tracking
- Added enums: `InverterProviderType`, `GenerationDataSource`
- Updated `Customer` model to include relationships

### Run Prisma Migration
```bash
cd backend
npx prisma migrate dev --name "add_multi_inverter_system"
npx prisma generate
```

---

## Phase 2: Provider Architecture Implementation

### File Structure to Create
```
backend/src/lib/
  ├── inverter-providers/
  │   ├── types.ts                 # TypeScript interfaces for providers
  │   ├── base-provider.ts         # Abstract base class
  │   ├── ksolar-provider.ts       # K-Solar implementation
  │   ├── growatt-provider.ts      # Growatt implementation
  │   ├── foxess-provider.ts       # FoxESS implementation
  │   ├── utl-provider.ts          # UTL implementation
  │   ├── generic-provider.ts      # Generic REST implementation
  │   └── provider-registry.ts     # Provider factory & registry

backend/src/services/
  ├── inverter-service.ts          # Inverter management service
  ├── generation-log-service.ts    # Historical data service
  └── inverter-analytics-service.ts # Analytics aggregation
```

### Critical Implementation Points

#### 1. Provider Interface (types.ts)
- `getRealtime()` - Current power, today/month/year/lifetime generation
- `getHistory(period)` - Historical data points
- `getStatus()` - Online/offline status
- All providers return standardized `RealtimeInverterData` structure

#### 2. Base Provider Class
- Handles credential encryption/decryption
- Implements retry logic with exponential backoff
- Manages error handling & status tracking
- Updates GenerationLog after each fetch

#### 3. Provider Registry
- Maps `InverterProviderType` to provider instance
- Handles parallel fetches for multiple inverters
- Uses `Promise.allSettled` to prevent cascade failures
- Normalizes response data

---

## Phase 3: Task Notification Enhancement

### Current Status
✓ Notification infrastructure EXISTS
✓ `notifyTaskScheduled()` creates customer notifications
✓ `CustomerNotification` model is working

### What's Needed
1. Frontend UI to display notifications to customers
2. Employee phone number in task notification message
3. Task status updates sent to customer

### Backend Changes Required
- Enhance `notifyTaskScheduled()` to include employee details
- Implement `notifyTaskStatusChange()` for real-time updates
- Add WebSocket support for live notification updates (optional)

---

## Phase 4: Customer Profile Enhancements

### Fields Already in Database
✓ inverterName
✓ inverterBrand  
✓ inverterUid
✓ inverterModel

### What Needs Work
1. **Update Customer API** - Expose these fields in GET/UPDATE endpoints
2. **Frontend Profile Edit** - Add inverter section in customer profile page
3. **For Coordinators** - Show inverter details when viewing customer

### API Endpoints Needed
```
GET    /api/v1/customers/:id                 # Get customer (include inverter fields)
PATCH  /api/v1/customers/:id                 # Update customer
GET    /api/v1/admin/customers/:id/inverters # Get all inverters for customer
POST   /api/v1/admin/customers/:id/inverters # Add new inverter
PATCH  /api/v1/admin/inverters/:id           # Update inverter
DELETE /api/v1/admin/inverters/:id           # Remove inverter
```

---

## Phase 5: Inverter Analytics Dashboard

### Coordinator View - Analytics Endpoints
```
GET /api/v1/subadmin/customers/:customerId/inverter-generation
  Returns:
  {
    inverters: [
      {
        id, brand, model, capacity,
        currentPowerW,
        todayGenerationKwh,
        monthGenerationKwh,
        yearGenerationKwh,
        lifetimeGenerationKwh,
        status, lastUpdated,
        dataSource
      }
    ]
  }

GET /api/v1/subadmin/customers/:customerId/inverter-generation-history
  Params: period (today|7days|month|year|custom), startDate?, endDate?
  Returns: Array of {timestamp, powerW, generationKwh}

GET /api/v1/subadmin/analytics/inverter-performance
  Params: customerId, startDate, endDate
  Returns: Aggregated stats, alerts, comparison data
```

### Customer View - Analytics Endpoints
```
GET /api/v1/customers/me/inverters
  Returns: Inverters user owns

GET /api/v1/customers/me/inverter-generation
  Returns: Current generation data for all their inverters

GET /api/v1/customers/me/inverter-generation-history
  Returns: Historical data for their inverters
```

---

## Phase 6: Multi-Inverter Fetch Scheduler

### Background Jobs
- **5-minute interval**: Current power & status for all active inverters
- **30-minute interval**: Daily/monthly/yearly generation stats
- **Hourly interval**: Fetch history if missing data detected

### Implementation
```typescript
// backend/src/lib/inverter-scheduler.ts
export function startInverterScheduler() {
  // Initialize all providers
  // Set up intervals for each fetch type
  // Handle cascade failures gracefully
}
```

---

## Implementation Priority

### Immediate (Week 1)
1. ✓ Database schema changes (DONE)
2. Create provider architecture & base classes
3. Update task notifications UI for customers
4. Add inverter fields to customer profile endpoints

### Short-term (Week 2)
1. Implement K-Solar, Growatt, FoxESS providers
2. Create analytics endpoints
3. Build coordinator analytics dashboard
4. Build customer analytics view

### Medium-term (Week 3-4)
1. Add remaining inverter brands
2. Implement multi-brand UI
3. Add alerts & anomaly detection
4. Optimize performance & caching

---

## Testing Checklist

### Unit Tests
- [ ] Each provider handles credentials correctly
- [ ] Error handling doesn't cascade
- [ ] Data normalization is consistent
- [ ] GenerationLog entries are accurate

### Integration Tests
- [ ] Multi-inverter fetch works in parallel
- [ ] Customer notifications display correctly
- [ ] Profile editing updates database
- [ ] Analytics queries return correct data

### UI/E2E Tests
- [ ] Customer sees task notifications
- [ ] Coordinator can view inverter analytics
- [ ] Profile edit saves inverter changes
- [ ] Before/after images upload correctly

---

## Database Maintenance

### Cleanup Scripts
```sql
-- Archive old generation logs (optional)
DELETE FROM generation_logs 
WHERE "timestamp" < NOW() - INTERVAL '1 year'
  AND "dataSource" = 'SIMULATED';

-- Find inactive installations
SELECT * FROM inverter_installations 
WHERE "isActive" = false 
  AND "lastFetchTime" < NOW() - INTERVAL '30 days';
```

---

## Migration Rollback (if needed)
```bash
npx prisma migrate resolve --rolled-back add_multi_inverter_system
npx prisma migrate deploy
```
