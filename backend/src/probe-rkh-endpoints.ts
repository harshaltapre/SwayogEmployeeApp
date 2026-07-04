import "./config/env.js";
import axios from "axios";
import { getGrowattSession, getPortalPlants } from "./lib/growatt.js";

async function probe() {
  console.log("=== PROBING HISTORY ENDPOINTS FOR R NAGPURE ===");
  const session = await getGrowattSession("R Nagpure", "Swapnila@09");
  console.log("Session baseUrl:", session.baseUrl);
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
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const tests = [
    // 1. Post to getPlantPowerChart.do
    {
      label: "POST getPlantPowerChart.do",
      method: "POST" as const,
      url: `${session.baseUrl}/panel/chart/getPlantPowerChart.do`,
      body: `plantId=${plantId}&date=${dateStr}`,
    },
    // 2. GET to getPlantPowerChart.do
    {
      label: "GET getPlantPowerChart.do",
      method: "GET" as const,
      url: `${session.baseUrl}/panel/chart/getPlantPowerChart.do?plantId=${plantId}&date=${dateStr}`,
      body: "",
    },
    // 3. Post to getPlantEnergyChart.do (daily)
    {
      label: "POST getPlantEnergyChart.do (daily)",
      method: "POST" as const,
      url: `${session.baseUrl}/panel/chart/getPlantEnergyChart.do`,
      body: `plantId=${plantId}&year=${year}&month=${month}&type=1`,
    },
    // 4. GET to getPlantEnergyChart.do (daily)
    {
      label: "GET getPlantEnergyChart.do (daily)",
      method: "GET" as const,
      url: `${session.baseUrl}/panel/chart/getPlantEnergyChart.do?plantId=${plantId}&year=${year}&month=${month}&type=1`,
      body: "",
    },
    // 5. POST to getPlantDayEnergyByPlant.do
    {
      label: "POST getPlantDayEnergyByPlant.do",
      method: "POST" as const,
      url: `${session.baseUrl}/panel/getPlantDayEnergyByPlant.do`,
      body: `plantId=${plantId}&date=${year}-${month}`,
    },
    // 6. GET to getPlantDayEnergyByPlant.do
    {
      label: "GET getPlantDayEnergyByPlant.do",
      method: "GET" as const,
      url: `${session.baseUrl}/panel/getPlantDayEnergyByPlant.do?plantId=${plantId}&date=${year}-${month}`,
      body: "",
    },
    // 7. POST to compare/getDevicesInverterDataForBack
    {
      label: "POST getDevicesInverterDataForBack",
      method: "POST" as const,
      url: `${session.baseUrl}/energy/compare/getDevicesInverterDataForBack`,
      body: `type=1&date=${dateStr}&plantId=${plantId}`,
    },
  ];

  for (const t of tests) {
    console.log(`\n--- Test: ${t.label} ---`);
    try {
      const res = await axios({
        method: t.method,
        url: t.url,
        data: t.method === "POST" ? t.body : undefined,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Cookie": session.secret,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Referer": `${session.baseUrl}/index`,
        },
        timeout: 10000,
      });

      const d = res.data;
      const isHtml = typeof d === "string" && (d.includes("<!DOCTYPE") || d.includes("<html"));
      const preview = (typeof d === "string" ? d : JSON.stringify(d)).slice(0, 300);
      console.log(`Status: ${res.status}, isHTML: ${isHtml}`);
      console.log(`Response:`, preview);
    } catch (e: any) {
      console.error(`Error:`, e.message);
      if (e.response) {
        console.log(`Error Response status:`, e.response.status);
        console.log(`Error Response body:`, String(e.response.data).slice(0, 200));
      }
    }
  }
}

probe().catch(console.error);
