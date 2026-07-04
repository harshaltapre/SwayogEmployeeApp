# Service Coordinator Portal

This document describes the Service Coordinator feature set and how inverter data is fetched in the Swayog Dashboard application.

## Purpose

The Service Coordinator portal is designed for sub-admin / service coordinator users to:

- monitor customer solar installations
- view inverter generation metrics
- manage inverter credentials
- review customer summaries and service request data

## Primary UI entry points

Relevant pages and components:

- `src/pages/employee/SubAdminDashboard.tsx`
  - Main service coordinator dashboard page
  - Customer selection and city filter
  - Live inverter generation summary
  - inverter generation history chart
  - credential update dialog
- `src/components/subadmin/SubAdminLayout.tsx`
  - Layout and sidebar navigation for Service Coordinator pages
  - Navigation items: Dashboard, Complaints, AMC Management, Employee Section, Calendar, Financials

## Service Coordinator features

### Customer and location filter

The portal allows the coordinator to:

- select a customer from the loaded customer list
- filter customers by city
- display selected customer details such as name, contact, address, and inverter brand

### Inverter and customer summary

For the selected customer, the dashboard shows:

- system size and installed capacity
- inverter brand and current status
- AMC status and client type
- installation date and site address

### Credential management

The portal supports updating inverter credentials for the selected customer:

- `inverterBrand`
- `inverterLoginId`
- `inverterPassword`
- customer city, address, and project stage

Special behavior:

- if the updated inverter brand is `Growatt`, the UI triggers a background POST to `/subadmin/growatt/credentials` to attempt auto-provisioning or auto-discovery for Growatt plants.

### Refresh workflow

The dashboard includes a refresh button that refetches:

- customer list
- selected customer summary
- live inverter generation data
- inverter generation history

## Inverter data fetching flow

Inverter data is loaded via React Query hooks in `src/lib/api-client.ts`.

### Hooks used

- `useListCustomers({ limit, city })`
  - Loads customers used for selection and city filters
- `useGetSubadminCustomerSummary(customerId)`
  - Loads customer summary and service request stats
- `useGetCustomerInverterGeneration(customerId)`
  - Loads live inverter generation metrics
- `useGetCustomerInverterGenerationHistory(customerId, period)`
  - Loads inverter generation history for selected period
- `useUpdateSubadminCustomerCredentials()`
  - Sends credential updates to the backend

### Endpoint mapping

The hooks call the following backend endpoints:

- `GET /subadmin/customers/${customerId}/summary`
  - customer metadata, service request stats, and summary details
- `GET /subadmin/customers/${customerId}/inverter-generation`
  - live inverter generation data
- `GET /subadmin/customers/${customerId}/inverter-generation-history?period=${period}`
  - period-based generation history
- `PATCH /subadmin/customers/${customerId}`
  - update customer/inverter credentials
- `POST /subadmin/growatt/credentials`
  - background Growatt credential provisioning when `inverterBrand` is Growatt

### Error handling

Both inverter hooks detect backend unavailability and surface errors when:

- the backend response includes `dataUnavailable`
- the backend returns an `unavailableReason`

This prevents the dashboard from showing stale or missing inverter charts silently.

## UT Solar / KSolar / FoxESS implementation details

### CRITICAL DISCOVERY: UTL Solar uses FoxESS Cloud API

**UTL Solar PV+ app is developed by Foxess Co., Ltd.**  
**UTL Solar inverters use FoxESS Cloud as their backend.**

- Portal: https://www.foxesscloud.com
- Open API docs: https://www.foxesscloud.com/public/i18n/en/OpenApiDocument.html

This means **UT Solar fetch = FoxESS Open API**.  
Same API, same endpoints, same authentication mechanism.

### How UT Solar credentials are used

The backend uses customer's stored inverter credentials to fetch live solar data from either:
- **ShineMonitor** (KSolar / legacy UT Solar, username/password-based)
- **FoxESS Cloud API** (UTL Solar / modern UT Solar, API key-based)

#### Required customer credential fields (FoxESS/UTL Solar):

| Field in DB | What it stores for UTL/FoxESS |
|---|---|
| `inverterBrand` | Must contain `utl`, `utlsolar`, `foxess`, or `foxcloud` |
| `apiKey` | FoxESS API Key (generated from foxesscloud.com portal) |
| `deviceSn` or `plantId` | Inverter Serial Number (SN) |
| `apiUsername` | NOT used (FoxESS uses API key, not username/password) |
| `apiPassword` | NOT used |
| `apiUrl` | https://www.foxesscloud.com (default) |

