import axios from "axios";
import crypto from "crypto";

export interface CachedSession {
  token: string;
  secret: string;
  baseUrl: string;
  expiresAt: number;
  plants?: any[] | null;
}

const sessionCache = new Map<string, CachedSession>();

function extractCookies(response: any): string {
  const cookieHeader = response.headers["set-cookie"] as any;
  let cookieString = "";
  if (cookieHeader) {
    if (Array.isArray(cookieHeader)) {
      cookieString = cookieHeader.map((c: string) => c.split(";")[0]).join("; ");
    } else if (typeof cookieHeader === "string") {
      cookieString = cookieHeader.split(";")[0];
    }
  }
  return cookieString;
}

/**
 * Checks if a response body is an HTML page (login redirect) rather than real JSON data.
 */
function isHtmlResponse(data: any): boolean {
  if (typeof data === "string") {
    return data.trim().startsWith("<!") || data.includes("<html") || data.includes("DOCTYPE");
  }
  return false;
}

/**
 * Attempts portal login at a specific base URL with multiple auth strategies.
 */
async function tryServerLogin(
  baseUrl: string,
  usr: string,
  pass: string
): Promise<CachedSession | null> {
  const pwdMd5 = crypto.createHash("md5").update(pass).digest("hex");
  const pwdBase64 = Buffer.from(pass).toString("base64");

  let pwdMd5Custom = pwdMd5;
  for (let i = 0; i < pwdMd5.length; i += 2) {
    if (pwdMd5[i] === "0") {
      pwdMd5Custom = pwdMd5Custom.substring(0, i) + "c" + pwdMd5Custom.substring(i + 1);
    }
  }

  // Step 1: Pre-fetch cookies from / and /login to bypass security/Cloudflare challenge filters
  let allCookies = "";
  try {
    const r0 = await axios.get(`${baseUrl}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      timeout: 6000,
    });
    allCookies = extractCookies(r0);
  } catch (e: any) {
    if (e.response?.headers?.["set-cookie"]) {
      allCookies = extractCookies(e.response);
    }
  }

  try {
    const r1 = await axios.get(`${baseUrl}/login`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Cookie": allCookies,
      },
      timeout: 6000,
    });
    const lc = extractCookies(r1);
    if (lc) allCookies = allCookies ? allCookies + "; " + lc : lc;
  } catch (e) {
    // ignore
  }

  // Prioritize Web login attempts first (since they generate cookies valid for all Web panel endpoints)
  // Fall back to Mobile API login attempts if Web login fails.
  const attempts = [
    // 1. Web portal form with raw password
    {
      url: `${baseUrl}/login`,
      body: `account=${encodeURIComponent(usr)}&password=${encodeURIComponent(pass)}&validateCode=`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Cookie": allCookies,
        "Referer": `${baseUrl}/login`,
        "Origin": baseUrl,
      },
      label: "Web Portal Raw",
      isWeb: true,
    },
    // 2. Web portal form with base64 password
    {
      url: `${baseUrl}/login`,
      body: `account=${encodeURIComponent(usr)}&password=${encodeURIComponent(pwdBase64)}&validateCode=`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Cookie": allCookies,
        "Referer": `${baseUrl}/login`,
        "Origin": baseUrl,
      },
      label: "Web Portal Base64",
      isWeb: true,
    },
    // 3. Web portal form with MD5
    {
      url: `${baseUrl}/login`,
      body: `account=${encodeURIComponent(usr)}&password=${encodeURIComponent(pwdMd5)}&validateCode=`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Cookie": allCookies,
        "Referer": `${baseUrl}/login`,
        "Origin": baseUrl,
      },
      label: "Web Portal MD5",
      isWeb: true,
    },
    // 4. Mobile API with MD5 (most common for server.growatt.com)
    {
      url: `${baseUrl}/newTwoLoginAPI.do`,
      body: `userName=${encodeURIComponent(usr)}&password=${pwdMd5Custom}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
      },
      label: "MD5 Mobile API",
      isWeb: false,
    },
    // 5. Mobile API with raw password
    {
      url: `${baseUrl}/newTwoLoginAPI.do`,
      body: `userName=${encodeURIComponent(usr)}&password=${encodeURIComponent(pass)}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
      },
      label: "Raw Mobile API",
      isWeb: false,
    },
  ];

  for (const attempt of attempts) {
    try {
      console.log(`[Growatt Session] Trying ${attempt.label} at: ${attempt.url}`);
      const response = await axios.post(attempt.url, attempt.body, {
        headers: attempt.headers,
        timeout: 8000,
      });

      const data = response.data;
      const cookieString = extractCookies(response);

      // Mobile API success: explicit success flag
      if (!attempt.isWeb && (data?.back?.success === true || data?.success === true)) {
        const userId = data.back?.user?.id || data.user?.id || "portal";
        const plants = data.back?.data || data.data || null;
        const finalCookies = allCookies ? allCookies + "; " + cookieString : cookieString;
        console.log(`[Growatt Session] ✓ Login via ${attempt.label} at ${baseUrl}, userId: ${userId}`);
        return { token: String(userId), secret: finalCookies, baseUrl, expiresAt: Date.now() + 3600 * 1000, plants };
      }

      // Web portal success: result === 1 or success redirects
      if (attempt.isWeb && (data?.result === 1 || data?.success === true || cookieString.includes("assToken"))) {
        // Parse and deduplicate cookies to ensure JSESSIONID is correct
        const cookieMap = new Map<string, string>();
        const parseIntoMap = (str: string) => {
          if (!str) return;
          str.split(";").forEach(c => {
            const parts = c.trim().split("=");
            if (parts.length >= 2) {
              cookieMap.set(parts[0].trim(), parts.slice(1).join("=").trim());
            }
          });
        };
        parseIntoMap(allCookies);
        parseIntoMap(cookieString);
        const combinedCookies = Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join("; ");

        // Verify the session is actually authenticated by hitting a lightweight endpoint
        try {
          const verifyRes = await axios.post(`${baseUrl}/index/getPlantListTitle`, "", {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
              "Cookie": combinedCookies,
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            timeout: 5000,
          });
          if (verifyRes.data && !isHtmlResponse(verifyRes.data)) {
            console.log(`[Growatt Session] ✓ Web Portal cookie login via ${attempt.label} at: ${baseUrl}`);
            return { token: "portal_session", secret: combinedCookies, baseUrl, expiresAt: Date.now() + 3600 * 1000 };
          } else {
            console.log(`[Growatt Session] ✗ Web Portal cookie verification failed for ${attempt.label} (redirected to login)`);
          }
        } catch (e: any) {
          console.warn(`[Growatt Session] ✗ Web Portal verification failed for ${attempt.label}: ${e.message}`);
        }
      }

      if (data?.back?.msg || data?.back?.error || data?.error || data?.msg) {
        console.log(`[Growatt Session] ✗ ${attempt.label} rejected: ${data?.back?.error || data?.back?.msg || data?.error || data?.msg}`);
      }
    } catch (err: any) {
      console.warn(`[Growatt Session] ✗ ${attempt.label} at ${baseUrl} failed: ${err.message}`);
    }
  }

  return null;
}

export async function getGrowattSession(usr: string, pass: string): Promise<CachedSession> {
  const cacheKey = `${usr}:${pass}`;
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const regions = [
    "https://server.growatt.com",
    "https://server-us.growatt.com",
  ];

  for (const baseUrl of regions) {
    const session = await tryServerLogin(baseUrl, usr, pass);
    if (session) {
      sessionCache.set(cacheKey, session);
      return session;
    }
  }

  throw new Error(`Growatt portal login failed. The username/password combination was rejected by all Growatt servers. Please verify the credentials in the Update Credentials panel.`);
}

/**
 * Makes an authenticated POST request to a Growatt portal endpoint.
 * Returns null if the response is HTML (session expired/invalid) instead of JSON data.
 */
async function portalPost(url: string, body: string, cookies: string): Promise<any> {
  const res = await axios.post(url, body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "Cookie": cookies,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "application/json, text/javascript, */*; q=0.01",
    },
    timeout: 12000,
  });

  if (isHtmlResponse(res.data)) {
    console.warn(`[Growatt Portal] Response from ${url} is HTML (session invalid or redirect)`);
    return null;
  }

  return res.data;
}

/**
 * Fetches the plant list from a live Growatt portal session.
 * Returns null if no real plant data can be obtained.
 */
export async function getPortalPlants(session: CachedSession): Promise<any[] | null> {
  // Strategy 1: Modern getPlantListTitle
  try {
    const data = await portalPost(`${session.baseUrl}/index/getPlantListTitle`, "", session.secret);
    if (Array.isArray(data) && data.length > 0) {
      console.log(`[Growatt Portal] ✓ getPlantListTitle returned ${data.length} plants`);
      return data;
    }
  } catch (e: any) {
    console.warn(`[Growatt Portal] getPlantListTitle error: ${e.message}`);
  }

  // Strategy 2: Legacy getPlantListForWeb.do
  try {
    const data = await portalPost(
      `${session.baseUrl}/panel/getPlantListForWeb.do`,
      `userId=${session.token}&currPage=1`,
      session.secret
    );
    const plants = data?.back || data?.data || data;
    if (Array.isArray(plants) && plants.length > 0) {
      console.log(`[Growatt Portal] ✓ getPlantListForWeb.do returned ${plants.length} plants`);
      return plants;
    }
  } catch (e: any) {
    console.warn(`[Growatt Portal] getPlantListForWeb.do error: ${e.message}`);
  }

  return null;
}

/**
 * Fetches live device generation metrics from portal.
 * Returns null if real data cannot be obtained.
 */
export async function getPortalDeviceMetrics(session: CachedSession, plantId: string): Promise<{
  totalEnergy: number;
  todayEnergy: number;
  currentPower: number;
} | null> {
  // Strategy 1: getDevicesByPlantList (Modern Portal - has real-time power)
  try {
    const data = await portalPost(
      `${session.baseUrl}/panel/getDevicesByPlantList`,
      `plantId=${plantId}&currPage=1`,
      session.secret
    );
    const devs = data?.back?.data || data?.obj?.datas || data?.obj?.data || data?.data || data?.result?.data || (Array.isArray(data?.obj) ? data.obj : null);
    if (Array.isArray(devs) && devs.length > 0) {
      const dev = devs[0];
      const rawPower = parseFloat(dev.power || dev.pac || dev.outputPower || "0");
      const powerKw = rawPower > 150 ? rawPower / 1000.0 : rawPower; // W→kW if needed
      const totalEnergy = parseFloat(dev.totalEnergy || dev.eTotal || dev.total || "0");
      const todayEnergy = parseFloat(dev.todayEnergy || dev.eToday || dev.today || "0");
      console.log(`[Growatt Portal] ✓ getDevicesByPlantList: today=${todayEnergy}, total=${totalEnergy}, power=${powerKw}kW`);
      return { totalEnergy, todayEnergy, currentPower: powerKw };
    }
  } catch (e: any) {
    console.warn(`[Growatt Portal] getDevicesByPlantList error: ${e.message}`);
  }

  // Strategy 2: getDevicesByPlant (Alternate endpoint)
  try {
    const data = await portalPost(
      `${session.baseUrl}/panel/getDevicesByPlant`,
      `plantId=${plantId}`,
      session.secret
    );
    const devs = data?.data || (Array.isArray(data) ? data : null);
    if (Array.isArray(devs) && devs.length > 0) {
      const dev = devs[0];
      const rawPower = parseFloat(dev.power || dev.pac || "0");
      const powerKw = rawPower > 150 ? rawPower / 1000.0 : rawPower;
      const totalEnergy = parseFloat(dev.totalEnergy || dev.eTotal || "0");
      const todayEnergy = parseFloat(dev.todayEnergy || dev.eToday || "0");
      console.log(`[Growatt Portal] ✓ getDevicesByPlant: today=${todayEnergy}, total=${totalEnergy}, power=${powerKw}kW`);
      return { totalEnergy, todayEnergy, currentPower: powerKw };
    }
  } catch (e: any) {
    console.warn(`[Growatt Portal] getDevicesByPlant error: ${e.message}`);
  }

  // Strategy 3: getPlantData (endpoint with plant-level data)
  try {
    const data = await portalPost(
      `${session.baseUrl}/panel/getPlantData?plantId=${plantId}`,
      "",
      session.secret
    );
    const pData = data?.plantData || data;
    if (pData && (pData.todayEnergy !== undefined || pData.totalEnergy !== undefined || pData.currentPower !== undefined)) {
      const totalEnergy = parseFloat(pData.totalEnergy || pData.total || "0");
      const todayEnergy = parseFloat(pData.todayEnergy || pData.today || "0");
      const currentPower = parseFloat(pData.currentPower || pData.power || "0");
      console.log(`[Growatt Portal] ✓ getPlantData: today=${todayEnergy}, total=${totalEnergy}, power=${currentPower}kW`);
      return { totalEnergy, todayEnergy, currentPower };
    }
  } catch (e: any) {
    console.warn(`[Growatt Portal] getPlantData error: ${e.message}`);
  }

  return null;
}

export async function getPortalDevices(session: CachedSession, plantId: string): Promise<any[] | null> {
  try {
    const data = await portalPost(
      `${session.baseUrl}/panel/getDevicesByPlantList`,
      `plantId=${plantId}&currPage=1`,
      session.secret
    );
    const devs = data?.back?.data || data?.obj?.datas || data?.obj?.data || data?.data || data?.result?.data || (Array.isArray(data?.obj) ? data.obj : null);
    if (Array.isArray(devs)) {
      return devs;
    }
  } catch (e: any) {
    console.warn(`[Growatt Portal] getDevicesByPlantList error: ${e.message}`);
  }
  return null;
}

/**
 * Fetches REAL historical generation data from the Growatt portal.
 * Returns null if real data cannot be obtained — never returns fake data.
 */
async function getPortalHistory(
  session: CachedSession,
  plantId: string,
  period: "daily" | "monthly" | "yearly" | "realtime"
): Promise<any[] | null> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");

  if (period === "realtime") {
    // Query real-time power data per 5-minute interval for today
    try {
      const data = await portalPost(
        `${session.baseUrl}/energy/compare/getDevicesInverterDataForBack`,
        `type=1&date=${dateStr}&plantId=${plantId}`,
        session.secret
      );
      if (data && !isHtmlResponse(data)) {
        const points = data?.obj?.pac || data?.data?.pac || data?.pac;
        if (Array.isArray(points) && points.length > 0) {
          console.log(`[Growatt Portal] ✓ Real-time power data: ${points.length} points`);
          return points.map((p: any, i: number) => ({
            date: p.time || p.date || `${String(Math.floor(i * 5 / 60)).padStart(2, "0")}:${String((i * 5) % 60).padStart(2, "0")}`,
            label: p.time || `${String(Math.floor(i * 5 / 60)).padStart(2, "0")}:${String((i * 5) % 60).padStart(2, "0")}`,
            power: parseFloat(p.pac || p.power || p.value || "0") / 1000, // W→kW
          })).filter((p: any) => p.power >= 0);
        }
      }
    } catch (e: any) {
      console.warn(`[Growatt Portal] Real-time power fetch failed: ${e.message}`);
    }

    // Fallback: Try the energy chart endpoint
    try {
      const data = await portalPost(
        `${session.baseUrl}/panel/chart/getPlantPowerChart.do`,
        `plantId=${plantId}&date=${dateStr}`,
        session.secret
      );
      if (data && !isHtmlResponse(data)) {
        const points = data?.datas || data?.back?.datas;
        if (Array.isArray(points) && points.length > 0) {
          console.log(`[Growatt Portal] ✓ Plant power chart: ${points.length} points`);
          return points.map((p: any) => ({
            date: p.time,
            label: p.time,
            power: parseFloat(p.pac || p.power || "0"),
          })).filter((p: any) => p.power >= 0);
        }
      }
    } catch (e: any) {
      console.warn(`[Growatt Portal] getPlantPowerChart failed: ${e.message}`);
    }

    return null;
  }

  if (period === "daily") {
    // Fetch daily energy for the past 30 days
    try {
      const data = await portalPost(
        `${session.baseUrl}/panel/chart/getPlantEnergyChart.do`,
        `plantId=${plantId}&year=${year}&month=${month}&type=1`,
        session.secret
      );
      if (data && !isHtmlResponse(data)) {
        const points = data?.datas || data?.back?.datas || data?.back;
        if (Array.isArray(points) && points.length > 0) {
          console.log(`[Growatt Portal] ✓ Daily energy chart: ${points.length} points`);
          return points.map((p: any) => ({
            date: p.date,
            label: p.date,
            generation: parseFloat(p.energy || p.value || p.eDay || "0"),
          })).filter((p: any) => p.generation >= 0);
        }
      }
    } catch (e: any) {
      console.warn(`[Growatt Portal] Daily energy chart failed: ${e.message}`);
    }

    // Alternate: historyByPlant endpoint
    try {
      const data = await portalPost(
        `${session.baseUrl}/panel/getPlantDayEnergyByPlant.do`,
        `plantId=${plantId}&date=${year}-${month}`,
        session.secret
      );
      if (data && !isHtmlResponse(data)) {
        const points = data?.datas || data?.back?.datas || data?.obj;
        if (Array.isArray(points) && points.length > 0) {
          console.log(`[Growatt Portal] ✓ Daily plant energy: ${points.length} points`);
          return points.map((p: any) => ({
            date: p.date,
            label: p.date,
            generation: parseFloat(p.energy || p.value || "0"),
          })).filter((p: any) => p.generation >= 0);
        }
      }
    } catch (e: any) {
      console.warn(`[Growatt Portal] getPlantDayEnergyByPlant failed: ${e.message}`);
    }
  }

  if (period === "monthly") {
    try {
      const data = await portalPost(
        `${session.baseUrl}/panel/chart/getPlantEnergyChart.do`,
        `plantId=${plantId}&year=${year}&type=2`,
        session.secret
      );
      if (data && !isHtmlResponse(data)) {
        const points = data?.datas || data?.back?.datas || data?.back;
        if (Array.isArray(points) && points.length > 0) {
          console.log(`[Growatt Portal] ✓ Monthly energy chart: ${points.length} points`);
          return points.map((p: any) => ({
            date: p.date || p.month,
            label: p.date || p.month,
            generation: parseFloat(p.energy || p.value || p.eMonth || "0"),
          })).filter((p: any) => p.generation >= 0);
        }
      }
    } catch (e: any) {
      console.warn(`[Growatt Portal] Monthly energy chart failed: ${e.message}`);
    }
  }

  if (period === "yearly") {
    try {
      const data = await portalPost(
        `${session.baseUrl}/panel/chart/getPlantEnergyChart.do`,
        `plantId=${plantId}&year=${year}&type=3`,
        session.secret
      );
      if (data && !isHtmlResponse(data)) {
        const points = data?.datas || data?.back?.datas || data?.back;
        if (Array.isArray(points) && points.length > 0) {
          console.log(`[Growatt Portal] ✓ Yearly energy chart: ${points.length} points`);
          return points.map((p: any) => ({
            date: p.date || p.year,
            label: p.date || p.year,
            generation: parseFloat(p.energy || p.value || p.eYear || "0"),
          })).filter((p: any) => p.generation >= 0);
        }
      }
    } catch (e: any) {
      console.warn(`[Growatt Portal] Yearly energy chart failed: ${e.message}`);
    }
  }

  return null;
}

/**
 * Fetches live generation summary for a Growatt account.
 * Only returns REAL data from the official API — never generates fake data.
 * Throws if live data cannot be obtained.
 */
export async function fetchGrowattData(
  usr: string,
  pass: string
): Promise<{ totalGeneration: number; dailyGeneration: number; peakPower: number }> {
  if (!usr || !pass || usr === "mock_user" || pass === "mock_password") {
    throw new Error("Growatt mock credentials detected");
  }

  // 1. Try OpenAPI V1 (token-based accounts)
  const isToken = usr.length > 20 || pass === "api_token" || usr.startsWith("token_");
  if (isToken) {
    try {
      console.log(`[Growatt] Trying OpenAPI V1 with token (len=${usr.length})...`);
      const res = await axios.get(`https://openapi.growatt.com/v1/plant/list?token=${usr}`, { timeout: 12000 });
      const errCode = res.data?.error_code || res.data?.errCode;
      if (errCode) {
        console.warn(`[Growatt] OpenAPI V1 error_code=${errCode} (${res.data?.error_msg || res.data?.errMsg}). Enable OpenAPI access in Growatt portal settings.`);
      } else if (res.data?.data) {
        const plants = res.data.data?.plants || [];
        console.log(`[Growatt] OpenAPI V1 returned ${plants.length} plants`);
        if (plants.length > 0) {
          const plantId = plants[0].plantId;
          const resEnergy = await axios.get(
            `https://openapi.growatt.com/v1/plant/energy?token=${usr}&plantId=${plantId}`,
            { timeout: 12000 }
          );
          const energyData = resEnergy.data?.data || {};
          console.log(`[Growatt] ✓ OpenAPI V1 live data: today=${energyData.todayEnergy}, total=${energyData.totalEnergy}, power=${energyData.currentPower}`);
          return {
            totalGeneration: parseFloat(energyData.totalEnergy || "0"),
            dailyGeneration: parseFloat(energyData.todayEnergy || "0"),
            peakPower: parseFloat(energyData.currentPower || "0"),
          };
        }
      }
    } catch (err: any) {
      console.warn(`[Growatt] OpenAPI V1 failed: ${err.message}`);
    }
  }

  // 2. Portal session auth — derive portal username from token if needed
  let portalUser = usr;
  let portalPass = pass;
  if (pass === "api_token" && usr.length > 8) {
    let parsed: { user: string; pass: string } | null = null;
    
    // Try 24-character match with verification first
    const match = usr.match(/^([\w\s.\-@]{3,16})([\w\s.\-@#$!%*?&]{24})$/i);
    if (match) {
      try {
        const session = await getGrowattSession(match[1], match[2]);
        if (session) {
          parsed = { user: match[1], pass: match[2] };
          console.log(`[Growatt] Extracted verified portal username: "${match[1]}" from token via 24-char match`);
        }
      } catch {
        // ignore and fall through
      }
    }
    
    // Try dynamic splitting with verification
    if (!parsed) {
      const maxUserLen = Math.min(16, usr.length - 6);
      for (let userLen = 3; userLen <= maxUserLen; userLen++) {
        const testUser = usr.slice(0, userLen);
        const testPass = usr.slice(userLen);
        try {
          const session = await getGrowattSession(testUser, testPass);
          if (session) {
            parsed = { user: testUser, pass: testPass };
            console.log(`[Growatt] Successfully auto-split token into user: "${testUser}"`);
            break;
          }
        } catch {
          // ignore failed split
        }
      }
    }
    
    // Last resort fallback
    if (!parsed) {
      const match24 = usr.match(/^([\w\s.\-@]{3,16})([\w\s.\-@#$!%*?&]{24})$/i);
      if (match24) {
        parsed = { user: match24[1], pass: match24[2] };
      } else {
        const fallbackMatch = usr.match(/^([\w\s.\-@]{3,16})([\w\s.\-@#$!%*?&]{20,})$/i);
        if (fallbackMatch) {
          parsed = { user: fallbackMatch[1], pass: fallbackMatch[2] };
        }
      }
    }
    
    if (parsed) {
      portalUser = parsed.user;
      portalPass = parsed.pass;
    }
  }

  try {
    console.log(`[Growatt] Trying portal session for user: "${portalUser}"`);
    const session = await getGrowattSession(portalUser, portalPass);
    const plants = await getPortalPlants(session);

    if (!plants || plants.length === 0) {
      throw new Error("Login succeeded but no plants were found. The session may be invalid or the account has no registered plants.");
    }

    const plantId = String(plants[0].id || plants[0].plantId || "");
    const plantName = plants[0].plantName || plants[0].name || "Unknown";
    console.log(`[Growatt] Portal plant: "${plantName}" (ID: ${plantId})`);

    const metrics = await getPortalDeviceMetrics(session, plantId);
    if (metrics) {
      return {
        totalGeneration: metrics.totalEnergy,
        dailyGeneration: metrics.todayEnergy,
        peakPower: metrics.currentPower,
      };
    }

    // Last resort: use data from plant list response if it has real values
    const plant = plants[0];
    const total = parseFloat(plant.totalEnergy || plant.total || "0");
    const today = parseFloat(plant.todayEnergy || plant.today || "0");
    const power = parseFloat(plant.currentPower || plant.power || "0");
    if (total > 0 || today > 0) {
      console.log(`[Growatt] ✓ Using plant-list metrics: today=${today}, total=${total}, power=${power}`);
      return { totalGeneration: total, dailyGeneration: today, peakPower: power };
    }

    throw new Error("Portal returned plant data but no generation metrics were available.");
  } catch (err: any) {
    throw new Error(`Growatt live data unavailable: ${err.message}`);
  }
}

const mobileSessionCache = new Map<string, CachedSession>();

export async function getGrowattMobileSession(usr: string, pass: string): Promise<CachedSession> {
  const cacheKey = `${usr}:${pass}`;
  const cached = mobileSessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const regions = [
    "https://server.growatt.com",
    "https://server-us.growatt.com",
  ];

  const pwdMd5Raw = crypto.createHash("md5").update(pass).digest("hex");
  let pwdMd5Custom = pwdMd5Raw;
  for (let i = 0; i < pwdMd5Raw.length; i += 2) {
    if (pwdMd5Raw[i] === "0") {
      pwdMd5Custom = pwdMd5Custom.substring(0, i) + "c" + pwdMd5Custom.substring(i + 1);
    }
  }

  for (const baseUrl of regions) {
    try {
      console.log(`[Growatt Mobile Session] Attempting Mobile Login at: ${baseUrl}/newTwoLoginAPI.do`);
      const response = await axios.post(
        `${baseUrl}/newTwoLoginAPI.do`,
        `userName=${encodeURIComponent(usr)}&password=${pwdMd5Custom}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
          },
          timeout: 10000,
        }
      );

      const data = response.data;
      if (data?.back?.success === true || data?.success === true) {
        const userId = data.back?.user?.id || data.user?.id || "portal";
        const plants = data.back?.data || data.data || null;
        const cookieString = extractCookies(response);
        
        console.log(`[Growatt Mobile Session] ✓ Success at ${baseUrl}, userId: ${userId}`);
        const session = {
          token: String(userId),
          secret: cookieString,
          baseUrl,
          expiresAt: Date.now() + 3600 * 1000,
          plants,
        };
        mobileSessionCache.set(cacheKey, session);
        return session;
      } else {
        console.warn(`[Growatt Mobile Session] ✗ Rejected at ${baseUrl}: ${data?.back?.msg || data?.msg || "unknown error"}`);
      }
    } catch (err: any) {
      console.warn(`[Growatt Mobile Session] ✗ Failed at ${baseUrl}: ${err.message}`);
    }
  }

  throw new Error(`Growatt mobile portal login failed. Please check credentials.`);
}

export async function fetchGrowattHistory(
  usr: string,
  pass: string,
  period: "daily" | "monthly" | "yearly" | "realtime",
  passedDeviceSn?: string
): Promise<any[]> {
  if (!usr || !pass || usr === "mock_user" || pass === "mock_password") {
    throw new Error("Growatt mock credentials detected");
  }

  // 1. Try OpenAPI V1 (token-based)
  const isToken = usr.length > 20 || pass === "api_token" || usr.startsWith("token_");
  if (isToken && pass !== "api_token") {
    try {
      console.log(`[Growatt History] Trying OpenAPI V1 for period="${period}"...`);
      const res = await axios.get(`https://openapi.growatt.com/v1/plant/list?token=${usr}`, { timeout: 12000 });
      const plants = res.data?.data?.plants || [];
      if (plants.length > 0) {
        const plantId = plants[0].plantId;
        const todayStr = new Date().toISOString().slice(0, 10);

        if (period === "realtime") {
          const resPower = await axios.get(
            `https://openapi.growatt.com/v1/plant/power?token=${usr}&plantId=${plantId}&date=${todayStr}`,
            { timeout: 12000 }
          );
          const powerList = resPower.data?.data?.powers || [];
          if (powerList.length > 0) {
            console.log(`[Growatt History] ✓ OpenAPI V1 realtime: ${powerList.length} points`);
            return powerList.map((p: any) => ({
              date: p.time?.slice(11, 16) || p.time,
              label: p.time?.slice(11, 16) || p.time,
              power: parseFloat(p.value || "0"),
            }));
          }
        } else {
          const resEnergy = await axios.get(
            `https://openapi.growatt.com/v1/plant/energy/history?token=${usr}&plantId=${plantId}&period=${period}`,
            { timeout: 12000 }
          );
          const historyList = resEnergy.data?.data?.history || [];
          if (historyList.length > 0) {
            console.log(`[Growatt History] ✓ OpenAPI V1 ${period}: ${historyList.length} points`);
            return historyList.map((h: any) => ({
              date: h.date,
              label: h.date,
              generation: parseFloat(h.value || "0"),
            }));
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Growatt History] OpenAPI V1 failed: ${err.message}`);
    }
  }

  // 2. Parse/split if token is combined
  let portalUser = usr;
  let portalPass = pass;
  if (pass === "api_token" && usr.length > 8) {
    let parsed: { user: string; pass: string } | null = null;
    
    // Try 24-character match with verification first
    const match = usr.match(/^([\w\s.\-@]{3,16})([\w\s.\-@#$!%*?&]{24})$/i);
    if (match) {
      try {
        const session = await getGrowattSession(match[1], match[2]);
        if (session) {
          parsed = { user: match[1], pass: match[2] };
          console.log(`[Growatt History] Extracted verified portal username: "${match[1]}" from token via 24-char match`);
        }
      } catch {
        // ignore and fall through
      }
    }
    
    // Try dynamic splitting with verification
    if (!parsed) {
      const maxUserLen = Math.min(16, usr.length - 6);
      for (let userLen = 3; userLen <= maxUserLen; userLen++) {
        const testUser = usr.slice(0, userLen);
        const testPass = usr.slice(userLen);
        try {
          const session = await getGrowattSession(testUser, testPass);
          if (session) {
            parsed = { user: testUser, pass: testPass };
            console.log(`[Growatt History] Successfully auto-split token into user: "${testUser}"`);
            break;
          }
        } catch {
          // ignore failed split
        }
      }
    }
    
    // Last resort fallback
    if (!parsed) {
      const match24 = usr.match(/^([\w\s.\-@]{3,16})([\w\s.\-@#$!%*?&]{24})$/i);
      if (match24) {
        parsed = { user: match24[1], pass: match24[2] };
      } else {
        const fallbackMatch = usr.match(/^([\w\s.\-@]{3,16})([\w\s.\-@#$!%*?&]{20,})$/i);
        if (fallbackMatch) {
          parsed = { user: fallbackMatch[1], pass: fallbackMatch[2] };
        }
      }
    }
    
    if (parsed) {
      portalUser = parsed.user;
      portalPass = parsed.pass;
    }
  }

  // 3. Mobile session logic
  try {
    console.log(`[Growatt History] Fetching via Mobile API for user: "${portalUser}", period: "${period}"`);
    const mobileSession = await getGrowattMobileSession(portalUser, portalPass);

    // Get Plant ID
    let plantId = "";
    try {
      const plantListRes = await axios.get(
        `${mobileSession.baseUrl}/PlantListAPI.do?userId=${mobileSession.token}`,
        {
          headers: {
            "Cookie": mobileSession.secret,
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
          },
          timeout: 10000,
        }
      );
      const plants = plantListRes.data?.back?.data || plantListRes.data?.back || [];
      if (plants.length > 0) {
        plantId = String(plants[0].plantId || plants[0].id || "");
      }
    } catch (e: any) {
      console.warn(`[Growatt History] PlantListAPI.do failed: ${e.message}`);
    }

    if (!plantId) {
      // Fallback: check if we can get plant ID from mobile login plants
      const plants = mobileSession.plants;
      if (plants && plants.length > 0) {
        plantId = String(plants[0].id || plants[0].plantId || "");
      }
    }

    if (!plantId) {
      throw new Error("No plants found on Growatt account.");
    }

    console.log(`[Growatt History] Active Plant ID: ${plantId}`);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const yearMonth = now.toISOString().slice(0, 7);
    const year = String(now.getFullYear());

    if (period === "realtime") {
      // We need deviceSn
      let deviceSn = passedDeviceSn;
      if (!deviceSn) {
        try {
          console.log(`[Growatt History] deviceSn not passed. Discovering via Web Portal...`);
          const webSession = await getGrowattSession(portalUser, portalPass);
          const devs = await getPortalDevices(webSession, plantId);
          if (devs && devs.length > 0) {
            deviceSn = devs[0].deviceSn || devs[0].sn || "";
            console.log(`[Growatt History] Discovered deviceSn: "${deviceSn}"`);
          }
        } catch (e: any) {
          console.warn(`[Growatt History] Failed to discover deviceSn via web portal: ${e.message}`);
        }
      }

      if (!deviceSn) {
        throw new Error("Realtime power curve requires a device serial number (deviceSn), but none was provided or could be dynamically discovered.");
      }

      // Try TLX endpoint first
      let resData: any = null;
      try {
        console.log(`[Growatt History] Querying newTlxApi.do for device "${deviceSn}"...`);
        const res = await axios.get(
          `${mobileSession.baseUrl}/newTlxApi.do?op=getTlxData&id=${deviceSn}&type=1&date=${dateStr}`,
          {
            headers: {
              "Cookie": mobileSession.secret,
              "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
            },
            timeout: 12000,
          }
        );
        if (res.data && res.data.invPacData) {
          resData = res.data;
        }
      } catch (e: any) {
        console.warn(`[Growatt History] newTlxApi.do failed: ${e.message}`);
      }

      // Try standard inverter fallback if TLX failed or empty
      if (!resData) {
        try {
          console.log(`[Growatt History] Querying newInverterAPI.do for device "${deviceSn}"...`);
          const res = await axios.get(
            `${mobileSession.baseUrl}/newInverterAPI.do?op=getInverterData&id=${deviceSn}&type=1&date=${dateStr}`,
            {
              headers: {
                "Cookie": mobileSession.secret,
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
              },
              timeout: 12000,
            }
          );
          if (res.data && (res.data.invPacData || res.data.pacData)) {
            resData = res.data;
          }
        } catch (e: any) {
          console.warn(`[Growatt History] newInverterAPI.do failed: ${e.message}`);
        }
      }

      if (!resData) {
        throw new Error("No real-time power data returned by the inverter API.");
      }

      const pacData = resData.invPacData || resData.pacData || {};
      const points = Object.entries(pacData).map(([timeStr, val]: [string, any]) => {
        const timePart = timeStr.split(" ")[1] || timeStr; // "07:00"
        return {
          date: dateStr,
          label: timePart,
          power: parseFloat(val || "0") / 1000, // W to kW
        };
      });

      points.sort((a, b) => a.label.localeCompare(b.label));
      console.log(`[Growatt History] Realtime: parsed ${points.length} points.`);
      return points;
    }

    if (period === "daily") {
      console.log(`[Growatt History] Querying PlantDetailAPI.do daily (type=2) for month ${yearMonth}...`);
      const res = await axios.get(
        `${mobileSession.baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=2&date=${yearMonth}`,
        {
          headers: {
            "Cookie": mobileSession.secret,
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
          },
          timeout: 12000,
        }
      );

      const dailyData = res.data?.back?.data || {};
      const points = Object.entries(dailyData).map(([dayKey, val]: [string, any]) => {
        const formattedDay = dayKey.padStart(2, "0");
        const dateString = `${yearMonth}-${formattedDay}`;
        const dateObj = new Date(dateString);
        const label = dateObj.toLocaleString("default", { day: "numeric", month: "short" });
        return {
          date: dateString,
          label,
          generation: parseFloat(val || "0"),
        };
      });

      points.sort((a, b) => a.date.localeCompare(b.date));
      console.log(`[Growatt History] Daily: parsed ${points.length} points.`);
      return points;
    }

    if (period === "monthly") {
      console.log(`[Growatt History] Querying PlantDetailAPI.do monthly (type=3) for year ${year}...`);
      const res = await axios.get(
        `${mobileSession.baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=3&date=${year}`,
        {
          headers: {
            "Cookie": mobileSession.secret,
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
          },
          timeout: 12000,
        }
      );

      const monthlyData = res.data?.back?.data || {};
      
      // Sum daily values for the current month to ensure it is accurate
      const currentMonthStr = String(now.getMonth() + 1).padStart(2, "0");
      let currentMonthSum = 0;
      try {
        console.log(`[Growatt History] Summing daily values for current month (${currentMonthStr}) to ensure accuracy...`);
        const dailyRes = await axios.get(
          `${mobileSession.baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=2&date=${year}-${currentMonthStr}`,
          {
            headers: {
              "Cookie": mobileSession.secret,
              "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
            },
            timeout: 10000,
          }
        );
        const dailyDataForMonth = dailyRes.data?.back?.data || {};
        currentMonthSum = Object.values(dailyDataForMonth).reduce<number>((sum: number, val: any) => sum + parseFloat(val || "0"), 0);
      } catch (e: any) {
        console.warn(`[Growatt History] Failed to sum daily values for current month: ${e.message}`);
      }

      if (currentMonthSum > 0) {
        monthlyData[currentMonthStr] = String(Number(currentMonthSum.toFixed(1)));
      }

      const points = Object.entries(monthlyData).map(([monthKey, val]: [string, any]) => {
        const formattedMonth = monthKey.padStart(2, "0");
        const dateString = `${year}-${formattedMonth}-01`;
        const dateObj = new Date(dateString);
        const label = dateObj.toLocaleString("default", { month: "short", year: "2-digit" });
        return {
          date: `${year}-${formattedMonth}`,
          label,
          generation: parseFloat(val || "0"),
        };
      });

      points.sort((a, b) => a.date.localeCompare(b.date));
      console.log(`[Growatt History] Monthly: parsed ${points.length} points.`);
      return points;
    }

    if (period === "yearly") {
      console.log(`[Growatt History] Querying PlantDetailAPI.do yearly (type=4) for year ${year}...`);
      const res = await axios.get(
        `${mobileSession.baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=4&date=${year}`,
        {
          headers: {
            "Cookie": mobileSession.secret,
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
          },
          timeout: 12000,
        }
      );

      const yearlyData = res.data?.back?.data || {};
      const points = Object.entries(yearlyData).map(([yearKey, val]: [string, any]) => {
        return {
          date: `${yearKey}-01-01`,
          label: yearKey,
          generation: parseFloat(val || "0"),
        };
      });

      points.sort((a, b) => a.label.localeCompare(b.label));
      console.log(`[Growatt History] Yearly: parsed ${points.length} points.`);
      return points;
    }

    throw new Error(`Growatt history period "${period}" not supported.`);
  } catch (err: any) {
    throw new Error(`Growatt history unavailable: ${err.message}`);
  }
}
