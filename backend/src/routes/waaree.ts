import { Router } from "express";
import { getWaareeLiveTelemetry, getWaareeGraphData } from "../lib/waaree.js";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/token.js";
import axios from "axios";

const router = Router();

/**
 * Extract credentials from query parameters.
 *   ?username=<waaree_portal_username>&password=<waaree_portal_password>
 *   &plantId=<optional_device_sn>&apiKey=<optional_foxess_api_key>
 */
function getRequestCredentials(req: any): { plantId: string; username: string; password: string; apiKey: string } {
  const username = String(req.query.username || req.query.user || process.env.WAAREE_USERNAME || "");
  const password = String(req.query.password || req.query.pass || process.env.WAAREE_PASSWORD || "");
  const plantId = String(req.query.plantId || req.query.stationId || req.query.deviceSn || "");
  const apiKey = String(req.query.apiKey || req.query.token || process.env.WAAREE_API_KEY || "");
  return { plantId, username, password, apiKey };
}

/**
 * GET /api/waaree/live-power
 * ?username=...&password=...&plantId=...&apiKey=... (apiKey optional but recommended)
 */
router.get("/live-power", async (req, res) => {
  try {
    const { plantId, username, password, apiKey } = getRequestCredentials(req);
    const telemetry = await getWaareeLiveTelemetry(plantId, username, password, apiKey);
    res.status(200).json({
      plantId,
      livePower: telemetry.peakPower,
      unit: "kW",
      isSimulated: telemetry.isSimulated,
      liveSource: telemetry.liveSource,
      lastUpdated: telemetry.lastUpdated
    });
  } catch (err: any) {
    console.error("[Waaree Route] live-power error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch live power" });
  }
});

/**
 * GET /api/waaree/today-yield
 */
router.get("/today-yield", async (req, res) => {
  try {
    const { plantId, username, password, apiKey } = getRequestCredentials(req);
    const telemetry = await getWaareeLiveTelemetry(plantId, username, password, apiKey);
    res.status(200).json({
      plantId,
      todayYield: telemetry.dailyGeneration,
      unit: "kWh",
      isSimulated: telemetry.isSimulated,
      lastUpdated: telemetry.lastUpdated
    });
  } catch (err: any) {
    console.error("[Waaree Route] today-yield error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch today's yield" });
  }
});

/**
 * GET /api/waaree/total-yield
 */
router.get("/total-yield", async (req, res) => {
  try {
    const { plantId, username, password, apiKey } = getRequestCredentials(req);
    const telemetry = await getWaareeLiveTelemetry(plantId, username, password, apiKey);
    res.status(200).json({
      plantId,
      totalYield: telemetry.totalGeneration,
      monthlyYield: telemetry.monthlyGeneration,
      unit: "kWh",
      isSimulated: telemetry.isSimulated,
      lastUpdated: telemetry.lastUpdated
    });
  } catch (err: any) {
    console.error("[Waaree Route] total-yield error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch total yield" });
  }
});

/**
 * GET /api/waaree/power-graph
 * ?username=...&password=...&period=realtime|daily|monthly|yearly&apiKey=...
 */
router.get("/power-graph", async (req, res) => {
  try {
    const { plantId, username, password, apiKey } = getRequestCredentials(req);
    const period = (req.query.period as "realtime" | "daily" | "monthly" | "yearly") || "realtime";
    const graphData = await getWaareeGraphData(plantId, username, password, period, apiKey);
    res.status(200).json({
      plantId,
      period,
      timestamps: graphData.timestamps,
      values: graphData.values
    });
  } catch (err: any) {
    console.error("[Waaree Route] power-graph error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch power graph" });
  }
});

/**
 * GET /api/waaree/device-status
 */
router.get("/device-status", async (req, res) => {
  try {
    const { plantId, username, password, apiKey } = getRequestCredentials(req);
    const telemetry = await getWaareeLiveTelemetry(plantId, username, password, apiKey);
    res.status(200).json({
      plantId,
      status: telemetry.status,
      devices: telemetry.devices,
      isSimulated: telemetry.isSimulated,
      liveSource: telemetry.liveSource,
      lastUpdated: telemetry.lastUpdated
    });
  } catch (err: any) {
    console.error("[Waaree Route] device-status error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch device status" });
  }
});

