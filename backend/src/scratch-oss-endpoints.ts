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

async function testEndpoint(baseUrl: string, endpoint: string, cookie: string, params: Record<string, string> = {}) {
  const url = `${baseUrl}${endpoint}`;
  try {
    const res = await axios.post(
      url,
      new URLSearchParams(params).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cookie": cookie,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 8000,
      }
    );
    console.log(`\nEndpoint: ${endpoint}`);
    console.log(`Status: ${res.status}`);
    const dataStr = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    console.log(`Response length: ${dataStr.length}`);
    if (dataStr.includes("dumpLogin")) {
      console.log(`-> REDIRECTED to login page`);
    } else {
      console.log(`-> SUCCESS! Data:`, dataStr.slice(0, 500));
      if (dataStr.includes("10404771") || dataStr.includes("Nagpure")) {
        console.log(`*** FOUND PLANT ID 10404771 IN THIS RESPONSE! ***`);
      }
    }
  } catch (err: any) {
    console.log(`Endpoint ${endpoint} failed:`, err.message);
  }
}

async function main() {
  const baseUrl = "https://oss.growatt.com";
  const usr = "rjm9984";
  const pass = "lm6t7e69dm9630mniq134341";
  const pwdMd5 = crypto.createHash("md5").update(pass).digest("hex");
  
  console.log(`Logging in to ${baseUrl}...`);
  try {
    const res = await axios.post(
      `${baseUrl}/login`,
      `account=${encodeURIComponent(usr)}&password=${encodeURIComponent(pwdMd5)}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 10000,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      }
    );
    
    const cookie = extractCookies(res);
    console.log("Cookie acquired:", cookie);

    // List of installer endpoints to probe
    const endpoints = [
      "/index/getPlantListTitle",
      "/panel/getPlantListForWeb.do",
      "/panel/getPlantData.do",
      "/index/getDevicesByPlantList",
      "/device/getDevices",
      "/customer/getPlants",
      "/plant/list",
      "/panel/getDevicesByPlant.do",
      "/panel/getDevicesByPlantList.do",
      "/device/getDevicesByPlantList.do",
      "/device/getDevicesByPlant.do"
    ];

    for (const ep of endpoints) {
      await testEndpoint(baseUrl, ep, cookie, { plantId: "10404771", currPage: "1" });
    }

  } catch (err: any) {
    console.error("Login failed:", err.message);
  }
}

main();
