import axios from "axios";
import crypto from "crypto";

/**
 * Solis Cloud API v2 Integration
 * Base: https://www.soliscloud.com:13333
 *
 * Authentication: HmacSHA1 signature with API KeyID + KeySecret
 * All requests are HTTP POST with JSON body.
 *
 * Headers required:
 *   Content-Type: application/json;charset=UTF-8
 *   Date: GMT date string
 *   Content-MD5: Base64(MD5(body))
 *   Authorization: API {keyId}:{sign}
 *
 * Sign = Base64(HmacSHA1(keySecret, "POST\n{Content-MD5}\napplication/json;charset=UTF-8\n{Date}\n{path}"))
 */

const SOLIS_BASE = "https://www.soliscloud.com:13333";
const CONTENT_TYPE = "application/json;charset=UTF-8";

/**
 * Create the Content-MD5 header value: Base64 of the raw MD5 binary digest
 */
function createContentMd5(body: string): string {
  const md5Buffer = crypto.createHash("md5").update(body).digest();
  return md5Buffer.toString("base64");
}

/**
 * Create the HMAC-SHA1 authorization signature
 */
function createSolisSignature(
  keySecret: string,
  contentMd5: string,
  gmtDate: string,
  canonicalizedResource: string
): string {
  const stringToSign = `POST\n${contentMd5}\n${CONTENT_TYPE}\n${gmtDate}\n${canonicalizedResource}`;
  const hmac = crypto.createHmac("sha1", keySecret).update(stringToSign).digest();
  return hmac.toString("base64");
}

/**
 * Make an authenticated request to the SolisCloud API
 */
async function solisRequest(
  keyId: string,
  keySecret: string,
  path: string,
  body: Record<string, any>
): Promise<any> {
  const bodyString = JSON.stringify(body);
  const contentMd5 = createContentMd5(bodyString);
  const gmtDate = new Date().toUTCString();
  const sign = createSolisSignature(keySecret, contentMd5, gmtDate, path);

  const url = `${SOLIS_BASE}${path}`;

  const response = await axios.post(url, bodyString, {
    headers: {
      "Content-Type": CONTENT_TYPE,
      "Content-MD5": contentMd5,
      "Date": gmtDate,
      "Authorization": `API ${keyId}:${sign}`,
    },
    timeout: 20000,
  });

  const data = response.data;

  if (data?.code && data.code !== "0" && data.code !== 0) {
    throw new Error(`SolisCloud API error: ${data?.msg || data?.message || `code=${data.code}`}`);
  }

  return data?.data || data;
}

/**
 * Get the first station ID from the user's account
 */
async function getFirstStationId(keyId: string, keySecret: string): Promise<string> {
  const data = await solisRequest(keyId, keySecret, "/v1/api/userStationList", {
    pageNo: 1,
    pageSize: 10,
  });

  const stations = data?.page?.records || data?.records || data?.stationList || [];
  if (stations.length === 0) {
    throw new Error("SolisCloud: no stations found for this account");
  }

  return String(stations[0].id || stations[0].stationId);
}

/**
 * Get the first inverter ID/SN for a station
 */
async function getFirstInverterId(keyId: string, keySecret: string, stationId: string): Promise<string> {
  const data = await solisRequest(keyId, keySecret, "/v1/api/inverterList", {
    pageNo: 1,
    pageSize: 10,
    stationId,
  });

  const inverters = data?.page?.records || data?.records || data?.inverterList || [];
  if (inverters.length === 0) {
    throw new Error("SolisCloud: no inverters found for this station");
  }

  return String(inverters[0].id || inverters[0].inverterId || inverters[0].sn);
}

/**
 * Fetch real-time generation data from SolisCloud station
 */
