import "./config/env.js";
import axios from "axios";
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
  console.log("=== PROBING SESSION INITIALIZATION ===");
  const session = await getGrowattSession("R Nagpure", "Swapnila@09");
  console.log("Initial cookies:", session.secret);

  const baseUrl = session.baseUrl;
  let currentCookies = session.secret;

  // Step 1: GET /index to initialize session
  console.log("\n--- Hitting GET /index ---");
  try {
    const resIndex = await axios.get(`${baseUrl}/index`, {
      headers: {
        "Cookie": currentCookies,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    console.log(`GET /index Status: ${resIndex.status}`);
    const sc = extractCookies(resIndex);
    if (sc) {
      console.log(`New cookies from /index:`, sc);
      currentCookies += "; " + sc;
    }
  } catch (e: any) {
    console.log(`GET /index failed:`, e.message);
  }

  // Step 2: Query plant list
  const plants = await getPortalPlants({ ...session, secret: currentCookies });
  if (!plants || plants.length === 0) {
    console.error("No plants found!");
    return;
  }
  const plantId = String(plants[0].id || plants[0].plantId || "");
  console.log("Plant ID:", plantId);

  // Step 3: Try daily chart
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");

  console.log("\n--- Querying POST /panel/chart/getPlantEnergyChart.do ---");
  try {
    const resChart = await axios.post(
      `${baseUrl}/panel/chart/getPlantEnergyChart.do`,
      `plantId=${plantId}&year=${year}&month=${month}&type=1`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cookie": currentCookies,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Referer": `${baseUrl}/index`,
        },
        timeout: 10000,
      }
    );
    const d = resChart.data;
    const isHtml = typeof d === "string" && (d.includes("<!DOCTYPE") || d.includes("<html"));
    console.log(`Status: ${resChart.status}, isHTML: ${isHtml}`);
    console.log("Response Preview:", (typeof d === "string" ? d : JSON.stringify(d)).slice(0, 300));
  } catch (e: any) {
    console.error("Chart query failed:", e.message);
  }
}

probe().catch(console.error);
