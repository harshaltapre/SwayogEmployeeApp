import "./config/env.js";
import axios from "axios";
import crypto from "crypto";

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

async function probe() {
  console.log("=== PROBING TLX HISTORY ENDPOINTS ===");
  const baseUrl = "https://server.growatt.com";
  const username = "R Nagpure";
  const password = "Swapnila@09";
  const plantId = "10404771";
  const tlxSn = "0SRQC17V24H8015P";

  // Calculate custom MD5 hash
  const pwdMd5Raw = crypto.createHash("md5").update(password).digest("hex");
  let pwdMd5Custom = pwdMd5Raw;
  for (let i = 0; i < pwdMd5Raw.length; i += 2) {
    if (pwdMd5Raw[i] === "0") {
      pwdMd5Custom = pwdMd5Custom.substring(0, i) + "c" + pwdMd5Custom.substring(i + 1);
    }
  }

  let sessionCookie = "";
  try {
    const loginRes = await axios.post(
      `${baseUrl}/newTwoLoginAPI.do`,
      `userName=${encodeURIComponent(username)}&password=${pwdMd5Custom}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
        },
        timeout: 10000,
      }
    );
    sessionCookie = extractCookies(loginRes);
  } catch (e: any) {
    console.error("Login failed:", e.message);
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  const tests = [
    // 1. getTlxData as POST with tlxSn and date parameters
    {
      label: "POST getTlxData (type=1, date=today)",
      url: `${baseUrl}/newTlxApi.do?op=getTlxData`,
      body: `id=${tlxSn}&type=1&date=${dateStr}`,
    },
    // 2. getTlxData (type=0)
    {
      label: "POST getTlxData (type=0, date=today)",
      url: `${baseUrl}/newTlxApi.do?op=getTlxData`,
      body: `id=${tlxSn}&type=0&date=${dateStr}`,
    },
    // 3. getTlxHistory
    {
      label: "POST getTlxHistory",
      url: `${baseUrl}/newTlxApi.do?op=getTlxHistory`,
      body: `id=${tlxSn}&type=1&date=${dateStr}`,
    },
    // 4. getTlxPowerChart
    {
      label: "POST getTlxPowerChart",
      url: `${baseUrl}/newTlxApi.do?op=getTlxPowerChart`,
      body: `id=${tlxSn}&date=${dateStr}`,
    },
    // 5. getTlxEnergyChart
    {
      label: "POST getTlxEnergyChart",
      url: `${baseUrl}/newTlxApi.do?op=getTlxEnergyChart`,
      body: `id=${tlxSn}&type=1&date=${dateStr}`,
    },
  ];

  for (const t of tests) {
    console.log(`\n--- Test: ${t.label} ---`);
    try {
      const res = await axios.post(t.url, t.body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cookie": sessionCookie,
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
        },
        timeout: 10000,
      });
      console.log("Status:", res.status);
      console.log("Response:", JSON.stringify(res.data, null, 2).slice(0, 1000));
    } catch (e: any) {
      console.log("Failed:", e.message);
    }
  }
}

probe().catch(console.error);
