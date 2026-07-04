# Service Coordinator - Multi-Inverter Real-Time Data Fetch Implementation

## Current State
- **Service Coordinator Dashboard**: Shows single inverter data per customer
- **Data Source**: Customer table with single `inverterBrand`, `inverterLoginId`, `inverterPassword`, `inverterApiKey`, `inverterDeviceSn`
- **Working Integration**: KSolar (ShineMonitor) - do NOT break this
- **Problem**: No support for customers with multiple inverters

## Goal
Enable service coordinator to:
1. View all inverters a customer has when selecting them
2. Fetch real-time data for **each inverter** simultaneously
3. Support both KSolar (ShineMonitor) and UTL Solar (FoxESS Cloud API)
4. Preserve existing KSolar functionality

## Architecture Overview

```
Customer (has many inverters)
    ├── Inverter 1 (KSolar/ShineMonitor)
    │   └── Real-time data: currentPowerW, dailyGenerationKwh, etc.
    ├── Inverter 2 (UTL Solar/FoxESS)
    │   └── Real-time data: currentPowerW, monthGenerationKwh, etc.
    └── Inverter 3 (Growatt)
        └── Real-time data from GrowattGeneration table
```

## Phase 1: Database Schema Updates

### 1.1 Create `InverterInstallation` Model (New)

Add to `backend/prisma/schema.prisma`:

```prisma
model InverterInstallation {
  id                    Int                 @id @default(autoincrement())
  customerId            Int                 @unique  // Change to non-unique for multiple inverters: remove @unique later
  
  // Inverter identification
  inverterBrand         String              // "KSolar", "UTL", "UTLSolar", "Growatt", "FoxESS", etc.
  inverterModel         String?             // e.g., "KS5K", "KS6K", "KS10K"
  inverterSerialNumber  String?             // Inverter serial/model number
  
  // Credentials for different brands
  inverterLoginId       String?             // KSolar/ShineMonitor username
  inverterPassword      String?             // KSolar/ShineMonitor password
  apiKey                String?             // FoxESS/UTL Solar API key
  deviceSn              String?             // FoxESS/UTL Solar device serial number
  plantId               String?             // Growatt plant ID
  
  // System info
  capacity              Float?              // Capacity in kW
  installationDate      DateTime?
  lastFetchedAt         DateTime?
  
  // Metadata
  fetchError            String?             // Last error message if any
  credentialsVerified   Boolean             @default(false)
  isActive              Boolean             @default(true)
  apiUrl                String?             // Optional custom API endpoint
  
  // Relations
  customer              Customer            @relation(fields: [customerId], references: [id], onDelete: Cascade)
  generationLogs        GenerationLog[]
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  
  @@index([customerId])
  @@index([inverterBrand])
  @@index([lastFetchedAt])
}
```

### 1.2 Create `GenerationLog` Model (New)

Add to `backend/prisma/schema.prisma`:

```prisma
model GenerationLog {
  id                    String              @id @default(uuid())
  
  // Links to inverter
  installationId        Int
  customerId            Int
  
  // Time period
  date                  DateTime            @db.Date
  periodType            String              // "HOUR", "DAY", "MONTH", "YEAR"
  
  // Generation data
  actualGeneration      Float               // kWh generated
  expectedGeneration    Float?              // kWh expected (baseline)
  generationDropPct     Int?                // Percentage drop from expected
  
  // Metadata
  dataSource            String              // "foxess", "shinemonitor", "growatt", "manual"
  isAlert               Boolean             @default(false)
  fetchedFromApi        Boolean             @default(true)
  manualEntry           Boolean             @default(false)
  
  // Relations
  installation          InverterInstallation @relation(fields: [installationId], references: [id], onDelete: Cascade)
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  
  @@unique([installationId, date, periodType])
  @@index([customerId])
  @@index([installationId])
  @@index([date])
  @@index([periodType])
  @@index([isAlert])
}
```

### 1.3 Update `Customer` Model (Modify)

```prisma
model Customer {
  // ... existing fields ...
  
  // DEPRECATED - kept for backward compatibility with single inverter
  inverterBrand       String?
  inverterLoginId     String?
  inverterPassword    String?
  inverterApiKey       String?
  inverterDeviceSn     String?
  
  // NEW - relation to multiple inverters
  inverterInstallations InverterInstallation[]
  
  // ... rest of existing fields ...
}
```

### 1.4 Run Migration

```bash
cd backend
npm run prisma:migrate:dev --name add_multi_inverter_support
npm run prisma:generate
```