#### How Coordinator gets API Key (one-time setup):

1. Open https://www.foxesscloud.com in browser
2. Log in with customer's UTL/FoxESS account
3. Go to: **User Profile → API Management → Generate API Key**
4. Copy the API key
5. Paste into credentials modal as "API Key"
6. Copy inverter Serial Number (SN) from device list
7. Paste as "Device SN / Plant ID"
8. Save and click "Sync from API"

### FoxESS Authentication Mechanism

FoxESS uses signature-based authentication on every request.

**Headers required on EVERY API call:**
```
token      → the API key itself
timestamp  → current time in milliseconds (Date.now())
signature  → MD5(token + timestamp + apiKey) → lowercase hex
lang       → "en"
Content-Type → "application/json"
User-Agent → "Mozilla/5.0 SwayogDashboard/1.0"
```

**Signature calculation:**
```typescript
import { createHash } from 'crypto';

function foxessSignature(apiKey: string, timestamp: number): string {
  const raw = `${apiKey}${timestamp}${apiKey}`;
  return createHash('md5').update(raw).digest('hex').toLowerCase();
}

function foxessHeaders(apiKey: string) {
  const timestamp = Date.now();
  return {
    'token': apiKey,
    'timestamp': String(timestamp),
    'signature': foxessSignature(apiKey, timestamp),
    'lang': 'en',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 SwayogDashboard/1.0'
  };
}
```

### Backend flow for FoxESS (UTL Solar)

The backend provides three complementary endpoints for real-time, monthly, and yearly data:

#### 1. Real-time generation data
```
GET /subadmin/customers/:customerId/utl-realtime
```
- Fetches **live power generation right now** from FoxESS `/op/v0/device/real/query`
- Returns:
  - `currentPowerW` — solar generation in watts
  - `todayGenerationKwh` — today's total kWh
  - `monthGenerationKwh` — this month's total kWh
  - `yearGenerationKwh` — this year's total kWh
  - `totalKwh` — lifetime generation kWh
  - `batterySOC` — battery charge % (if applicable)
  - `loadPowerW` — current load watts
  - `gridPowerW` — grid import/export watts
  - `fetchedAt` — ISO timestamp

#### 2. Daily generation history
```
GET /subadmin/customers/:customerId/inverter-generation-history?period=daily&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```
- Fetches hourly/daily power data from FoxESS `/op/v0/device/history/query`
- Returns array of generation records for the date range
- Used for multi-day trend analysis

#### 3. Production report (daily kWh per day)
```
GET /subadmin/customers/:customerId/inverter-generation-history?period=monthly&year=2026&month=5
```
- Fetches daily production report from FoxESS `/op/v0/device/report/query`
- Returns daily kWh breakdown for the month
- Data saved to `GenerationLog` table with `periodType='DAY'`
- Supports year/month parameters for monthly and yearly reports

### Complete Fetcher Implementation

Add to `backend/src/services/inverterService.ts`:

