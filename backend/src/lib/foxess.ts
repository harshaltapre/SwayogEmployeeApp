import axios from "axios";
import crypto from "crypto";

const FOXESS_BASE_URL = "https://www.foxesscloud.com";
const DEFAULT_TIMEOUT = 15000;

interface FoxESSSession {
  token: string;
  expiresAt: number;
}

const sessionCache = new Map<string, FoxESSSession>();

function parseNumeric(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Create the FoxESS OpenAPI signature header.
 * Signature = MD5(path + "\r\n" + token + "\r\n" + timestamp)
 */
function createOpenApiSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return crypto.createHash("md5").update(signStr).digest("hex");
}

/**
 * Make an authenticated request to the FoxESS OpenAPI.
 * Uses API key as the token header and MD5 signature.
 */
async function foxessOpenApiGet(path: string, apiKey: string, params: Record<string, any> = {}): Promise<any> {
  const timestamp = Date.now();
  const signature = createOpenApiSignature(path, apiKey, timestamp);

  const url = `${FOXESS_BASE_URL}${path}`;
  const response = await axios.get(url, {
    params,
    headers: {
      "Content-Type": "application/json",
      "token": apiKey,
      "signature": signature,
      "timestamp": String(timestamp),
      "lang": "en",
    },
    timeout: DEFAULT_TIMEOUT,
  });

  return response?.data;
}

async function foxessOpenApiPost(path: string, apiKey: string, body: Record<string, any> = {}): Promise<any> {
  const timestamp = Date.now();
  const signature = createOpenApiSignature(path, apiKey, timestamp);

  const url = `${FOXESS_BASE_URL}${path}`;
  const response = await axios.post(url, body, {
    headers: {
      "Content-Type": "application/json",
      "token": apiKey,
      "signature": signature,
      "timestamp": String(timestamp),
      "lang": "en",
    },
    timeout: DEFAULT_TIMEOUT,
  });

  return response?.data;
}

/**
 * Strategy 1: FoxESS OpenAPI with API key.
 * This is the standard approach for users who have generated an API key.
 */
async function loginWithApiKey(apiKey: string): Promise<string> {
  // For OpenAPI, the apiKey IS the token — no login needed.
  // Verify it's valid by trying to list devices.
  console.log(`[FoxESS] Trying OpenAPI key auth (key length=${apiKey.length})...`);
  
  try {
    const res = await foxessOpenApiPost("/op/v0/device/list", apiKey, {
      currentPage: 1,
      pageSize: 10,
    });
    
    if (res?.errno === 0 || res?.result?.devices || res?.result?.data) {
      console.log(`[FoxESS] ✓ OpenAPI key auth succeeded`);
      return apiKey;
    }
  } catch (e: any) {
    console.warn(`[FoxESS] OpenAPI key auth failed: ${e.message}`);
  }

  throw new Error("FoxESS API key is invalid or OpenAPI access is not enabled for this account.");
}

/**
 * Strategy 2: FoxESS Cloud web portal login with username + password.
 * This is for UTL Solar and other FoxESS users who have email/password credentials.
 */
async function loginWithCredentials(username: string, password: string): Promise<string> {
  const cacheKey = `foxess:${username}:${password}`;
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  console.log(`[FoxESS] Trying web portal credential login for user: "${username}"...`);
  
  // Hash the password with MD5 (FoxESS uses MD5-hashed passwords for login)
  const hashedPassword = crypto.createHash("md5").update(password).digest("hex");

  const loginAttempts = [
    // Attempt 1: Standard login endpoint with hashed password
    {
      url: `${FOXESS_BASE_URL}/c/v0/user/login`,
      body: { user: username, password: hashedPassword },
      label: "MD5 hashed login",
    },
    // Attempt 2: Standard login with raw password  
    {
      url: `${FOXESS_BASE_URL}/c/v0/user/login`,
      body: { user: username, password: password },
      label: "Raw password login",
    },
    // Attempt 3: Alternate login endpoint
    {
      url: `${FOXESS_BASE_URL}/c/v0/user/login`,
      body: { userName: username, userPassword: hashedPassword },
      label: "Alt field names (MD5)",
    },
  ];

  for (const attempt of loginAttempts) {
    try {
      const response = await axios.post(attempt.url, attempt.body, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "lang": "en",
        },
        timeout: DEFAULT_TIMEOUT,
      });

      const data = response.data;
      const token = data?.result?.token || data?.result?.access_token || data?.token || data?.access_token;

      if (token) {
        console.log(`[FoxESS] ✓ Credential login succeeded via ${attempt.label}`);
        sessionCache.set(cacheKey, { token, expiresAt: Date.now() + 3600 * 1000 });
        return token;
      }

      if (data?.errno === 0 && !token) {
        console.warn(`[FoxESS] ${attempt.label}: errno=0 but no token in response`);
      } else if (data?.errno) {
        console.warn(`[FoxESS] ${attempt.label}: errno=${data.errno}, msg=${data?.msg || "unknown"}`);
      }
    } catch (e: any) {
      console.warn(`[FoxESS] ${attempt.label} failed: ${e.message}`);
    }
  }

  throw new Error(`FoxESS credential login failed for user "${username}". Please verify the email/password or use an API key instead.`);
}

