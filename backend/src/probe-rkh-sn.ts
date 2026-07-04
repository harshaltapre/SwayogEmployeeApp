import "./config/env.js";
import axios from "axios";
import crypto from "crypto";
import { getGrowattSession, getPortalPlants } from "./lib/growatt.js";

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
  console.log("=== PROBING DEVICE SN & INVERTER DATA ===");
  const baseUrl = "https://server.growatt.com";
  const username = "R Nagpure";
  const password = "Swapnila@09";

  // Step 1: Web Login & Get Device SN
  const webSession = await getGrowattSession(username, password);
  const plants = await getPortalPlants(webSession);
  if (!plants || plants.length === 0) {
    console.error("No plants found on web session!");
    return;
  }
  const plantId = String(plants[0].id || plants[0].plantId || "");
  console.log("Plant ID:", plantId);

  let deviceSn = "";
  try {
    const resDevs = await axios.post(
      `${baseUrl}/panel/getDevicesByPlantList`,
      `plantId=${plantId}&currPage=1`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cookie": webSession.secret,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );
    const devs = resDevs.data?.back?.data || resDevs.data?.obj?.datas || resDevs.data?.data || [];
    if (devs.length > 0) {
      deviceSn = devs[0].deviceSn || devs[0].sn || "";
      console.log("SUCCESS Found Device SN:", deviceSn);
    } else {
      console.log("No devices found in list!");
    }
  } catch (e: any) {
    console.error("Failed to list devices on web session:", e.message);
  }

  if (!deviceSn) {
    console.error("Cannot proceed without device SN!");
    return;
  }

  // Step 2: Mobile Login
  const pwdMd5Raw = crypto.createHash("md5").update(password).digest("hex");
  let pwdMd5Custom = pwdMd5Raw;
  for (let i = 0; i < pwdMd5Raw.length; i += 2) {
    if (pwdMd5Raw[i] === "0") {
      pwdMd5Custom = pwdMd5Custom.substring(0, i) + "c" + pwdMd5Custom.substring(i + 1);
    }
  }

  let mobileCookie = "";
  let mobileUserId = "";
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
    if (loginRes.data?.back?.success || loginRes.data?.success) {
      mobileCookie = extractCookies(loginRes);
      mobileUserId = String(loginRes.data.back?.user?.id || loginRes.data.user?.id || "");
      console.log("SUCCESS Mobile Login! userId:", mobileUserId);
    } else {
      console.error("Mobile Login rejected!");
      return;
    }
  } catch (e: any) {
    console.error("Mobile Login failed:", e.message);
    return;
  }

  // Step 3: Query newInverterAPI.do?op=getInverterData
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  try {
    const resData = await axios.get(
      `${baseUrl}/newInverterAPI.do?op=getInverterData&id=${deviceSn}&type=1&date=${dateStr}`,
      {
        headers: {
          "Cookie": mobileCookie,
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36",
        },
      }
    );
    console.log("newInverterAPI Status:", resData.status);
    console.log("newInverterAPI Response length:", JSON.stringify(resData.data).length);
    console.log("newInverterAPI Response JSON preview:", JSON.stringify(resData.data, null, 2).slice(0, 800));
  } catch (e: any) {
    console.error("newInverterAPI query failed:", e.message);
  }
}

probe().catch(console.error);
