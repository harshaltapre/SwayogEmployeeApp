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
  console.log("=== PROBING INVERTER DEVICES AND DATA ===");
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

  console.log("Plant ID:", plantId);

  // Step 1: Get Devices List
  let deviceSn = "";
  try {
    const resDevs = await axios.post(
      `${baseUrl}/panel/getDevicesByPlantList`,
      `plantId=${plantId}&currPage=1`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cookie": sessionCookie,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );
    console.log("Devices Response:", JSON.stringify(resDevs.data, null, 2).slice(0, 1000));
    const devs = resDevs.data?.back?.data || resDevs.data?.obj?.datas || resDevs.data?.data || [];
    if (devs.length > 0) {
      deviceSn = devs[0].deviceSn || devs[0].sn || "";
      console.log("Found Device SN:", deviceSn);
    }
  } catch (e: any) {
    console.error("Failed to list devices:", e.message);
  }

  if (!deviceSn) {
    console.error("Could not find any device SN to test inverter data!");
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  // Step 2: Query newInverterAPI.do?op=getInverterData
  console.log("\n--- Testing newInverterAPI.do?op=getInverterData ---");
  try {
    const resData = await axios.get(
      `${baseUrl}/newInverterAPI.do?op=getInverterData&id=${deviceSn}&type=1&date=${dateStr}`,
      {
        headers: {
          "Cookie": sessionCookie,
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
        },
      }
    );
    console.log("newInverterAPI Response length:", JSON.stringify(resData.data).length);
    console.log("newInverterAPI Response Preview:", JSON.stringify(resData.data, null, 2).slice(0, 800));
  } catch (e: any) {
    console.error("newInverterAPI failed:", e.message);
  }
}

probe().catch(console.error);
