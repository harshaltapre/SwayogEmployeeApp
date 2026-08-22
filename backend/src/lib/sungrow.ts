/**
 * Sungrow iSolarCloud API Integration
 * 
 * Authentication: OAuth 2.0 with AppKey
 * Developer Portal: developer-api.isolarcloud.com
 * 
 * Regional Gateways:
 *   - China: https://gateway.isolarcloud.com.cn
 *   - Europe: https://www.isolarcloud.eu
 *   - Global/APJ: https://gateway.isolarcloud.com
 * 
 * Workflow:
 *   1. Login with username, password, AppKey → get session token + userId
 *   2. Query Plant List → get plant IDs
 *   3. Query Device List → get inverter IDs (ps_id)
 *   4. Query real-time data using plantId + deviceId
 * 
 * Token Lifecycle: Session tokens expire, need refresh on 401
 */

import axios from "axios";

const DEFAULT_GATEWAY = "https://gateway.isolarcloud.com";
const DEFAULT_TIMEOUT = 20000;

interface SungrowSession {
  token: string;
  userId: string;
  expiresAt: number;
}

const sessionCache = new Map<string, SungrowSession>();

/**
 * Determine regional gateway based on plant location or configuration
 * Default to global gateway
 */
function getGatewayUrl(region?: string): string {
  switch (region?.toLowerCase()) {
    case "china":
    case "cn":
      return "https://gateway.isolarcloud.com.cn";
    case "europe":
    case "eu":
      return "https://www.isolarcloud.eu";
    default:
      return DEFAULT_GATEWAY;
  }
}

/**
 * Login to iSolarCloud to obtain session token
 * Requires: username, password, appKey
 */
async function login(
  username: string,
  password: string,
  appKey: string,
  gateway: string = DEFAULT_GATEWAY
): Promise<SungrowSession> {
  const cacheKey = `sungrow:${username}:${appKey}`;
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  console.log(`[Sungrow] Logging in to iSolarCloud for user: ${username}`);

  const loginUrl = `${gateway}/c/v0/user/login`;
  
  const response = await axios.post(loginUrl, {
    user: username,
    password: password,
    app_key: appKey,
  }, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: DEFAULT_TIMEOUT,
  });

  const data = response.data;
  
  if (data?.errno !== 0 && data?.code !== 0) {
    throw new Error(`Sungrow login failed: ${data?.msg || data?.message || "Unknown error"}`);
  }

  const token = data?.result?.token || data?.token || data?.access_token;
  const userId = data?.result?.userId || data?.user_id || data?.uid;

  if (!token) {
    throw new Error("Sungrow login succeeded but no token in response");
  }

  const session: SungrowSession = {
    token,
    userId: String(userId || ""),
    // Session tokens typically last 24 hours, cache for 1 hour to be safe
    expiresAt: Date.now() + 3600000,
  };

  sessionCache.set(cacheKey, session);
  console.log(`[Sungrow] ✓ Login successful, userId: ${userId}`);
  return session;
}

/**
 * Get plant list for the authenticated user
 */
async function getPlantList(
  session: SungrowSession,
  gateway: string = DEFAULT_GATEWAY
): Promise<any[]> {
  const url = `${gateway}/c/v0/plant/list`;
  
  const response = await axios.post(url, {
    page: 1,
    size: 50,
  }, {
    headers: {
      "Content-Type": "application/json",
      "token": session.token,
      "lang": "en",
    },
    timeout: DEFAULT_TIMEOUT,
  });

  const data = response.data;
  
  if (data?.errno !== 0 && data?.code !== 0) {
    throw new Error(`Sungrow plant list failed: ${data?.msg || "Unknown error"}`);
  }

  const plants = data?.result?.plants || data?.plants || data?.data || [];
  console.log(`[Sungrow] Found ${plants.length} plants`);
  return plants;
}

/**
 * Get device list for a specific plant
 */