/**
 * Discover the first device SN from the account.
 * Tries OpenAPI device/list first, then fallback to web portal endpoint.
 */
async function discoverDeviceSn(token: string, isApiKey: boolean): Promise<string | null> {
  // Try OpenAPI device list
  try {
    const res = isApiKey
      ? await foxessOpenApiPost("/op/v0/device/list", token, { currentPage: 1, pageSize: 10 })
      : await axios.post(`${FOXESS_BASE_URL}/c/v0/device/list`, { currentPage: 1, pageSize: 10 }, {
          headers: {
            "Content-Type": "application/json",
            "token": token,
            "lang": "en",
          },
          timeout: DEFAULT_TIMEOUT,
        }).then(r => r.data);

    const devices = res?.result?.devices || res?.result?.data || [];
    if (Array.isArray(devices) && devices.length > 0) {
      const sn = devices[0].deviceSN || devices[0].deviceSn || devices[0].sn || devices[0].serialNumber;
      if (sn) {
        console.log(`[FoxESS] ✓ Discovered device SN: "${sn}"`);
        return String(sn);
      }
    }
  } catch (e: any) {
    console.warn(`[FoxESS] device/list discovery failed: ${e.message}`);
  }

  return null;
}

/**
 * Fetch real-time generation metrics from FoxESS.
 */
async function fetchMetrics(token: string, deviceSn: string, isApiKey: boolean): Promise<{
  totalGeneration: number;
  dailyGeneration: number;
  peakPower: number;
}> {
  // Try OpenAPI real-time endpoint
  try {
    const path = "/op/v0/device/real/query";
    const body = { sn: deviceSn, variables: ["generationTotal", "generationToday", "generationPower"] };

    const res = isApiKey
      ? await foxessOpenApiPost(path, token, body)
      : await axios.post(`${FOXESS_BASE_URL}${path}`, body, {
          headers: { "Content-Type": "application/json", "token": token, "lang": "en" },
          timeout: DEFAULT_TIMEOUT,
        }).then(r => r.data);

    if (res?.errno === 0 && res?.result) {
      const datas = res.result;
      let total = 0, daily = 0, power = 0;

      if (Array.isArray(datas)) {
        for (const item of datas) {
          if (item.variable === "generationTotal") total = parseNumeric(item.value);
          if (item.variable === "generationToday") daily = parseNumeric(item.value);
          if (item.variable === "generationPower") power = parseNumeric(item.value);
        }
      } else if (typeof datas === "object") {
        total = parseNumeric(datas.generationTotal || datas.totalEnergy);
        daily = parseNumeric(datas.generationToday || datas.todayEnergy);
        power = parseNumeric(datas.generationPower || datas.currentPower);
      }

      if (total > 0 || daily > 0 || power > 0) {
        console.log(`[FoxESS] ✓ Real-time metrics: today=${daily}, total=${total}, power=${power}kW`);
        return { totalGeneration: total, dailyGeneration: daily, peakPower: power };
      }
    }
  } catch (e: any) {
    console.warn(`[FoxESS] Real-time query failed: ${e.message}`);
  }

  // Fallback: Try device detail endpoint
  try {
    const path = "/op/v0/device/detail";
    const body = { sn: deviceSn };

    const res = isApiKey
      ? await foxessOpenApiPost(path, token, body)
      : await axios.post(`${FOXESS_BASE_URL}${path}`, body, {
          headers: { "Content-Type": "application/json", "token": token, "lang": "en" },
          timeout: DEFAULT_TIMEOUT,
        }).then(r => r.data);

    if (res?.errno === 0 && res?.result) {
      const d = res.result;
      const total = parseNumeric(d.generationTotal || d.totalEnergy);
      const daily = parseNumeric(d.generationToday || d.todayEnergy);
      const power = parseNumeric(d.generationPower || d.power || d.currentPower);
      
      if (total > 0 || daily > 0 || power > 0) {
        console.log(`[FoxESS] ✓ Device detail metrics: today=${daily}, total=${total}, power=${power}kW`);
        return { totalGeneration: total, dailyGeneration: daily, peakPower: power };
      }
    }
  } catch (e: any) {
    console.warn(`[FoxESS] Device detail failed: ${e.message}`);
  }

  throw new Error("FoxESS real-time metrics were not available from the cloud API");
}

/**
 * Fetch historical generation records from FoxESS.
 */
