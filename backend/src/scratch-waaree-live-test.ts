/**
 * Live test of Waaree customer 116 (Shubham Tyres)
 * Tests all available credential combinations
 */
import axios from "axios";
import crypto from "crypto";

const TOKEN = "a7e01208-ab52-4729-a4ff-86fb87092ec3";
const PLANT_ID_RAW = "750a9b0ch881ff413ca8332j6c3b3875e8a5";
const LOGIN_ID = "ShubhamTyres";
const PASSWORD = "Shubham@2025";
const PORTAL_PASS_HASH = "a9a614e2";
const WAAREE_BASE = "https://digital.waaree.com";

function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}

// Clean the obfuscated plant ID to UUID form
function cleanPlantId(plantId: string): string {
  const clean = plantId.trim();
  if (clean.length === 36 && /^[a-f0-9]{8}h[a-f0-9]{4}f[a-f0-9]{4}a[a-f0-9]{4}j[a-f0-9]{12}$/i.test(clean)) {
    return clean.slice(0, 8) + "-" + clean.slice(9, 13) + "-" + clean.slice(14, 18) + "-" + clean.slice(19, 23) + "-" + clean.slice(24);
  }
  return clean;
}

function createSignature(path: string, token: string, timestamp: number): string {
  const signStr = `${path}\r\n${token}\r\n${timestamp}`;
  return md5(signStr);
}

const PLANT_ID_CLEAN = cleanPlantId(PLANT_ID_RAW);
console.log(`Plant ID raw: ${PLANT_ID_RAW}`);
console.log(`Plant ID clean (UUID): ${PLANT_ID_CLEAN}`);
console.log(`MD5 of password: ${md5(PASSWORD)}`);
console.log(`portalPassword stored: ${PORTAL_PASS_HASH}\n`);

async function test1_WaareeGenericPlantFlow() {
  console.log("=== TEST 1: Waaree Generic /generic/v1/plant/flow ===");
  try {
    const path = "/generic/v1/plant/flow";
    const timestamp = Date.now();
    const signature = createSignature(path, TOKEN, timestamp);
    const res = await axios.get(`${WAAREE_BASE}${path}`, {
      params: { plantId: PLANT_ID_CLEAN },
      headers: {
        "Content-Type": "application/json",
        "token": TOKEN,
        "signature": signature,
        "timestamp": String(timestamp),
        "lang": "en",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });
    console.log("Response:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.log(`Error: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
  }
}

async function test2_WaareeLogin() {
  console.log("\n=== TEST 2: Waaree Login /c/v0/user/login (MD5 password) ===");
  try {
    const passwordHash = md5(PASSWORD);
    console.log(`Using MD5 password: ${passwordHash}`);
    const res = await axios.post(`${WAAREE_BASE}/c/v0/user/login`, 
      { username: LOGIN_ID, password: passwordHash },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "Origin": "https://digital.waaree.com",
          "Referer": "https://digital.waaree.com/",
        },
        timeout: 15000,
      }
    );
    console.log("Login Response:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.log(`Login Error: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
  }
}

async function test3_WaareeLoginStoredHash() {
  console.log("\n=== TEST 3: Waaree Login with stored portalPassword hash ===");
  try {
    const res = await axios.post(`${WAAREE_BASE}/c/v0/user/login`, 
      { username: LOGIN_ID, password: PORTAL_PASS_HASH },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "Origin": "https://digital.waaree.com",
          "Referer": "https://digital.waaree.com/",
        },
        timeout: 15000,
      }
    );
    console.log("Login Response:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.log(`Login Error: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
  }
}

async function test4_WaareeGenericWithRawPlantId() {
  console.log("\n=== TEST 4: Waaree Generic with RAW plant ID ===");
  try {
    const path = "/generic/v1/plant/flow";
    const timestamp = Date.now();
    const signature = createSignature(path, TOKEN, timestamp);
    const res = await axios.get(`${WAAREE_BASE}${path}`, {
      params: { plantId: PLANT_ID_RAW },
      headers: {
        "Content-Type": "application/json",
        "token": TOKEN,
        "signature": signature,
        "timestamp": String(timestamp),
        "lang": "en",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });
    console.log("Response:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.log(`Error: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
  }
}

async function test5_SolaxWithToken() {
  console.log("\n=== TEST 5: Solax Cloud API (treating inverterApiKey as Solax tokenId) ===");
  try {
    const res = await axios.get("https://www.solaxcloud.com/proxyApp/proxy/api/getRealtimeInfo.do", {
      params: { tokenId: TOKEN, sn: PLANT_ID_RAW },
      timeout: 15000,
    });
    console.log("Response:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.log(`Error: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
  }
}

async function test6_SolaxWithCleanSn() {
  console.log("\n=== TEST 6: Solax Cloud API with cleaned UUID as SN ===");
  try {
    const res = await axios.get("https://www.solaxcloud.com/proxyApp/proxy/api/getRealtimeInfo.do", {
      params: { tokenId: TOKEN, sn: PLANT_ID_CLEAN },
      timeout: 15000,
    });
    console.log("Response:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.log(`Error: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
  }
}

async function test7_WaareeStationList() {
  console.log("\n=== TEST 7: Waaree /generic/v1/station/list ===");
  try {
    const path = "/generic/v1/station/list";
    const timestamp = Date.now();
    const signature = createSignature(path, TOKEN, timestamp);
    const res = await axios.get(`${WAAREE_BASE}${path}`, {
      params: { pageNum: 1, pageSize: 10 },
      headers: {
        "Content-Type": "application/json",
        "token": TOKEN,
        "signature": signature,
        "timestamp": String(timestamp),
        "lang": "en",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });
    console.log("Response:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.log(`Error: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
  }
}

async function main() {
  await test1_WaareeGenericPlantFlow();
  await test2_WaareeLogin();
  await test3_WaareeLoginStoredHash();
  await test4_WaareeGenericWithRawPlantId();
  await test5_SolaxWithToken();
  await test6_SolaxWithCleanSn();
  await test7_WaareeStationList();
  console.log("\n=== ALL TESTS DONE ===");
}

main().catch(console.error);