// ---------------------------------------------------------------------------
// Waaree Solax Inverter Integration Endpoint
// ---------------------------------------------------------------------------

let apiCallsToday = 0;
let lastApiResetDay = new Date().getDate();
let lastSuccessfulData: any = null;
let lastSuccessTime: number | null = null;
let lastFetchError: string | null = null;

interface ChartPoint {
  time: string; // HH:MM
  value: number; // acpower (W)
}
let todayChartData: ChartPoint[] = [];

// Helper to check and reset daily counter
function checkApiReset() {
  const currentDay = new Date().getDate();
  if (currentDay !== lastApiResetDay) {
    apiCallsToday = 0;
    lastApiResetDay = currentDay;
  }
}

// Generate historical chart points for today up to current time (at 5-min intervals)
function generateTodayHistorySeed(now: Date): ChartPoint[] {
  const points: ChartPoint[] = [];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  for (let h = 0; h <= 23; h++) {
    for (let m = 0; m < 60; m += 5) {
      if (h > currentHour || (h === currentHour && m > currentMinute)) {
        break; // don't generate future points
      }
      
      const decimalHour = h + m / 60;
      let val = 0;
      if (decimalHour >= 6.5 && decimalHour <= 18.5) {
        const peak = 3500;
        const dev = 2.5;
        val = Math.round(peak * Math.exp(-Math.pow(decimalHour - 12.5, 2) / (2 * Math.pow(dev, 2))));
      }
      
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      points.push({ time: timeStr, value: val });
    }
  }
  return points;
}

// Update today's chart history with a new data point
function addChartPointForToday(now: Date, acpower: number) {
  const hour = now.getHours();
  const min = Math.floor(now.getMinutes() / 5) * 5;
  const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  
  // Remove if exists to avoid duplication
  todayChartData = todayChartData.filter(p => p.time !== timeStr);
  todayChartData.push({ time: timeStr, value: acpower });
  
  // Sort by time
  todayChartData.sort((a, b) => a.time.localeCompare(b.time));
}

// Seed history if empty
if (todayChartData.length === 0) {
  todayChartData = generateTodayHistorySeed(new Date());
}

// Helper to generate dynamic simulation data
function getSimulatedData(now: Date) {
  const hour = now.getHours();
  const minute = now.getMinutes();
  const decimalHour = hour + minute / 60;
  
  let acpower = 0;
  if (decimalHour >= 6.5 && decimalHour <= 18.5) {
    const peak = 3500;
    const dev = 2.5;
    acpower = Math.round(peak * Math.exp(-Math.pow(decimalHour - 12.5, 2) / (2 * Math.pow(dev, 2))));
  }
  
  // String 2 is ~27% lower than String 1 to demo warning states
  let powerdc1 = 0;
  let powerdc2 = 0;
  if (acpower > 0) {
    const solarInputTotal = acpower * 1.15;
    powerdc1 = Math.round(solarInputTotal * 0.58);
    powerdc2 = Math.round(solarInputTotal * 0.42);
  }
  
  let yieldtoday = 0;
  if (decimalHour >= 6.5) {
    const progress = Math.min(1, (decimalHour - 6.5) / 12);
    yieldtoday = parseFloat((18.45 * progress).toFixed(2));
  }
  const yieldtotal = parseFloat((12450.25 + yieldtoday).toFixed(2));
  
  let batPower = 0;
  if (decimalHour >= 9 && decimalHour <= 15) {
    batPower = 450;
  } else if (decimalHour > 15 && decimalHour <= 22) {
    batPower = -300;
  } else if (decimalHour > 22 || decimalHour < 6) {
    batPower = -100;
  } else {
    batPower = 0;
  }
  
  let soc = 50;
  if (decimalHour >= 7 && decimalHour <= 16) {
    const p = (decimalHour - 7) / 9;
    soc = Math.round(15 + p * 80);
  } else if (decimalHour > 16 && decimalHour <= 24) {
    const p = (decimalHour - 16) / 8;
    soc = Math.round(95 - p * 70);
  } else {
    const p = decimalHour / 7;
    soc = Math.round(25 - p * 10);
  }
  
  const homeLoad = 500;
  let feedInPower = 0;
  if (acpower > 0) {
    const batNet = batPower > 0 ? batPower : 0;
    feedInPower = acpower - homeLoad - batNet;
  } else {
    feedInPower = batPower - homeLoad;
  }
  
  const uploadTime = now.toISOString().replace("T", " ").substring(0, 19);
  
  return {
    acpower,
    yieldtoday,
    yieldtotal,
    feedInPower,
    powerdc1,
    powerdc2,
    batPower,
    soc,
    uploadTime
  };
}