async function getDeviceList(
  session: SungrowSession,
  plantId: string,
  gateway: string = DEFAULT_GATEWAY
): Promise<any[]> {
  const url = `${gateway}/c/v0/device/list`;
  
  const response = await axios.post(url, {
    plantId: plantId,
    page: 1,
    size: 50,
  }, {
    headers: {
      "Content-Type": "application/json",
      "token": session.token,
      "lang": "en",
    },
    timeout: DEFAULT_TIMEOUT,
  });

  const data = response.data;
  
  if (data?.errno !== 0 && data?.code !== 0) {
    throw new Error(`Sungrow device list failed: ${data?.msg || "Unknown error"}`);
  }

  const devices = data?.result?.devices || data?.devices || data?.data || [];
  console.log(`[Sungrow] Found ${devices.length} devices for plant ${plantId}`);
  return devices;
}

/**
 * Fetch real-time data for a specific device
 */
async function getDeviceRealtimeData(
  session: SungrowSession,
  plantId: string,
  deviceId: string,
  gateway: string = DEFAULT_GATEWAY
): Promise<any> {
  const url = `${gateway}/c/v0/device/realtime`;
  
  const response = await axios.post(url, {
    plantId: plantId,
    deviceId: deviceId,
  }, {
    headers: {
      "Content-Type": "application/json",
      "token": session.token,
      "lang": "en",
    },
    timeout: DEFAULT_TIMEOUT,
  });

  const data = response.data;
  
  if (data?.errno !== 0 && data?.code !== 0) {
    throw new Error(`Sungrow realtime data failed: ${data?.msg || "Unknown error"}`);
  }

  return data?.result || data?.data || {};
}

/**
 * Fetch historical generation data
 */
async function getDeviceHistory(
  session: SungrowSession,
  plantId: string,
  deviceId: string,
  period: "daily" | "monthly" | "yearly" | "realtime",
  gateway: string
): Promise<any[]> {
  const url = `${gateway}/c/v0/device/history`;
  
  const now = new Date();
  let startTime: string;
  let endTime: string;
  let timeType: number;

  switch (period) {
    case "realtime":
      timeType = 1; // Hourly
      startTime = now.toISOString().slice(0, 10);
      endTime = now.toISOString().slice(0, 10);
      break;
    case "daily":
      timeType = 2; // Daily
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 6);
      startTime = weekAgo.toISOString().slice(0, 10);
      endTime = now.toISOString().slice(0, 10);
      break;
    case "monthly":
      timeType = 3; // Monthly
      const yearAgo = new Date(now);
      yearAgo.setMonth(yearAgo.getMonth() - 11);
      startTime = `${yearAgo.getFullYear()}-${String(yearAgo.getMonth() + 1).padStart(2, "0")}`;
      endTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      break;
    case "yearly":
      timeType = 4; // Yearly
      startTime = String(now.getFullYear() - 4);
      endTime = String(now.getFullYear());
      break;
  }

  const response = await axios.post(url, {
    plantId,
    deviceId,
    timeType,
    startTime,
    endTime,
  }, {
    headers: {
      "Content-Type": "application/json",
      "token": session.token,
      "lang": "en",
    },
    timeout: DEFAULT_TIMEOUT,
  });

  const data = response.data;
  
  if (data?.errno !== 0 && data?.code !== 0) {
    throw new Error(`Sungrow history failed: ${data?.msg || "Unknown error"}`);
  }

  const records = data?.result?.data || data?.data || [];
  return records;
}

/**
 * Parse numeric value safely
 */
