import "./config/env.js";
import axios from "axios";
import { getGrowattSession, getPortalPlants } from "./lib/growatt.js";

async function probe() {
  console.log("=== PROBING PlantDetailAPI.do ===");
  const session = await getGrowattSession("R Nagpure", "Swapnila@09");
  console.log("Session cookie:", session.secret);

  const plants = await getPortalPlants(session);
  if (!plants || plants.length === 0) {
    console.error("No plants found!");
    return;
  }
  const plantId = String(plants[0].id || plants[0].plantId || "");
  console.log("Plant ID:", plantId);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const yearMonth = now.toISOString().slice(0, 7); // YYYY-MM

  // Timespans: 0 = hour (realtime power curve), 1 = day (daily generation of current month), 2 = month (monthly generation of current year)
  const tests = [
    {
      label: "Real-time (type=0)",
      url: `${session.baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=0&date=${dateStr}`,
    },
    {
      label: "Daily (type=1)",
      url: `${session.baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=1&date=${yearMonth}`,
    },
    {
      label: "Monthly (type=2)",
      url: `${session.baseUrl}/PlantDetailAPI.do?plantId=${plantId}&type=2&date=${now.getFullYear()}`,
    },
  ];

  for (const t of tests) {
    console.log(`\n--- Test: ${t.label} ---`);
    try {
      const res = await axios.get(t.url, {
        headers: {
          "Cookie": session.secret,
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
        console.log("Data preview:", JSON.stringify(d, null, 2).slice(0, 600));
      }
    } catch (e: any) {
      console.error("Request failed:", e.message);
    }
  }
}

probe().catch(console.error);