## Phase 2: Backend Implementation

### 2.1 Fetch All Inverters for a Customer

File: `backend/src/routes/subadmin.ts`

```typescript
// GET /subadmin/customers/:customerId/inverters
router.get('/customers/:customerId/inverters',
  authenticate,
  requireRole(['ADMIN','SUPER_ADMIN','SUB_ADMIN','EMPLOYEE']),
  async (req, res) => {
    try {
      const { customerId } = req.params;
      
      // Fetch all inverters for this customer
      const inverters = await prisma.inverterInstallation.findMany({
        where: { customerId: parseInt(customerId) },
        orderBy: { createdAt: 'asc' }
      });
      
      if (!inverters.length) {
        // Fallback to legacy single-inverter from Customer table
        const customer = await prisma.customer.findUnique({
          where: { id: parseInt(customerId) }
        });
        
        if (customer?.inverterBrand) {
          return res.json([{
            id: 0, // synthetic ID for legacy inverter
            customerId: parseInt(customerId),
            inverterBrand: customer.inverterBrand,
            inverterLoginId: customer.inverterLoginId,
            inverterPassword: customer.inverterPassword,
            apiKey: customer.inverterApiKey,
            deviceSn: customer.inverterDeviceSn,
            capacity: customer.systemSizeKw,
            isLegacy: true
          }]);
        }
        
        return res.json([]);
      }
      
      res.json(inverters);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);
```

### 2.2 Fetch Real-Time Data for All Inverters

File: `backend/src/routes/subadmin.ts`

```typescript
// GET /subadmin/customers/:customerId/all-inverters-realtime
router.get('/customers/:customerId/all-inverters-realtime',
  authenticate,
  requireRole(['ADMIN','SUPER_ADMIN','SUB_ADMIN','EMPLOYEE']),
  async (req, res) => {
    try {
      const { customerId } = req.params;
      const parsedId = parseInt(customerId);
      
      // Fetch all inverters
      const inverters = await prisma.inverterInstallation.findMany({
        where: { customerId: parsedId, isActive: true }
      });
      
      if (!inverters.length) {
        // Fallback to legacy single inverter
        const customer = await prisma.customer.findUnique({
          where: { id: parsedId }
        });
        
        if (!customer?.inverterBrand) {
          return res.json({ dataUnavailable: true, unavailableReason: 'No inverters configured' });
        }
        
        // Fetch legacy KSolar data
        try {
          const data = await fetchShineMonitorData(customer.inverterLoginId, customer.inverterPassword);
          return res.json({
            inverters: [{
              id: 0,
              inverterBrand: customer.inverterBrand,
              realtimeData: data
            }]
          });
        } catch (err: any) {
          return res.json({ dataUnavailable: true, unavailableReason: err.message });
        }
      }
      
      // Fetch real-time data for all inverters in parallel
      const results = await Promise.allSettled(
        inverters.map(async (inv) => {
          try {
            let realtimeData;
            
            const brand = (inv.inverterBrand || '').toLowerCase();
            
            if (brand.includes('ksolar') || brand.includes('k-solar')) {
              // KSolar via ShineMonitor
              realtimeData = await fetchShineMonitorData(inv.inverterLoginId, inv.inverterPassword);
            } else if (brand.includes('utl') || brand.includes('foxess')) {
              // UTL Solar / FoxESS
              realtimeData = await fetchUTLRealtimeGeneration(inv);
            } else if (brand.includes('growatt')) {
              // Growatt - fetch from GrowattGeneration table
              const growattGen = await prisma.growattGeneration.findFirst({
                where: { growattCustomer: { plantId: inv.plantId } }
              });
              realtimeData = {
                currentPowerW: growattGen?.currentPower || 0,
                todayGenerationKwh: growattGen?.todayGeneration || 0,
                monthGenerationKwh: growattGen?.monthlyGeneration || 0,
                yearGenerationKwh: growattGen?.yearlyGeneration || 0,
                totalKwh: growattGen?.totalGeneration || 0,
                lastUpdated: growattGen?.lastUpdated?.toISOString() || null
              };
            } else {
              throw new Error(`Unknown inverter brand: ${inv.inverterBrand}`);
            }
            
            return {
              id: inv.id,
              customerId: inv.customerId,
              inverterBrand: inv.inverterBrand,
              inverterSerialNumber: inv.inverterSerialNumber,
              capacity: inv.capacity,
              realtimeData,
              error: null
            };
          } catch (err: any) {
            return {
              id: inv.id,
              customerId: inv.customerId,
              inverterBrand: inv.inverterBrand,
              realtimeData: null,
              error: err.message
            };
          }
        })
      );
      
      const inverterData = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value);
      
      res.json({ inverters: inverterData });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);
```

