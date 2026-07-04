import axios from "axios";
import crypto from "crypto";

/**
 * Solarman Open API Integration
 * Base: https://globalapi.solarmanpv.com
 *
 * Authentication: OAuth 2.0 token via POST /account/v1.0/token
 * Requires: appId, appSecret, email, password (SHA256 hashed)
 */

const SOLARMAN_BASE = "https://globalapi.solarmanpv.com";

interface SolarmanSession {
  accessToken: string;
  expiresAt: number;
  uid: number;
}

const sessionCache = new Map<string, SolarmanSession>();

function sha256(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

export interface SolarmanCredentials {
  appId: string;
  appSecret: string;
  email: string;
  password: string;
  deviceSn?: string;   // Device serial number for direct device queries
  stationId?: number;  // Station ID (can be fetched automatically)
}

/**
 * Get or refresh an access token from the Solarman API
 */
async function getAccessToken(creds: SolarmanCredentials): Promise<SolarmanSession> {
  const cacheKey = `${creds.appId}:${creds.email}`;
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const url = `${SOLARMAN_BASE}/account/v1.0/token?appId=${encodeURIComponent(creds.appId)}&language=en`;

  const response = await axios.post(url, {
    appSecret: creds.appSecret,
    email: creds.email,
    password: sha256(creds.password),
  }, {
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  });

  const data = response.data;
  if (!data?.access_token) {
    throw new Error(`Solarman auth failed: ${data?.msg || data?.message || "no access_token in response"}`);
  }

  const session: SolarmanSession = {
    accessToken: data.access_token,
    uid: data.uid || 0,
    // Token typically lasts 7200s (2 hours), cache for 1 hour to be safe
    expiresAt: Date.now() + (data.expires_in ? (data.expires_in - 3600) * 1000 : 3600000),
  };

  sessionCache.set(cacheKey, session);
  return session;
}

/**
 * Get the first station ID from the user's account
 */
async function getFirstStationId(accessToken: string, appId: string): Promise<number> {
  const url = `${SOLARMAN_BASE}/station/v1.0/list?appId=${encodeURIComponent(appId)}&language=en`;

  const response = await axios.post(url, {
    page: 1,
    size: 10,
  }, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `bearer ${accessToken}`,
    },
    timeout: 15000,
  });

  const stations = response.data?.stationList;
  if (!stations || stations.length === 0) {
    throw new Error("Solarman: no stations found for this account");
  }

  return stations[0].id;
}

/**
 * Fetch real-time inverter data (total, daily, peak power)
 */
export async function fetchSolarmanData(creds: SolarmanCredentials): Promise<{
  totalGeneration: number;
  dailyGeneration: number;
  peakPower: number;
}> {
  const session = await getAccessToken(creds);
  const stationId = creds.stationId || await getFirstStationId(session.accessToken, creds.appId);

  // Get station real-time overview
  const url = `${SOLARMAN_BASE}/station/v1.0/realTime?appId=${encodeURIComponent(creds.appId)}&language=en`;

  const response = await axios.post(url, { stationId }, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `bearer ${session.accessToken}`,
    },
    timeout: 15000,
  });

  const data = response.data;
  if (!data) {
    throw new Error("Solarman: empty response from station realTime");
  }

  return {
    totalGeneration: parseFloat(data.generationTotal || data.allEnergy || "0"),
    dailyGeneration: parseFloat(data.generationValue || data.dayEnergy || "0"),
    peakPower: parseFloat(data.activePower || data.power || "0") / 1000, // Watts to kW
  };
}

/**
 * Fetch historical generation data from Solarman
 *
 * timeType mapping:
 *   1 = Hourly (frame data for a day) -> used for "realtime"
 *   2 = Daily (day dimension, up to 30 days) -> used for "daily"
 *   3 = Monthly (month dimension, up to 12 months) -> used for "monthly"
 *   4 = Yearly (year dimension) -> used for "yearly"
 */
export async function fetchSolarmanHistory(
  creds: SolarmanCredentials,
  period: "daily" | "yearly" | "monthly" | "realtime"
): Promise<any[]> {
  const session = await getAccessToken(creds);
  const stationId = creds.stationId || await getFirstStationId(session.accessToken, creds.appId);

  const now = new Date();
  let timeType: number;
  let startTime: string;
  let endTime: string;

  switch (period) {
    case "realtime": {
      // Hourly frame data for today
      timeType = 1;
      const todayStr = now.toISOString().slice(0, 10);
      startTime = todayStr;
      endTime = todayStr;
      break;
    }
    case "daily": {
      // Last 7 days of daily data
      timeType = 2;
      const endDate = new Date(now);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startTime = startDate.toISOString().slice(0, 10);
      endTime = endDate.toISOString().slice(0, 10);
      break;
    }
    case "monthly": {
      // Last 12 months
      timeType = 3;
      const startMonth = new Date(now);
      startMonth.setMonth(startMonth.getMonth() - 11);
      startTime = `${startMonth.getFullYear()}-${String(startMonth.getMonth() + 1).padStart(2, "0")}`;
      endTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      break;
    }
    case "yearly": {
      // Last 5 years
      timeType = 4;
      startTime = String(now.getFullYear() - 4);
      endTime = String(now.getFullYear());
      break;
    }
  }

  const url = `${SOLARMAN_BASE}/station/v1.0/history?appId=${encodeURIComponent(creds.appId)}&language=en`;

  const response = await axios.post(url, {
    stationId,
    timeType,
    startTime,
    endTime,
  }, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `bearer ${session.accessToken}`,
    },
    timeout: 15000,
  });

  const records = response.data?.stationDataItems || response.data?.paramDataList || [];

  return records.map((item: any) => {
    const dateStr = item.dateTime || item.date || item.timeStr || "";
    const dateObj = new Date(dateStr);

    if (period === "realtime") {
      const timePart = dateStr.length > 10 ? dateStr.slice(11, 16) : dateStr;
      return {
        date: timePart,
        label: timePart,
        power: parseFloat(item.generationPower || item.power || item.value || "0") / 1000, // W to kW
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
      generation: parseFloat(item.generationValue || item.generation || item.energy || item.value || "0"),
    };
  });
}