```typescript
import { createHash } from 'crypto';
import axios from 'axios';
import { prisma } from '../lib/prisma';

const FOXESS_BASE = 'https://www.foxesscloud.com';

// ── SIGNATURE ──────────────────────────────────────────────────────────────

function foxessSignature(apiKey: string, timestamp: number): string {
  const raw = `${apiKey}${timestamp}${apiKey}`;
  return createHash('md5').update(raw).digest('hex').toLowerCase();
}

function foxessHeaders(apiKey: string) {
  const timestamp = Date.now();
  return {
    'token': apiKey,
    'timestamp': String(timestamp),
    'signature': foxessSignature(apiKey, timestamp),
    'lang': 'en',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 SwayogDashboard/1.0'
  };
}

// ── REAL-TIME GENERATION (live data) ───────────────────────────────────────

export async function fetchUTLRealtimeGeneration(installation: any) {
  const apiKey = installation.apiKey;
  const deviceSn = installation.deviceSn || installation.plantId;

  if (!apiKey) throw new Error('FoxESS API key missing. Generate from foxesscloud.com → User Profile → API Management');
  if (!deviceSn) throw new Error('Device Serial Number (SN) missing');

  const res = await axios.post(
    `${FOXESS_BASE}/op/v0/device/real/query`,
    {
      sn: deviceSn,
      variables: [
        'pvPower', 'generationPower', 'gridConsumptionPower', 'loadsPower',
        'batChargePower', 'batDischargePower', 'SoC', 'todayGeneration',
        'monthGeneration', 'yearGeneration', 'cumulative'
      ]
    },
    { headers: foxessHeaders(apiKey) }
  );

  if (res.data?.errno !== 0) {
    throw new Error(`FoxESS API error ${res.data?.errno}: ${res.data?.msg}`);
  }

  const data = res.data?.result?.[0]?.datas || [];
  const getValue = (key: string) => {
    const item = data.find((d: any) => d.variable === key);
    return parseFloat(item?.value || 0);
  };

  return {
    currentPowerW: getValue('pvPower'),
    todayGenerationKwh: getValue('todayGeneration'),
    monthGenerationKwh: getValue('monthGeneration'),
    yearGenerationKwh: getValue('yearGeneration'),
    totalKwh: getValue('cumulative'),
    batterySOC: getValue('SoC'),
    loadPowerW: getValue('loadsPower'),
    gridPowerW: getValue('gridConsumptionPower'),
    dataSource: 'foxess_realtime',
    fetchedAt: new Date().toISOString()
  };
}

// ── DAILY GENERATION HISTORY ───────────────────────────────────────────────

export async function fetchUTLGenerationHistory(
  installation: any,
  startDate: string,  // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
) {
  const apiKey = installation.apiKey;
  const deviceSn = installation.deviceSn || installation.plantId;

  const begin = new Date(startDate).setHours(0, 0, 0, 0);
  const end = new Date(endDate).setHours(23, 59, 59, 999);

  const res = await axios.post(
    `${FOXESS_BASE}/op/v0/device/history/query`,
    {
      sn: deviceSn,
      variables: ['generationPower', 'pvPower'],
      begin: begin,   // milliseconds
      end: end        // milliseconds
    },
    { headers: foxessHeaders(apiKey) }
  );

  if (res.data?.errno !== 0) {
    throw new Error(`FoxESS history error ${res.data?.errno}: ${res.data?.msg}`);
  }

  return res.data?.result?.datas || [];
}

// ── PRODUCTION REPORT (daily kWh per day) ─────────────────────────────────

export async function fetchUTLProductionReport(
  installation: any,
  year: number,
  month: number   // 1-12
) {
  const apiKey = installation.apiKey;
  const deviceSn = installation.deviceSn || installation.plantId;

  const res = await axios.post(
    `${FOXESS_BASE}/op/v0/device/report/query`,
    {
      sn: deviceSn,
      year: year,
      month: month,
      dimension: 'month',       // month = daily breakdown
      variables: ['generation'] // kWh per day
    },
    { headers: foxessHeaders(apiKey) }
  );

  if (res.data?.errno !== 0) {
    throw new Error(`FoxESS report error ${res.data?.errno}: ${res.data?.msg}`);
  }

  return res.data?.result || [];
}

// ── MAIN FETCH FUNCTION (saves to GenerationLog) ──────────────────────────

export async function fetchUTLSolar(installation: any) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Get daily production report for this month
  const report = await fetchUTLProductionReport(installation, year, month);
  const generationData = report.find((r: any) => r.variable === 'generation');
  const dailyValues: { index: number; value: number }[] = generationData?.values || [];

  let saved = 0;
  const PEAK_SUN_HOURS = 4.5; // India average

  for (const entry of dailyValues) {
    if (entry.value === null || entry.value === undefined || entry.value < 0) continue;

    const dateObj = new Date(year, month - 1, entry.index);
    if (isNaN(dateObj.getTime()) || dateObj > now) continue;

    const actualKwh = parseFloat(String(entry.value)) || 0;
    const expectedKwh = installation.capacity
      ? Math.round(installation.capacity * PEAK_SUN_HOURS * 10) / 10
      : null;
    const dropPct = expectedKwh && expectedKwh > 0
      ? Math.round(((expectedKwh - actualKwh) / expectedKwh) * 100)
      : null;

    await prisma.generationLog.upsert({
      where: {
        installationId_date_periodType: {
          installationId: installation.id,
          date: dateObj,
          periodType: 'DAY'
        }
      },
      create: {
        installationId: installation.id,
        customerId: installation.customerId,
        date: dateObj,
        periodType: 'DAY',
        actualGeneration: actualKwh,
        expectedGeneration: expectedKwh,
        generationDropPct: dropPct,
        isAlert: dropPct !== null && dropPct > 20,
        fetchedFromApi: true,
        manualEntry: false
      },
      update: {
        actualGeneration: actualKwh,
        generationDropPct: dropPct,
        isAlert: dropPct !== null && dropPct > 20,
        fetchedFromApi: true
      }
    });
    saved++;
  }

  // Update installation record
  await prisma.inverterInstallation.update({
    where: { id: installation.id },
    data: {
      lastFetchedAt: new Date(),
      fetchError: null,
      credentialsVerified: true
    }
  });

  return { success: true, recordsImported: saved, brand: 'UTL/FoxESS' };
}
```

