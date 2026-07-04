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
  console.log("=== PROBING PlantDetailAPI.do type=1 YESTERDAY AND type=4 ===");
  const baseUrl = "https://server.growatt.com";
  const username = "R Nagpure";
  const password = "Swapnila@09";

  // Calculate custom MD5 hash
  const pwdMd5Raw = crypto.createHash("md5").update(password).digest("hex");
  let pwdMd5Custom = pwdMd5Raw;
  for (let i = 0; i < pwdMd5Raw.length; i += 2) {
    if (pwdMd5Raw[i] === "0") {
      pwdMd5Custom = pwdMd5Custom.substring(0, i) + "c" + pwdMd5Custom.substring(i + 1);
    }
  }

  let sessionCookie = "";
  let userId = "";

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
    userId = String(loginRes.data.back?.user?.id || loginRes.data.user?.id || "");
  } catch (e: any) {
    console.error("Login failed:", e.message);
    return;
  }

  // Get Plant List
  let plantId = "";
  try {
    const plantListRes = await axios.get(
      `${baseUrl}/PlantListAPI.do?userId=${userId}`,
      {
        headers: {
          "Cookie": sessionCookie,
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
        },
      }
    );
    const plants = plantListRes.data?.back?.data || plantListRes.data?.back || [];
    plantId = String(plants[0].plantId || plants[0].id || "");
  } catch (e: any) {
    console.error("Plant list failed:", e.message);
    return;
  }

  const tests = [
    // 1. type=1 (hourly) for yesterday
    {
      label: "type=1 (day) with yesterday's date (2026-05-29)",
      url: `${baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=1&date=2026-05-29`,
    },
    // 2. type=4 (yearly) with YYYY
    {
      label: "type=4 (total) with YYYY (2026)",
      url: `${baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=4&date=2026`,
    },
    // 3. type=3 (yearly) with 2025 to verify non-zero monthly values
    {
      label: "type=3 (year) with YYYY (2025)",
      url: `${baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=3&date=2025`,
    },
  ];

  for (const t of tests) {
    console.log(`\n--- Test: ${t.label} ---`);
    try {
      const res = await axios.get(t.url, {
        headers: {
          "Cookie": sessionCookie,
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
        },
        timeout: 10000,
      });

      const d = res.data;
      const isHtml = typeof d === "string" && (d.includes("<!DOCTYPE") || d.includes("<html"));
      console.log(`Status: ${res.status}, isHTML: ${isHtml}`);
      if (!isHtml) {
        console.log("Response JSON:", JSON.stringify(d, null, 2).slice(0, 1000));
      }
    } catch (e: any) {
      console.error("Request failed:", e.message);
    }
  }
}

probe().catch(console.error);