async function fetchHistoryRecords(
  token: string,
  deviceSn: string,
  period: "daily" | "monthly" | "yearly" | "realtime",
  isApiKey: boolean
): Promise<any[]> {
  const now = new Date();
  
  // Map period to FoxESS API dimension: hour=0, day=1, month=2, year=3
  let dimension: number;
  let beginDate: { year: number; month: number; day: number; hour: number };

  switch (period) {
    case "realtime":
      dimension = 0; // hourly
      beginDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), hour: 0 };
      break;
    case "daily":
      dimension = 1; // daily
      beginDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: 1, hour: 0 };
      break;
    case "monthly":
      dimension = 2; // monthly
      beginDate = { year: now.getFullYear(), month: 1, day: 1, hour: 0 };
      break;
    case "yearly":
      dimension = 3; // yearly
      beginDate = { year: now.getFullYear() - 5, month: 1, day: 1, hour: 0 };
      break;
  }

  const path = "/op/v0/device/history/query";
  const body = {
    sn: deviceSn,
    dimension,
    variables: period === "realtime" ? ["generationPower"] : ["generation"],
    begin: beginDate,
  };

  try {
    const res = isApiKey
      ? await foxessOpenApiPost(path, token, body)
      : await axios.post(`${FOXESS_BASE_URL}${path}`, body, {
          headers: { "Content-Type": "application/json", "token": token, "lang": "en" },
          timeout: DEFAULT_TIMEOUT,
        }).then(r => r.data);

    if (res?.errno === 0 && res?.result) {
      const items = res.result;
      if (Array.isArray(items) && items.length > 0) {
        // FoxESS returns [{variable, unit, data: [{time, value}]}]
        const varData = items[0];
        if (varData?.data && Array.isArray(varData.data)) {
          console.log(`[FoxESS] ✓ History ${period}: ${varData.data.length} data points`);
          return varData.data.map((d: any) => {
            const timeStr = d.time || "";
            if (period === "realtime") {
              const timePart = timeStr.length > 10 ? timeStr.slice(11, 16) : timeStr;
              return {
                date: timePart,
                label: timePart,
                power: parseNumeric(d.value),
              };
            }
            const dateObj = new Date(timeStr);
            let label: string;
            if (period === "yearly") label = String(dateObj.getFullYear());
            else if (period === "monthly") label = dateObj.toLocaleString("default", { month: "short", year: "2-digit" });
            else label = dateObj.toLocaleString("default", { day: "numeric", month: "short" });
            
            return {
              date: timeStr.slice(0, 10),
              label,
              generation: parseNumeric(d.value),
            };
          });
        }
      }
    }
  } catch (e: any) {
    console.warn(`[FoxESS] History query failed for ${period}: ${e.message}`);
  }

  throw new Error(`FoxESS history was not available for period '${period}'`);
}

/**
 * Fetch live generation data from FoxESS.
 * Supports both API key and username+password authentication.
 *
 * @param apiKeyOrUsername - FoxESS API key or portal username/email
 * @param deviceSn - Optional device serial number
 * @param password - Optional password (if using credential-based login)
 */
export async function fetchFoxessData(
  apiKeyOrUsername: string,
  deviceSn?: string,
  password?: string
): Promise<{ totalGeneration: number; dailyGeneration: number; peakPower: number }> {
  const trimmedKey = (apiKeyOrUsername || "").trim();
  const trimmedPass = (password || "").trim();
  
  let token: string;
  let isApiKey = false;

  // Determine auth method:
  // If password is provided and not empty/api_token, use credential login
  // If no password, treat apiKeyOrUsername as an API key
  if (trimmedPass && trimmedPass !== "api_token" && trimmedPass !== "null") {
    token = await loginWithCredentials(trimmedKey, trimmedPass);
  } else {
    token = await loginWithApiKey(trimmedKey);
    isApiKey = true;
  }

  const resolvedSn = (deviceSn || "").trim() || (await discoverDeviceSn(token, isApiKey));

  if (!resolvedSn) {
    throw new Error("FoxESS device serial number could not be discovered. Please provide it in the Device SN field.");
  }

  return await fetchMetrics(token, resolvedSn, isApiKey);
}

/**
 * Fetch historical generation data from FoxESS.
 * Supports both API key and username+password authentication.
 */
export async function fetchFoxessHistory(
  apiKeyOrUsername: string,
  deviceSn: string | undefined,
  period: "daily" | "monthly" | "yearly" | "realtime",
  password?: string
): Promise<any[]> {
  const trimmedKey = (apiKeyOrUsername || "").trim();
  const trimmedPass = (password || "").trim();
  
  let token: string;
  let isApiKey = false;

  if (trimmedPass && trimmedPass !== "api_token" && trimmedPass !== "null") {
    token = await loginWithCredentials(trimmedKey, trimmedPass);
  } else {
    token = await loginWithApiKey(trimmedKey);
    isApiKey = true;
  }

  const resolvedSn = (deviceSn || "").trim() || (await discoverDeviceSn(token, isApiKey));

  if (!resolvedSn) {
    throw new Error("FoxESS device serial number could not be discovered.");
  }

  return await fetchHistoryRecords(token, resolvedSn, period, isApiKey);
}
