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
  console.log("=== PROBING MOBILE API ON SERVER.GROWATT.COM ===");
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
  console.log("Custom MD5 Hash:", pwdMd5Custom);

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

    console.log("Login Status:", loginRes.status);
    console.log("Login Response:", JSON.stringify(loginRes.data));
    
    if (loginRes.data?.back?.success || loginRes.data?.success) {
      sessionCookie = extractCookies(loginRes);
      userId = String(loginRes.data.back?.user?.id || loginRes.data.user?.id || "");
      console.log(`✓ Login Success! userId=${userId}, cookies=${sessionCookie}`);
    } else {
      console.error("Login rejected by mobile API!");
      return;
    }
  } catch (e: any) {
    console.error("Login request failed:", e.message);
    return;
  }

  // Step 2: Query PlantListAPI.do
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
    console.log("\nPlant List Status:", plantListRes.status);
    console.log("Plant List Response:", JSON.stringify(plantListRes.data));
    const plants = plantListRes.data?.back?.data || plantListRes.data?.back || [];
    if (plants.length > 0) {
      plantId = String(plants[0].plantId || plants[0].id || "");
      console.log("Found Plant ID:", plantId);
    } else {
      console.error("No plants found in list!");
      return;
    }
  } catch (e: any) {
    console.error("Plant list query failed:", e.message);
    return;
  }

  // Step 3: Query PlantDetailAPI.do
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const yearMonth = now.toISOString().slice(0, 7);

  const tests = [
    {
      label: "Real-time Power Curve (type=0)",
      url: `${baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=0&date=${dateStr}`,
    },
    {
      label: "Daily Generation (type=1)",
      url: `${baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=1&date=${yearMonth}`,
    },
    {
      label: "Monthly Generation (type=2)",
      url: `${baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=2&date=${now.getFullYear()}`,
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
      if (isHtml) {
        console.log("HTML response (redirect/error)");
      } else {
        console.log("JSON response length:", JSON.stringify(d).length);
        console.log("Data preview:", JSON.stringify(d, null, 2).slice(0, 800));
      }
    } catch (e: any) {
      console.error("Request failed:", e.message);
    }
  }
}

probe().catch(console.error);
