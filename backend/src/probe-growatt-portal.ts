/**
 * Deep probe: Follow the 302 redirects, capture acw_tc challenge cookies,
 * and test all Growatt endpoints that the user confirmed work in browser.
 */
import axios from "axios";
import crypto from "crypto";

const BASE_URL = "https://server.growatt.com";
const PLANT_ID = "10404771";
const TOKEN = "rjm9984lm6t7e69dm9630mniq134341";

async function probeFull() {
  console.log("=== GROWATT DEEP PORTAL PROBE ===\n");

  // Step 1: GET the root page first to collect ALL cookies (incl. acw_tc from Cloudflare)
  console.log("--- Step 1: GET root page to collect initial cookies ---");
  let allCookies = "";
  try {
    const r0 = await axios.get(BASE_URL + "/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
      },
      timeout: 12000,
      maxRedirects: 10,
    });
    const sc = r0.headers["set-cookie"];
    const root_cookies = Array.isArray(sc) ? sc.map((c: string) => c.split(";")[0]).join("; ") : (sc || "");
    console.log(`  GET / → status=${r0.status}, cookies: ${root_cookies.substring(0, 200)}`);
    allCookies = root_cookies;
  } catch (e: any) {
    console.log(`  GET / failed: ${e.message}`);
    if (e.response?.headers?.["set-cookie"]) {
      const sc = e.response.headers["set-cookie"];
      allCookies = Array.isArray(sc) ? sc.map((c: string) => c.split(";")[0]).join("; ") : (sc || "");
      console.log(`  Captured cookies from error: ${allCookies.substring(0, 200)}`);
    }
  }

  // Step 2: GET login page
  console.log("\n--- Step 2: GET /login page ---");
  try {
    const r1 = await axios.get(BASE_URL + "/login", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Cookie": allCookies,
      },
      timeout: 12000,
      maxRedirects: 5,
    });
    const sc = r1.headers["set-cookie"];
    const lc = Array.isArray(sc) ? sc.map((c: string) => c.split(";")[0]).join("; ") : (sc || "");
    console.log(`  GET /login → status=${r1.status}, new cookies: ${lc.substring(0, 200)}`);
    if (lc) allCookies = allCookies ? allCookies + "; " + lc : lc;
  } catch (e: any) {
    console.log(`  GET /login error: ${e.message}`);
  }

  console.log(`\n  All cookies so far: ${allCookies.substring(0, 300)}`);

  // Step 3: POST login with base64 password
  console.log("\n--- Step 3: POST login with base64 password ---");
  let portalUser = "rjm9984";
  let portalPass = "lm6t7e69dm9630mniq134341";
  const match = TOKEN.match(/^([a-z0-9]{3,12})([a-z0-9]{20,})$/);
  if (match) {
    portalUser = match[1];
    portalPass = match[2];
  }
  const pwdMd5 = crypto.createHash("md5").update(portalPass).digest("hex");
  const pwdBase64 = Buffer.from(portalPass).toString("base64");

  let sessionCookies = "";
  
  // Try MD5 login via Mobile API
  for (const [label, usr, pwd, loginUrl, body] of [
    ["MD5-Mobile", portalUser, pwdMd5, `${BASE_URL}/newTwoLoginAPI.do`, `userName=${encodeURIComponent(portalUser)}&password=${pwdMd5}`],
    ["Base64-Web", portalUser, pwdBase64, `${BASE_URL}/login`, `account=${encodeURIComponent(portalUser)}&password=${encodeURIComponent(pwdBase64)}&validateCode=`],
    ["Raw-Web", portalUser, portalPass, `${BASE_URL}/login`, `account=${encodeURIComponent(portalUser)}&password=${encodeURIComponent(portalPass)}&validateCode=`],
  ] as const) {
    try {
      const res = await axios.post(loginUrl, body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Cookie": allCookies,
          "Referer": `${BASE_URL}/login`,
          "Origin": BASE_URL,
        },
        timeout: 10000,
        maxRedirects: 5,
      });
      const sc = res.headers["set-cookie"];
      const nc = Array.isArray(sc) ? sc.map((c: string) => c.split(";")[0]).join("; ") : (sc || "");
      console.log(`  [${label}] status=${res.status}, success=${res.data?.back?.success ?? "N/A"}, new-cookies=${nc.substring(0, 150)}`);
      if (nc) {
        sessionCookies = nc;
        allCookies = allCookies ? allCookies + "; " + nc : nc;
      }
    } catch (e: any) {
      console.log(`  [${label}] error: ${e.message}`);
    }
  }

  console.log(`\n  Final cookies: ${allCookies.substring(0, 300)}`);

  // Step 4: Test all endpoints with the accumulated cookies (including any acw_tc)
  console.log("\n--- Step 4: Portal API calls with all accumulated cookies ---");

  const endpoints = [
    { label: "getPlantData (POST body)", url: `${BASE_URL}/panel/getPlantData`, body: `plantId=${PLANT_ID}` },
    { label: "getPlantData (query string)", url: `${BASE_URL}/panel/getPlantData?plantId=${PLANT_ID}`, body: "" },
    { label: "getDevicesByPlant", url: `${BASE_URL}/panel/getDevicesByPlant`, body: `plantId=${PLANT_ID}` },
    { label: "getDevicesByPlantList", url: `${BASE_URL}/index/getDevicesByPlantList`, body: `plantId=${PLANT_ID}&currPage=1` },
    { label: "getPlantListTitle", url: `${BASE_URL}/index/getPlantListTitle`, body: "" },
    { label: "getPlantListForWeb.do", url: `${BASE_URL}/panel/getPlantListForWeb.do`, body: "currPage=1" },
    { label: "getPlantEnergyChart (daily)", url: `${BASE_URL}/panel/chart/getPlantEnergyChart.do`, body: `plantId=${PLANT_ID}&year=2025&month=05&type=1` },
    { label: "getMixTotalData", url: `${BASE_URL}/mix/getMixTotalData`, body: `plantId=${PLANT_ID}` },
    { label: "getNewPlantData", url: `${BASE_URL}/newTwoPlantAPI.do`, body: `plantId=${PLANT_ID}` },
  ];

  for (const ep of endpoints) {
    try {
      const res = await axios.post(ep.url, ep.body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cookie": allCookies,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Referer": `${BASE_URL}/index`,
          "Origin": BASE_URL,
        },
        timeout: 12000,
        maxRedirects: 0,
      });
      const d = res.data;
      const isHtml = typeof d === "string" && (d.includes("<!DOCTYPE") || d.includes("<html"));
      const preview = (typeof d === "string" ? d : JSON.stringify(d)).slice(0, 250).replace(/\s+/g, " ");
      console.log(`\n  [${ep.label}] status=${res.status}, isHTML=${isHtml}`);
      console.log(`    → ${preview}`);
    } catch (e: any) {
      const sc = e.response?.status;
      const body = e.response?.data;
      const isHtml = typeof body === "string" && (body.includes("<!DOCTYPE") || body.includes("<html"));
      console.log(`\n  [${ep.label}] ERROR status=${sc}, isHTML=${isHtml}: ${e.message}`);
      if (body) console.log(`    → ${(typeof body === "string" ? body : JSON.stringify(body)).slice(0, 200)}`);
    }
  }

  console.log("\n\n=== DONE ===");
}

probeFull().catch(console.error);
