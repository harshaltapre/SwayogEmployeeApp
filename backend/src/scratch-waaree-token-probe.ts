/**
 * Test errno 40256 path — /generic/v1/station/list with portalPassword a9a614e2
 * Also try /generic/v1/plant with different endpoint spellings
 */
import axios from "axios";
import crypto from "crypto";

const PORTAL_PASS_HASH = "a9a614e2";
const LOGIN_ID = "ShubhamTyres";
const PASSWORD = "Shubham@2025";
const WAAREE_BASE = "https://digital.waaree.com";

function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}

// The portalPassword field in DB = "a9a614e2"
// MD5 of "Shubham@2025" = d1364d642ec8639ddb012464bf2d93b2
// First 8 chars of MD5 = d1364d64 (not matching a9a614e2)
// MD5 of "a9a614e2" itself?
console.log("MD5 of a9a614e2:", md5("a9a614e2"));
console.log("MD5 of ShubhamTyres:", md5(LOGIN_ID));
// Try: MD5(username + password) combos
console.log("MD5(user+pass):", md5(LOGIN_ID + PASSWORD));
console.log("MD5(pass+user):", md5(PASSWORD + LOGIN_ID));
// Slice combos
const passMd5 = md5(PASSWORD);
console.log("First 8 of MD5(pass):", passMd5.slice(0, 8));
console.log("Last 8 of MD5(pass):", passMd5.slice(-8));

async function probe(label: string, path: string, tokenVal: string, params?: any) {
  console.log(`\n--- ${label} ---`);
  try {
    const timestamp = Date.now();
    const signStr = `${path}\r\n${tokenVal}\r\n${timestamp}`;
    const signature = md5(signStr);
    
    const res = await axios.get(`${WAAREE_BASE}${path}`, {
      params: params || { pageNum: 1, pageSize: 10 },
      headers: {
        "Content-Type": "application/json",
        "token": tokenVal,
        "signature": signature,
        "timestamp": String(timestamp),
        "lang": "en",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Origin": "https://digital.waaree.com",
        "Referer": "https://digital.waaree.com/",
      },
      timeout: 12000,
      validateStatus: () => true,
    });
    console.log(`Status: ${res.status}, errno: ${res.data?.errno}, msg: ${res.data?.msg}`);
    if (res.data?.result) {
      console.log("result:", JSON.stringify(res.data.result, null, 2).slice(0, 500));
    }
  } catch (e: any) {
    console.log(`Error: ${e.message}`);
  }
}

async function main() {
  // Try different tokens + endpoints
  const tokensToTry = [
    { label: "stored expired UUID token", val: "a7e01208-ab52-4729-a4ff-86fb87092ec3" },
    { label: "portalPassword field (a9a614e2)", val: "a9a614e2" },
    { label: "MD5 of password", val: md5(PASSWORD) },
    { label: "MD5 of username", val: md5(LOGIN_ID) },
    { label: "MD5(user:pass)", val: md5(`${LOGIN_ID}:${PASSWORD}`) },
  ];

  const pathsToTry = [
    { label: "station/list", path: "/generic/v1/station/list" },
    { label: "plant/list", path: "/generic/v1/plant/list" },
    { label: "device/list", path: "/generic/v1/device/list" },
  ];

  for (const tok of tokensToTry) {
    for (const p of pathsToTry) {
      await probe(`${tok.label} + ${p.label}`, p.path, tok.val);
    }
  }

  console.log("\n=== DONE ===");
}

main().catch(console.error);