### 2.3 Update Inverter Credentials Endpoint

File: `backend/src/routes/subadmin.ts`

```typescript
// PATCH /subadmin/inverters/:inverterInstallationId
router.patch('/inverters/:inverterInstallationId',
  authenticate,
  requireRole(['ADMIN','SUPER_ADMIN','SUB_ADMIN','EMPLOYEE']),
  async (req, res) => {
    try {
      const { inverterInstallationId } = req.params;
      const { inverterBrand, inverterLoginId, inverterPassword, apiKey, deviceSn } = req.body;
      
      const updated = await prisma.inverterInstallation.update({
        where: { id: parseInt(inverterInstallationId) },
        data: {
          inverterBrand,
          inverterLoginId,
          inverterPassword,
          apiKey,
          deviceSn
        }
      });
      
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /subadmin/customers/:customerId/inverters (add new)
router.post('/customers/:customerId/inverters',
  authenticate,
  requireRole(['ADMIN','SUPER_ADMIN','SUB_ADMIN','EMPLOYEE']),
  async (req, res) => {
    try {
      const { customerId } = req.params;
      const { inverterBrand, inverterLoginId, inverterPassword, apiKey, deviceSn, capacity } = req.body;
      
      const installation = await prisma.inverterInstallation.create({
        data: {
          customerId: parseInt(customerId),
          inverterBrand,
          inverterLoginId,
          inverterPassword,
          apiKey,
          deviceSn,
          capacity
        }
      });
      
      res.json(installation);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);
```

## Phase 3: Frontend Implementation

### 3.1 Add New Hook to `src/lib/api-client.ts`

```typescript
// Fetch list of all inverters for a customer
export function useGetCustomerInverters(customerId: number | null) {
  return useQuery({
    queryKey: ['customer-inverters', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: 'Backend API URL required' };
      }
      
      return await requestApi<any[]>(
        `/subadmin/customers/${customerId}/inverters`
      );
    },
    enabled: !!customerId && customerId > 0,
  });
}

// Fetch real-time data for ALL inverters
export function useGetAllInvertersRealtimeData(customerId: number | null) {
  return useQuery({
    queryKey: ['all-inverters-realtime', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw { error: 'Backend API URL required' };
      }
      
      const response = await requestApi<{
        inverters: Array<{
          id: number;
          customerId: number;
          inverterBrand: string;
          inverterSerialNumber?: string;
          capacity?: number;
          realtimeData: any;
          error?: string;
        }>;
        dataUnavailable?: boolean;
        unavailableReason?: string;
      }>(`/subadmin/customers/${customerId}/all-inverters-realtime`);
      
      if (response.dataUnavailable) {
        throw { error: response.unavailableReason || 'Data unavailable' };
      }
      
      return response;
    },
    enabled: !!customerId && customerId > 0,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 3.2 Update SubAdminDashboard Component

Add multi-inverter display section to `src/pages/employee/SubAdminDashboard.tsx`:

```tsx
// Add to imports
import {
  useGetCustomerInverters,
  useGetAllInvertersRealtimeData,
  // ... existing imports
} from "@/lib/api-client";

// Add hooks in component
const {
  data: allInverters = [],
  isLoading: isLoadingInverters,
  refetch: refetchInverters,
} = useGetCustomerInverters(selectedCustomerId);

const {
  data: allInvertersRealtimeData,
  isLoading: isLoadingAllInvertersData,
  error: allInvertersDataError,
  refetch: refetchAllInvertersData,
} = useGetAllInvertersRealtimeData(selectedCustomerId);

// Update refreshAll function
const refreshAll = async () => {
  await Promise.all([
    refetchCustomers(),
    refetchCustomerSummary(),
    refetchInverters(),
    refetchAllInvertersData(),
    // Keep existing refreshes
    refetchInverterSummary(),
    refetchInverterHistory(),
  ]);
};

// Add new Card for Multi-Inverter Display

