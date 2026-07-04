import axios from "axios";

/**
 * UTL Solar API Integration
 * 
 * UTL Solar provides GPRS/MQTT-based telemetry for solar inverters.
 * This module handles authentication and real-time data fetching.
 */

const UTL_BASE = "https://api.utlsolar.com"; // Typical UTL endpoint

interface UTLSession {
  token: string;
  expiresAt: number;
}

const sessionCache = new Map<string, UTLSession>();

/**
 * Authenticate with UTL Solar and get an access token
 */
async function getAccessToken(
  username: string,
  password: string,
  apiKey?: string
): Promise<string> {
  const cacheKey = `${username}:${password}`;
  const cached = sessionCache.get(cacheKey);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  try {
    // Standard REST API authentication for UTL
    const loginUrl = `${UTL_BASE}/api/v1/login`;
    const response = await axios.post(loginUrl, {
      username,
      password,
      ...(apiKey && { apiKey }),
    }, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SolRxPlatform/1.0",
      },
      timeout: 10000,
    });

    if (!response.data?.success || !response.data?.token) {
      throw new Error(`UTL login failed: ${response.data?.message || "no token received"}`);
    }

    const token = response.data.token;
    const expiresAt = Date.now() + (3600 * 1000); // 1 hour TTL

    sessionCache.set(cacheKey, { token, expiresAt });
    return token;
  } catch (err: any) {
    throw new Error(`UTL authentication failed: ${err.message}`);
  }
}

/**
 * Discover device list for an account
 */
async function discoverDevices(
  username: string,
  password: string,
  apiKey?: string,
  deviceId?: string
): Promise<string> {
  const token = await getAccessToken(username, password, apiKey);

  try {
    const listUrl = `${UTL_BASE}/api/v1/devices`;
    const response = await axios.get(listUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "User-Agent": "SolRxPlatform/1.0",
      },
      timeout: 10000,
    });

    if (!response.data?.success || !Array.isArray(response.data?.devices)) {
      throw new Error("UTL: failed to fetch device list");
    }

    // If a specific device was requested, find it
    if (deviceId) {
      const device = response.data.devices.find(
        (d: any) => String(d.deviceId) === String(deviceId) || String(d.siteId) === String(deviceId)
      );
      if (device) {
        return String(device.deviceId);
      }
      throw new Error(`UTL: device ${deviceId} not found`);
    }

    // Otherwise, use the first device
    if (response.data.devices.length === 0) {
      throw new Error("UTL: no devices found for this account");
    }

    return String(response.data.devices[0].deviceId);
  } catch (err: any) {
    throw new Error(`UTL device discovery failed: ${err.message}`);
  }
}

/**
 * Fetch real-time generation data from UTL Solar
 */
export async function fetchUTLData(
  username: string,
  password: string,
  apiKey?: string,
  deviceId?: string
): Promise<{
  totalGeneration: number;
  dailyGeneration: number;
  peakPower: number;
}> {
  try {
    const resolvedDeviceId = await discoverDevices(username, password, apiKey, deviceId);
    const token = await getAccessToken(username, password, apiKey);

    // Fetch real-time data from the device
    const dataUrl = `${UTL_BASE}/api/v1/device/${resolvedDeviceId}/realtime`;
    const response = await axios.get(dataUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "User-Agent": "SolRxPlatform/1.0",
      },
      timeout: 10000,
    });

    if (!response.data?.success || !response.data?.data) {
      throw new Error("UTL: failed to fetch real-time data");
    }

    const data = response.data.data;

    // Map UTL response fields to our standard format
    const totalGeneration = Number(data.totalGeneration || data.total_generation || data.eTotal || 0);
    const dailyGeneration = Number(data.dailyGeneration || data.daily_generation || data.eDay || 0);
    const peakPower = Number(data.currentPower || data.current_power || data.pac || 0);

    return {
      totalGeneration,
      dailyGeneration,
      peakPower,
    };
  } catch (err: any) {
    throw new Error(`UTL data fetch failed: ${err.message}`);
  }
}

/**
 * Fetch historical generation data from UTL Solar
 */
export async function fetchUTLHistory(
  username: string,
  password: string,
  period: "daily" | "monthly" | "yearly" | "realtime" = "daily",
  apiKey?: string,
  deviceId?: string
): Promise<Array<{ date: string; label: string; generation: number }>> {
  try {
    const resolvedDeviceId = await discoverDevices(username, password, apiKey, deviceId);
    const token = await getAccessToken(username, password, apiKey);

    const now = new Date();
    let startDate = new Date();
    let groupBy = "day"; // for daily (last 7 days)

    if (period === "monthly") {
      startDate.setMonth(now.getMonth() - 11); // last 12 months
      groupBy = "month";
    } else if (period === "yearly") {
      startDate.setFullYear(now.getFullYear() - 5); // last 6 years
      groupBy = "year";
    } else if (period === "realtime") {
      startDate.setHours(now.getHours() - 24); // last 24 hours
      groupBy = "hour";
    } else {
      startDate.setDate(now.getDate() - 6); // last 7 days
    }

    const historyUrl = `${UTL_BASE}/api/v1/device/${resolvedDeviceId}/history`;
    const response = await axios.get(historyUrl, {
      params: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: now.toISOString().split("T")[0],
        groupBy,
      },
      headers: {
        "Authorization": `Bearer ${token}`,
        "User-Agent": "SolRxPlatform/1.0",
      },
      timeout: 15000,
    });

    if (!response.data?.success || !Array.isArray(response.data?.data)) {
      throw new Error("UTL: failed to fetch historical data");
    }

    return response.data.data.map((point: any) => {
      let label = point.date;
      if (period === "monthly") {
        const d = new Date(point.date + "T00:00:00");
        label = d.toLocaleString("default", { month: "short", year: "2-digit" });
      } else if (period === "yearly") {
        label = new Date(point.date + "T00:00:00").getFullYear().toString();
      } else if (period === "realtime") {
        const d = new Date(point.date);
        label = `${String(d.getHours()).padStart(2, "0")}:00`;
      } else {
        const d = new Date(point.date + "T00:00:00");
        label = d.toLocaleString("default", { day: "numeric", month: "short" });
      }

      return {
        date: point.date,
        label,
        generation: Number(point.eDay || point.generation || point.energy || 0),
      };
    });
  } catch (err: any) {
    throw new Error(`UTL history fetch failed: ${err.message}`);
  }
}