export async function fetchSolisData(
  keyId: string,
  keySecret: string,
  stationId?: string
): Promise<{
  totalGeneration: number;
  dailyGeneration: number;
  peakPower: number;
}> {
  const sid = stationId || await getFirstStationId(keyId, keySecret);

  const data = await solisRequest(keyId, keySecret, "/v1/api/stationDetail", {
    id: sid,
  });

  return {
    totalGeneration: parseFloat(data?.allEnergy || data?.allEnergyStr || "0"),
    dailyGeneration: parseFloat(data?.dayEnergy || data?.dayEnergyStr || "0"),
    peakPower: parseFloat(data?.power || data?.activePower || "0") / 1000, // W to kW
  };
}

/**
 * Fetch historical generation data from SolisCloud
 *
 * Endpoint mapping by period:
 *   realtime -> /v1/api/inverterDay (hourly power for today)
 *   daily    -> /v1/api/inverterMonth (daily generation for current month)
 *   monthly  -> /v1/api/inverterYear (monthly generation for current year)
 *   yearly   -> /v1/api/inverterAll (yearly cumulative)
 */
export async function fetchSolisHistory(
  keyId: string,
  keySecret: string,
  period: "daily" | "yearly" | "monthly" | "realtime",
  stationId?: string
): Promise<any[]> {
  const sid = stationId || await getFirstStationId(keyId, keySecret);
  const inverterId = await getFirstInverterId(keyId, keySecret, sid);
  const now = new Date();

  if (period === "realtime") {
    // Hourly power data for today
    const todayStr = now.toISOString().slice(0, 10);
    const data = await solisRequest(keyId, keySecret, "/v1/api/inverterDay", {
      id: inverterId,
      money: "CNY",
      time: todayStr,
      timeZone: 5.5, // IST offset
    });

    const items = data || [];
    if (Array.isArray(items)) {
      return items.map((item: any) => {
        const timeStr = item.dataTimestamp || item.time || "";
        const timePart = timeStr.length > 10 ? timeStr.slice(11, 16) : timeStr;
        return {
          date: timePart,
          label: timePart,
          power: parseFloat(item.pac || item.power || item.value || "0") / 1000,
        };
      });
    }
    return [];
  }

  if (period === "daily") {
    // Daily generation for current month
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const data = await solisRequest(keyId, keySecret, "/v1/api/inverterMonth", {
      id: inverterId,
      money: "CNY",
      month: monthStr,
    });

    const items = data || [];
    if (Array.isArray(items)) {
      return items.map((item: any) => {
        const dateStr = item.dataTimestamp || item.date || item.time || "";
        const dateObj = new Date(dateStr);
        return {
          date: dateStr.slice(0, 10),
          label: dateObj.toLocaleString("default", { day: "numeric", month: "short" }),
          generation: parseFloat(item.energy || item.value || item.eg || "0"),
        };
      });
    }
    return [];
  }

  if (period === "monthly") {
    // Monthly generation for current year
    const yearStr = String(now.getFullYear());
    const data = await solisRequest(keyId, keySecret, "/v1/api/inverterYear", {
      id: inverterId,
      money: "CNY",
      year: yearStr,
    });

    const items = data || [];
    if (Array.isArray(items)) {
      return items.map((item: any) => {
        const dateStr = item.dataTimestamp || item.date || item.time || "";
        const dateObj = new Date(dateStr);
        return {
          date: dateStr.slice(0, 10),
          label: dateObj.toLocaleString("default", { month: "short", year: "2-digit" }),
          generation: parseFloat(item.energy || item.value || item.eg || "0"),
        };
      });
    }
    return [];
  }

  if (period === "yearly") {
    // Yearly cumulative data
    const data = await solisRequest(keyId, keySecret, "/v1/api/inverterAll", {
      id: inverterId,
      money: "CNY",
    });

    const items = data || [];
    if (Array.isArray(items)) {
      return items.map((item: any) => {
        const dateStr = item.dataTimestamp || item.date || item.year || "";
        return {
          date: `${dateStr}-01-01`,
          label: String(dateStr).slice(0, 4),
          generation: parseFloat(item.energy || item.value || item.eg || "0"),
        };
      });
    }
    return [];
  }

  return [];
}
