import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../src/lib/prisma.js";
import { getWaareeLiveTelemetry, getWaareeGraphData } from "../src/lib/waaree.js";

async function main() {
  const customer = await prisma.customer.findFirst({
    where: {
      fullName: { contains: "Shubham" }
    }
  });

  if (!customer) {
    console.error("Customer Shubham Tyres not found in database.");
    return;
  }

  console.log("Found Customer:", customer.fullName);
  console.log("Inverter Brand:", customer.inverterBrand);
  console.log("API Key:", customer.inverterApiKey);
  console.log("Device SN:", customer.inverterDeviceSn);
  console.log("Password:", customer.inverterPassword);
  console.log("System Size (kW):", customer.systemSizeKw);

  const apiKey = (customer.inverterApiKey || "").trim();
  const deviceSn = (customer.inverterDeviceSn || "").trim();
  const loginId = (customer.inverterLoginId || "").trim();
  const password = (customer.inverterPassword || "").trim();

  try {
    console.log("\nCalling getWaareeLiveTelemetry...");
    const telemetry = await getWaareeLiveTelemetry(deviceSn, loginId, password, apiKey);
    console.log("Live Telemetry Result:", JSON.stringify(telemetry, null, 2));

    console.log("\nCalling getWaareeGraphData (realtime)...");
    const graphRealtime = await getWaareeGraphData(deviceSn, loginId, password, "realtime", apiKey);
    console.log("Real-time graph data points:", graphRealtime.timestamps.length);
    console.log("Real-time graph preview (first 5):", graphRealtime.values.slice(0, 5));

    console.log("\nCalling getWaareeGraphData (daily)...");
    const graphDaily = await getWaareeGraphData(deviceSn, loginId, password, "daily", apiKey);
    console.log("Daily graph data points:", graphDaily.timestamps.length);
    console.log("Daily graph preview:", graphDaily.values);
  } catch (err: any) {
    console.error("Error fetching Waaree data:", err.message || err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