/**
 * GET /api/waaree/inverter-data
 * Clean, server-only data proxy with origin checking and caching
 */
router.get("/inverter-data", async (req, res) => {
  // Origin verification
  const clientOrigin = req.headers.origin;
  const referer = req.headers.referer;
  
  const corsOrigins = [
    ...(env.CORS_ORIGIN || "").split(",").map((o: string) => o.trim().toLowerCase()).filter(Boolean),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL.toLowerCase()}`] : []),
  ];
  
  if (clientOrigin) {
    const isAllowed = corsOrigins.some(origin => clientOrigin.toLowerCase().startsWith(origin));
    if (!isAllowed) {
       res.status(403).json({ error: "Access Denied: Origin unauthorized." });
       return;
    }
  } else if (referer) {
    const isAllowed = corsOrigins.some(origin => referer.toLowerCase().startsWith(origin));
    if (!isAllowed) {
       res.status(403).json({ error: "Access Denied: Origin unauthorized (referer)." });
       return;
    }
  } else if (process.env.NODE_ENV === "production") {
     res.status(403).json({ error: "Access Denied: Missing Origin/Referer headers." });
     return;
  }

  checkApiReset();
  const now = new Date();

  // Seed history if empty
  if (todayChartData.length === 0) {
    todayChartData = generateTodayHistorySeed(now);
  }

  // -----------------------------------------------------------------------
  // Step 1: Try to resolve per-customer credentials from JWT + DB
  // This mirrors how GrowattApiClient and subadmin controller work:
  //   - Customer.inverterApiKey   → Solax tokenId / Waaree api token
  //   - Customer.inverterDeviceSn → Solax serial / Waaree plant SN
  // -----------------------------------------------------------------------
  let resolvedTokenId = env.WAAREE_SOLAX_TOKEN_ID || "";
  let resolvedInverterSn = env.WAAREE_SOLAX_INVERTER_SN || "";
  let resolvedLoginId = env.WAAREE_USERNAME || "";
  let resolvedPassword = env.WAAREE_PASSWORD || "";
  let customerResolved = false;
  let customerProfile: any = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const rawToken = authHeader.slice(7);
      const payload = verifyAccessToken(rawToken);
      const userId = payload.sub;

      if (userId) {
        // 1. If customerId query parameter is provided and user is employee/subadmin/admin
        const queryCustomerId = req.query.customerId ? parseInt(req.query.customerId as string, 10) : null;
        if (queryCustomerId && !isNaN(queryCustomerId) && ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "EMPLOYEE"].includes(payload.role)) {
          customerProfile = await prisma.customer.findUnique({
            where: { id: queryCustomerId },
            select: {
              id: true,
              fullName: true,
              inverterApiKey: true,
              inverterDeviceSn: true,
              inverterBrand: true,
              inverterLoginId: true,
              inverterPassword: true,
            },
          });
        }

        // 2. Otherwise, if user is a CUSTOMER, use their own profile
        if (!customerProfile && payload.role === "CUSTOMER") {
          customerProfile = await prisma.customer.findUnique({
            where: { userId },
            select: {
              id: true,
              fullName: true,
              inverterApiKey: true,
              inverterDeviceSn: true,
              inverterBrand: true,
              inverterLoginId: true,
              inverterPassword: true,
            },
          });
        }

        // 3. Otherwise, if user is admin/subadmin/employee, default to the first active Waaree customer
        if (!customerProfile && ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "EMPLOYEE"].includes(payload.role)) {
          customerProfile = await prisma.customer.findFirst({
            where: {
              status: "ACTIVE",
              inverterBrand: {
                contains: "Waaree",
                mode: "insensitive"
              }
            },
            select: {
              id: true,
              fullName: true,
              inverterApiKey: true,
              inverterDeviceSn: true,
              inverterBrand: true,
              inverterLoginId: true,
              inverterPassword: true,
            }
          });
        }

        if (customerProfile) {
          const custApiKey = (customerProfile.inverterApiKey || "").trim();
          const custDeviceSn = (customerProfile.inverterDeviceSn || "").trim();
          const custLoginId = (customerProfile.inverterLoginId || "").trim();
          const custPassword = (customerProfile.inverterPassword || "").trim();

          if (custApiKey && custApiKey !== "null" && custApiKey !== "") {
            resolvedTokenId = custApiKey;
            customerResolved = true;
          }
          if (custDeviceSn && custDeviceSn !== "null" && custDeviceSn !== "") {
            resolvedInverterSn = custDeviceSn;
          }
          if (custLoginId && custLoginId !== "null" && custLoginId !== "") {
            resolvedLoginId = custLoginId;
          }
          if (custPassword && custPassword !== "null" && custPassword !== "") {
            resolvedPassword = custPassword;
          }
          console.log(`[Waaree Route] Resolved customer ID=${customerProfile.id} (${customerProfile.fullName}) credentials`);
        }
      }
    } catch (jwtErr: any) {
      console.warn(`[Waaree Route] JWT parse failed, using env vars: ${jwtErr.message}`);
    }
  }

  const tokenId = resolvedTokenId;
  const inverterSn = resolvedInverterSn;
  const loginId = resolvedLoginId;
  const password = resolvedPassword;

  const isPlaceholder = 
    (!tokenId && !loginId) || 
    !inverterSn || 
    tokenId.includes("YOUR API TOKEN") || 
    inverterSn.includes("YOUR INVERTER SERIAL") ||
    tokenId.startsWith("<<") ||
    inverterSn.startsWith("<<") ||
    tokenId === "your-solax-token-id-here" ||
    inverterSn === "your-inverter-serial-number-here";

  let telemetryData: any = null;
  let fromCache = false;
  let fetchErrorMsg: string | null = null;
  let isSimulated = false;

  if (isPlaceholder) {
    fetchErrorMsg = customerResolved
      ? "Using simulation: Customer inverter credentials are not fully configured (inverterApiKey or inverterDeviceSn missing)."
      : "Using simulation: Token ID and Inverter SN are not configured.";
  } else {
    try {
      apiCallsToday++;
      // Call multi-strategy getWaareeLiveTelemetry from lib/waaree.ts
      const telemetry = await getWaareeLiveTelemetry(inverterSn, loginId, password, tokenId);

      telemetryData = {
        acpower: Math.round((telemetry.peakPower || 0) * 1000), // kW to Watts
        yieldtoday: Number(telemetry.dailyGeneration || 0),
        yieldtotal: Number(telemetry.totalGeneration || 0),
        feedInPower: 0,
        powerdc1: Math.round((telemetry.peakPower || 0) * 1000 * 0.55),
        powerdc2: Math.round((telemetry.peakPower || 0) * 1000 * 0.45),
        batPower: 0,
        soc: 100,
        uploadTime: telemetry.lastUpdated ? new Date(telemetry.lastUpdated).toISOString().replace("T", " ").substring(0, 19) : now.toISOString().replace("T", " ").substring(0, 19)
      };

      if (telemetry.isSimulated) {
        isSimulated = true;
        fetchErrorMsg = "Unable to fetch data from the Waaree portal. Showing simulated fallback.";
      } else {
        lastSuccessfulData = telemetryData;
        lastSuccessTime = Date.now();
        lastFetchError = null;
        isSimulated = false;
      }
      
      addChartPointForToday(now, telemetryData.acpower);
      console.log(`[Waaree Route] ✓ Live Waaree telemetry resolved (source=${telemetry.liveSource}). acpower=${telemetryData.acpower}W, yieldtoday=${telemetryData.yieldtoday}kWh`);
    } catch (err: any) {
      console.error("[Waaree API Proxy Error]:", err.message);
      fetchErrorMsg = err.message || "Failed to reach Waaree API";
      lastFetchError = fetchErrorMsg;

      if (lastSuccessfulData) {
        telemetryData = lastSuccessfulData;
        fromCache = true;
      }
    }
  }

  if (!telemetryData) {
    telemetryData = getSimulatedData(now);
    isSimulated = true;
    addChartPointForToday(now, telemetryData.acpower);
  }

  let minutesAgo = 0;
  if (lastSuccessTime) {
    minutesAgo = Math.floor((Date.now() - lastSuccessTime) / 60000);
  } else if (isSimulated || isPlaceholder) {
    minutesAgo = 0;
  } else {
    minutesAgo = 15;
  }

  const alerts: string[] = [];
  const currentHour = now.getHours();

  if (telemetryData.acpower === 0 && currentHour >= 7 && currentHour < 18) {
    alerts.push("Inverter shows no output during daylight hours. Please check your system.");
  }

  let dataIsStale = false;
  if (telemetryData.uploadTime) {
    try {
      const parts = telemetryData.uploadTime.split(" ");
      if (parts.length === 2) {
        const dateParts = parts[0].split("-");
        const timeParts = parts[1].split(":");
        if (dateParts.length === 3 && timeParts.length === 3) {
          const uploadDate = new Date(
            Number(dateParts[0]),
            Number(dateParts[1]) - 1,
            Number(dateParts[2]),
            Number(timeParts[0]),
            Number(timeParts[1]),
            Number(timeParts[2])
          );
          const diffMs = now.getTime() - uploadDate.getTime();
          const diffMin = Math.floor(diffMs / 60000);
          if (diffMin > 15 && !isSimulated && !fromCache) {
            dataIsStale = true;
            alerts.push("Data is stale. Inverter may have lost connection.");
          }
        }
      }
    } catch (e) {
      console.error("Error parsing uploadTime:", e);
    }
  }

  if (fetchErrorMsg && !isPlaceholder) {
    alerts.push("Could not reach Waaree portal. Showing last known data. Retrying in 60 seconds.");
  }

  if (telemetryData.soc < 20 && telemetryData.batPower !== 0) {
    alerts.push("Battery is critically low.");
  }

  if (apiCallsToday > 2500) {
    alerts.push("Approaching daily API call limit. Auto-refresh has been slowed down.");
  }

  const isOnline = isSimulated || (minutesAgo <= 10 && !dataIsStale);

  let historyPoints = todayChartData;
  if (!isPlaceholder && inverterSn) {
    try {
      const graphData = await getWaareeGraphData(inverterSn, loginId, password, "realtime", tokenId);
      if (graphData && graphData.timestamps.length > 0) {
        historyPoints = graphData.timestamps.map((t, idx) => ({
          time: t,
          value: Math.round((graphData.values[idx] || 0) * 1000) // kW to Watts
        }));
      }
    } catch (e: any) {
      console.warn(`[Waaree Route] Failed to fetch real-time history curve:`, e.message);
    }
  }

  res.status(200).json({
    success: true,
    data: telemetryData,
    history: historyPoints,
    status: {
      isOnline,
      lastUpdatedTime: lastSuccessTime || now.getTime(),
      minutesAgo,
      apiCallsUsed: apiCallsToday,
      apiCallsTotal: 2880,
      stale: dataIsStale || (minutesAgo > 15),
      isSimulated,
      fromCache,
      fetchError: fetchErrorMsg,
      customerResolved,
    },
    alerts,
    customerName: customerProfile?.fullName || "Demo System",
    deviceSn: inverterSn || "WR-SIM-SOLAR-001"
  });
});

export default router;