### Prisma Schema Update

Add `apiKey` field to `InverterInstallation` model:

```prisma
model InverterInstallation {
  // ... existing fields ...
  apiKey   String?   // FoxESS API key (used for UTL Solar and FoxESS inverters)
}
```

Run:
```bash
npm --prefix backend run prisma:migrate:dev --name add_foxess_api_key
npm --prefix backend run prisma:generate
```

### Backend Route Additions

In `backend/src/routes/subadmin.ts`:

```typescript
// Get UTL Solar real-time generation (live)
router.get('/customers/:customerId/utl-realtime',
  authenticate,
  requireRole(['ADMIN','SUPER_ADMIN','SUB_ADMIN','EMPLOYEE']),
  async (req, res) => {
    try {
      const installation = await prisma.inverterInstallation.findUnique({
        where: { customerId: req.params.customerId }
      });
      if (!installation) {
        return res.json({
          dataUnavailable: true,
          unavailableReason: 'No inverter setup found for this customer'
        });
      }
      if (!installation.apiKey) {
        return res.json({
          dataUnavailable: true,
          unavailableReason: 'FoxESS API key not set. Ask coordinator to add it in credentials.'
        });
      }

      const data = await fetchUTLRealtimeGeneration(installation);
      res.json(data);
    } catch (err: any) {
      await prisma.inverterInstallation.update({
        where: { customerId: req.params.customerId },
        data: { fetchError: err.message }
      }).catch(() => {});

      res.json({
        dataUnavailable: true,
        unavailableReason: err.message
      });
    }
  }
);

// Add UTL brand to dispatcher
case 'utl':
case 'utlsolar':
case 'utlmtecno':
case 'utl_solar':
case 'foxess':
case 'foxcloud':
  return fetchUTLSolar(installation);
```

### Frontend - Credentials Modal Update

When `brand = UTL/FoxESS`, show API key field INSTEAD of username/password:

```tsx
const isUTLBrand = ['UTL','UTLSolar','FoxESS'].includes(selectedBrand);

{isUTLBrand ? (
  // UTL / FoxESS — API key only
  <div className="space-y-3">
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-xs font-semibold text-blue-800 mb-1">How to get your API key:</p>
      <ol className="text-xs text-blue-700 space-y-0.5 list-decimal list-inside">
        <li>Open foxesscloud.com in browser</li>
        <li>Login with customer's UTL account</li>
        <li>Go to User Profile → API Management</li>
        <li>Click "Generate API Key" → copy it</li>
        <li>Also copy the inverter Serial Number (SN)</li>
      </ol>
    </div>

    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-700">FoxESS API Key *</label>
      <Input
        className="h-9 text-sm font-mono"
        placeholder="Paste API key from foxesscloud.com"
        value={form.apiKey ?? ''}
        onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
      />
    </div>

    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-700">Inverter Serial Number (SN) *</label>
      <Input
        className="h-9 text-sm font-mono"
        placeholder="e.g. BHxxxxxxxxxx"
        value={form.deviceSn ?? ''}
        onChange={e => setForm(f => ({ ...f, deviceSn: e.target.value, plantId: e.target.value }))}
      />
      <p className="text-xs text-gray-400">Found in FoxCloud app → Devices → click inverter → SN</p>
    </div>
  </div>
) : (
  // Other brands — existing username/password fields
  <ExistingCredentialsFields form={form} setForm={setForm} />
)}
```

### Frontend - Add UTL Real-time Hook

Add to `src/lib/api-client.ts`:

```typescript
// UTL Solar real-time generation
export function useGetUTLRealtimeGeneration(customerId: string | null) {
  return useQuery({
    queryKey: ['utl-realtime', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const res = await apiClient.get(
        `/subadmin/customers/${customerId}/utl-realtime`
      );
      if (res.data?.dataUnavailable) {
        throw new Error(res.data.unavailableReason || 'Data unavailable');
      }
      return res.data;
    },
    enabled: !!customerId,
    refetchInterval: 5 * 60 * 1000,  // refresh every 5 min (rate limit)
    retry: 1
  });
}
```

### Rate Limiting