<Card className="border border-slate-200 shadow-sm">
  <CardHeader className="pb-4">
    <CardTitle className="text-lg font-semibold text-slate-800">All Inverters</CardTitle>
    <p className="text-sm text-muted-foreground mt-0.5">Real-time data for all installed inverters</p>
  </CardHeader>
  <CardContent>
    {isLoadingAllInvertersData ? (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">Fetching inverter data...</span>
      </div>
    ) : allInvertersDataError ? (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
        <AlertCircle className="h-4 w-4 inline mr-2" />
        Error loading inverters
      </div>
    ) : allInvertersRealtimeData?.inverters?.length ? (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {allInvertersRealtimeData.inverters.map((inv) => (
          <div 
            key={inv.id}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:border-slate-300 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-slate-800 text-sm">{inv.inverterBrand}</p>
              {inv.error ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </div>
            
            {inv.realtimeData ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Power:</span>
                  <span className="font-bold">{(inv.realtimeData.currentPowerW / 1000).toFixed(2)} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Today:</span>
                  <span className="font-bold">{inv.realtimeData.todayGenerationKwh?.toFixed(1) || '—'} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Month:</span>
                  <span className="font-bold">{inv.realtimeData.monthGenerationKwh?.toFixed(1) || '—'} kWh</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-red-600">{inv.error}</p>
            )}
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-slate-500">No inverters found for this customer</p>
    )}
  </CardContent>
</Card>
```

## Phase 4: Data Migration (Preserve Existing KSolar)

### 4.1 Migration Script

Create `backend/scripts/migrate-customer-inverters.ts`:

```typescript
import { prisma } from '../lib/prisma';

async function migrateCustomerInverters() {
  try {
    console.log('Starting customer inverter migration...');
    
    // Find all customers with inverter credentials
    const customersWithInverters = await prisma.customer.findMany({
      where: {
        inverterBrand: { not: null }
      }
    });
    
    let migratedCount = 0;
    
    for (const customer of customersWithInverters) {
      // Check if already migrated
      const existing = await prisma.inverterInstallation.findUnique({
        where: { customerId: customer.id }
      });
      
      if (!existing) {
        // Create new InverterInstallation record
        await prisma.inverterInstallation.create({
          data: {
            customerId: customer.id,
            inverterBrand: customer.inverterBrand || 'Unknown',
            inverterLoginId: customer.inverterLoginId,
            inverterPassword: customer.inverterPassword,
            apiKey: customer.inverterApiKey,
            deviceSn: customer.inverterDeviceSn,
            capacity: customer.systemSizeKw,
            credentialsVerified: true,
            isActive: customer.status === 'ACTIVE'
          }
        });
        
        migratedCount++;
      }
    }
    
    console.log(`✅ Migrated ${migratedCount} customer inverters`);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCustomerInverters();
```

Run: `npm --prefix backend run ts-node scripts/migrate-customer-inverters.ts`

## Verification Checklist

### ✅ Database
- [ ] InverterInstallation model created
- [ ] GenerationLog model created
- [ ] Customer model updated with relation
- [ ] Migration ran successfully
- [ ] Existing customer data migrated to InverterInstallation

### ✅ Backend
- [ ] GET `/subadmin/customers/:id/inverters` returns all inverters
- [ ] GET `/subadmin/customers/:id/all-inverters-realtime` fetches all real-time data in parallel
- [ ] PATCH `/subadmin/inverters/:id` updates credentials
- [ ] POST `/subadmin/customers/:id/inverters` adds new inverter
- [ ] KSolar route `/subadmin/customers/:id/inverter-generation` still works (legacy)
- [ ] Error handling gracefully handles per-inverter failures

### ✅ Frontend
- [ ] `useGetCustomerInverters` hook works
- [ ] `useGetAllInvertersRealtimeData` hook works
- [ ] Dashboard displays list of all inverters
- [ ] Real-time data displays for each inverter
- [ ] Error states show properly
- [ ] Refresh button updates all inverters

### ✅ Data Integrity
- [ ] KSolar (ShineMonitor) data still fetches correctly
- [ ] UTL Solar (FoxESS) data fetches with new signatures
- [ ] Growatt data pulls from existing GrowattGeneration table
- [ ] Generation history logs saved to GenerationLog table
- [ ] Old customer.inverterBrand still works as fallback

## Testing Scenarios

1. **Single inverter customer (legacy)**: Should fetch from Customer table via fallback
2. **Multi-inverter customer**: Should fetch from InverterInstallation table
3. **Mixed brands**: KSolar + UTL Solar together
4. **Network error**: One inverter fails, others still show data
5. **No credentials**: Shows "Not configured" instead of erroring

## Future Enhancements

- Inverter-specific alert thresholds
- Per-inverter service history
- Multi-inverter analytics dashboard
- Automated inverter discovery
- Bulk credential import/export