function parseNumeric(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value;
  const parsed = parseFloat(String(value).replace(/,/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Public API: Fetch real-time generation data from Sungrow
 * 
 * @param username - iSolarCloud username
 * @param password - iSolarCloud password
 * @param appKey - AppKey from Developer Portal
 * @param plantId - Optional plant ID (will auto-discover if not provided)
 * @param deviceId - Optional device ID (will auto-discover if not provided)
 * @param region - Optional region override (china, europe, global)
 */
export async function fetchSungrowData(
  username: string,
  password: string,
  appKey: string,
  plantId?: string,
  deviceId?: string,
  region?: string
): Promise<{
  totalGeneration: number;
  dailyGeneration: number;
  peakPower: number;
}> {
  const gateway = getGatewayUrl(region);
  
  // Login to get session token
  const session = await login(username, password, appKey, gateway);

  // Auto-discover plant if not provided
  let resolvedPlantId = plantId;
  if (!resolvedPlantId) {
    const plants = await getPlantList(session, gateway);
    if (plants.length === 0) {
      throw new Error("Sungrow: No plants found for this account");
    }
    resolvedPlantId = String(plants[0].id || plants[0].plantId);
    console.log(`[Sungrow] Auto-discovered plant ID: ${resolvedPlantId}`);
  }

  // Auto-discover device if not provided
  let resolvedDeviceId = deviceId;
  if (!resolvedDeviceId) {
    const devices = await getDeviceList(session, gateway, resolvedPlantId);
    if (devices.length === 0) {
      throw new Error(`Sungrow: No devices found for plant ${resolvedPlantId}`);
    }
    resolvedDeviceId = String(devices[0].id || devices[0].deviceId || devices[0].sn);
    console.log(`[Sungrow] Auto-discovered device ID: ${resolvedDeviceId}`);
  }

  // Fetch real-time data
  const realtimeData = await getDeviceRealtimeData(session, gateway, resolvedPlantId, resolvedDeviceId);

  // Parse metrics - Sungrow response structure varies by API version
  const totalGeneration = parseNumeric(
    realtimeData.eTotal || 
    realtimeData.totalEnergy || 
    realtimeData.generationTotal || 
    realtimeData.totalYield || 
    0
  );
  
  const dailyGeneration = parseNumeric(
    realtimeData.eToday || 
    realtimeData.dayEnergy || 
    realtimeData.generationToday || 
    realtimeData.todayYield || 
    0
  );
  
  const peakPower = parseNumeric(
    realtimeData.pac || 
    realtimeData.power || 
    realtimeData.activePower || 
    realtimeData.currentPower || 
    0
  ) / 1000; // Convert Watts to kW

  console.log(`[Sungrow] ✓ Live data: total=${totalGeneration}, daily=${dailyGeneration}, power=${peakPower}kW`);

  return {
    totalGeneration,
    dailyGeneration,
    peakPower,
  };
}

/**
 * Public API: Fetch historical generation data from Sungrow
 */
export async function fetchSungrowHistory(
  username: string,
  password: string,
  appKey: string,
  period: "daily" | "monthly" | "yearly" | "realtime",
  plantId?: string,
  deviceId?: string,
  region?: string
): Promise<any[]> {
  const gateway = getGatewayUrl(region);
  
  const session = await login(username, password, appKey, gateway);

  let resolvedPlantId = plantId;
  if (!resolvedPlantId) {
    const plants = await getPlantList(session, gateway);
    if (plants.length === 0) {
      throw new Error("Sungrow: No plants found for this account");
    }
    resolvedPlantId = String(plants[0].id || plants[0].plantId);
  }

  let resolvedDeviceId = deviceId;
  if (!resolvedDeviceId) {
    const devices = await getDeviceList(session, gateway, resolvedPlantId);
    if (devices.length === 0) {
      throw new Error(`Sungrow: No devices found for plant ${resolvedPlantId}`);
    }
    resolvedDeviceId = String(devices[0].id || devices[0].deviceId || devices[0].sn);
  }

  const records = await getDeviceHistory(session, resolvedPlantId, resolvedDeviceId, period, gateway);
  console.log(`[Sungrow] ✓ History ${period}: ${records.length} data points`);

  return records.map((item: any) => {
    const dateStr = item.date || item.time || item.dateTime || "";
    const dateObj = new Date(dateStr);

    if (period === "realtime") {
      const timePart = dateStr.length > 10 ? dateStr.slice(11, 16) : dateStr;
      return {
        date: timePart,
        label: timePart,
        power: parseNumeric(item.power || item.pac || item.value || 0) / 1000, // W to kW
      };
    }

    let label: string;
    if (period === "yearly") {
      label = String(dateObj.getFullYear());
    } else if (period === "monthly") {
      label = dateObj.toLocaleString("default", { month: "short", year: "2-digit" });
    } else {
      label = dateObj.toLocaleString("default", { day: "numeric", month: "short" });
    }

    return {
      date: dateStr.slice(0, 10),
      label,
      generation: parseNumeric(item.energy || item.generation || item.value || 0),
    };
  });
}