FoxESS Open API has rate limits:
- **1440 calls per day per API key** (= 1 call per minute maximum)
- **Do NOT poll faster than every 5 minutes**
- Set `refetchInterval` to `5 * 60 * 1000` (5 minutes minimum)
- Nightly cron jobs count against this limit

### Data Available from FoxESS (Real-time, Monthly, Yearly)

| Field | Description | Unit |
|---|---|---|
| currentPowerW | Live solar generation right now | Watts |
| todayGenerationKwh | Today's total generation | kWh |
| monthGenerationKwh | This month's total | kWh |
| yearGenerationKwh | This year's total | kWh |
| totalKwh | Lifetime generation | kWh |
| batterySOC | Battery charge level | % |
| loadPowerW | Current load being consumed | Watts |
| gridPowerW | Grid import/export | Watts |

### Error Handling

| errno | Meaning | Fix |
|---|---|---|
| 0 | Success | — |
| 41808 | Invalid signature | Check API key is correct, re-generate if needed |
| 41809 | Token expired / invalid | Re-generate API key from foxesscloud.com |
| 40256 | Device not found | Check SN is correct |
| 40401 | No permission | API key doesn't have access to this device |
| 429 | Rate limit exceeded | Wait, reduce polling frequency |

### Developer implementation prompt

**Use this prompt when implementing UTL Solar / FoxESS inverter data fetching with real-time, monthly, and yearly support:**

> Implement complete UTL Solar (FoxESS Cloud API) inverter data fetching for the Service Coordinator dashboard with support for **real-time, monthly, and yearly generation data**.
>
> **Context:**
> - UTL Solar uses FoxESS Cloud as backend (https://www.foxesscloud.com)
> - Authentication is signature-based (MD5 hash of apiKey + timestamp + apiKey)
> - Coordinator provides: FoxESS API Key (from portal) + Inverter Serial Number (SN)
>
> **Required Implementation:**
> 1. Add `apiKey` column to `InverterInstallation` schema and run migration
> 2. Implement three fetcher functions in `backend/src/services/inverterService.ts`:
>    - `fetchUTLRealtimeGeneration()` — live power data right now
>    - `fetchUTLGenerationHistory()` — hourly/daily data for date range (monthly view)
>    - `fetchUTLProductionReport()` — daily kWh breakdown per month (yearly aggregation)
> 3. Add `GET /subadmin/customers/:customerId/utl-realtime` backend route for live data
> 4. Update generation-history endpoint to support FoxESS with year/month parameters
> 5. Update brand dispatcher to include: `utl`, `utlsolar`, `foxess`, `foxcloud`
> 6. Update credentials modal to show API Key field (not username/password) when brand is UTL
> 7. Add `useGetUTLRealtimeGeneration()` hook in `src/lib/api-client.ts`
> 8. Modify generation history hook to auto-detect FoxESS brand and request monthly/yearly reports
> 9. Set refetch interval to 5 minutes (rate limit: 1440 calls/day max)
> 10. Save all daily data to `GenerationLog` table with `periodType='DAY'` for analytics
>
> **Data Returned:**
> - Real-time: currentPowerW, todayGenerationKwh, monthGenerationKwh, yearGenerationKwh, totalKwh, batterySOC, loadPowerW, gridPowerW
> - Monthly history: daily kWh breakdown for all 30 days with expected vs actual
> - Yearly: monthly aggregates from `/op/v0/device/report/query` with dimension='year'
>
> **Coordinator Setup (30 seconds):**
> 1. Login to foxesscloud.com with customer account
> 2. Go to User Profile → API Management → Generate API Key
> 3. Copy API key + inverter SN
> 4. Paste into dashboard credentials modal
> 5. Click "Sync from API" → live data loads immediately
> 6. Dashboard shows real-time + monthly charts automatically

## Role and routing

The Service Coordinator dashboard is exposed through the route:

- `/subadmin/dashboard`

Allowed roles in the application include:

- `sub_admin`
- `employee` with `jobRole` matching `subadmin` or `servicecoordinator`
- `admin`
- `super_admin`

This route is protected by auth and role-based routing. The layout renders sidebar navigation and page content only when the authorized user is present.

## Notes

- There is no separate documentation file in the repository prior to this document.
- `SubAdminLayout` and the Service Coordinator route implementations are the main source of truth for portal behavior.
- The inverter fetch flow is centered in `src/lib/api-client.ts` with explicit query keys and hooks.
- UTL Solar / FoxESS integration provides complete real-time, monthly, and yearly generation data.
- All daily data is persisted to `GenerationLog` table for analytics and performance tracking.
