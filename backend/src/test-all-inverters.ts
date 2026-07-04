import "./config/env.js";
import { PrismaClient } from "@prisma/client";
import { fetchShineMonitorData, fetchShineMonitorHistory } from "./lib/shinemonitor.js";
import { fetchGrowattData, fetchGrowattHistory } from "./lib/growatt.js";
import { fetchFoxessData, fetchFoxessHistory } from "./lib/foxess.js";
import { fetchSolarmanData, fetchSolarmanHistory } from "./lib/solarman.js";
import { fetchSolisData, fetchSolisHistory } from "./lib/soliscloud.js";
import { fetchWaareeData, fetchWaareeHistory } from "./lib/waaree.js";

const prisma = new PrismaClient();

function parseBrandAndType(brandStr: string): string {
  const brandLower = (brandStr || "").toLowerCase();
  if (brandLower.includes("(solarman)")) return "Solarman";
  if (brandLower.includes("(solis)")) return "Solis";
  if (brandLower.includes("(shinemonitor)")) return "ShineMonitor";
  if (brandLower.includes("(foxess)")) return "FoxESS";
  if (brandLower.includes("(growatt)") || brandLower.includes("(growattportal)")) return "Growatt";
  if (brandLower.includes("(waaree)")) return "Waaree";
  if (brandLower.includes("(simulation)")) return "Simulation";
  if (brandLower.includes("ksolar") || brandLower.includes("k-solar")) return "ShineMonitor";
  if (brandLower.includes("growatt") || brandLower.includes("grow-att")) return "Growatt";
  if (brandLower.includes("utl") || brandLower.includes("foxess")) return "FoxESS";
  if (brandLower.includes("solarman")) return "Solarman";
  if (brandLower.includes("waaree")) return "Waaree";
  return "Simulation";
}

async function main() {
  console.log("=" .repeat(80));
  console.log("  COMPREHENSIVE INVERTER DATA FETCHING TEST");
  console.log("=" .repeat(80));

  // 1. Get ALL customers from DB
  const allCustomers = await prisma.customer.findMany({
    select: {
      id: true,
      fullName: true,
      inverterBrand: true,
      inverterLoginId: true,
      inverterPassword: true,
      inverterApiKey: true,
      inverterDeviceSn: true,
      systemSizeKw: true,
    },
  });

  console.log(`\nTotal customers in DB: ${allCustomers.length}`);

  // Group by brand type
  const brandGroups: Record<string, typeof allCustomers> = {};
  for (const c of allCustomers) {
    const brand = parseBrandAndType(c.inverterBrand || "");
    if (!brandGroups[brand]) brandGroups[brand] = [];
    brandGroups[brand].push(c);
  }

  console.log("\n--- Customer Distribution by Connection Type ---");
  for (const [brand, custs] of Object.entries(brandGroups)) {
    console.log(`  ${brand}: ${custs.length} customers`);
    for (const c of custs) {
      const hasLogin = !!c.inverterLoginId && c.inverterLoginId.trim() !== "";
      const hasPass = !!c.inverterPassword && c.inverterPassword.trim() !== "" && c.inverterPassword !== "api_token";
      const hasApiKey = !!c.inverterApiKey && c.inverterApiKey.trim() !== "" && c.inverterApiKey !== "null";
      const hasSn = !!c.inverterDeviceSn && c.inverterDeviceSn.trim() !== "" && c.inverterDeviceSn !== "null";
      const credStatus: string[] = [];
      if (hasLogin) credStatus.push("login");
      if (hasPass) credStatus.push("pass");
      if (hasApiKey) credStatus.push("apiKey");
      if (hasSn) credStatus.push("sn");
      console.log(`    [${c.id}] ${c.fullName} | brand="${c.inverterBrand}" | creds: ${credStatus.length > 0 ? credStatus.join("+") : "NONE"}`);
    }
  }

  // 2. Test each brand that has real API connections
  console.log("\n" + "=" .repeat(80));
  console.log("  TESTING LIVE DATA FETCH FOR EACH BRAND");
  console.log("=" .repeat(80));

  const results: Array<{
    customerId: number;
    name: string;
    brand: string;
    connectionType: string;
    liveDataOk: boolean;
    liveDataMsg: string;
    realtimeOk: boolean;
    realtimeMsg: string;
    dailyOk: boolean;
    dailyMsg: string;
    monthlyOk: boolean;
    monthlyMsg: string;
  }> = [];

  // Test all customers with credentials
  for (const c of allCustomers) {
    const connectionType = parseBrandAndType(c.inverterBrand || "");
    const hasLogin = !!c.inverterLoginId && c.inverterLoginId.trim() !== "";
    const hasPass = !!c.inverterPassword && c.inverterPassword.trim() !== "" && c.inverterPassword !== "api_token";
    const hasApiKey = !!c.inverterApiKey && c.inverterApiKey.trim() !== "" && c.inverterApiKey !== "null";

    // Skip customers without any credentials
    if (connectionType === "Simulation" || (!hasLogin && !hasPass && !hasApiKey)) continue;

    const result: typeof results[0] = {
      customerId: c.id,
      name: c.fullName,
      brand: c.inverterBrand || "",
      connectionType,
      liveDataOk: false,
      liveDataMsg: "",
      realtimeOk: false,
      realtimeMsg: "",
      dailyOk: false,
      dailyMsg: "",
      monthlyOk: false,
      monthlyMsg: "",
    };

    console.log(`\n--- [${c.id}] ${c.fullName} | ${connectionType} ---`);

    // Test Live Data
    try {
      if (connectionType === "ShineMonitor" && hasLogin && hasPass) {
        const data = await fetchShineMonitorData(c.inverterLoginId!, c.inverterPassword!);
        result.liveDataOk = true;
        result.liveDataMsg = `today=${data.dailyGeneration}, total=${data.totalGeneration}, power=${data.peakPower}`;
      } else if (connectionType === "Growatt" && hasLogin && hasPass) {
        const data = await fetchGrowattData(c.inverterLoginId!, c.inverterPassword!);
        result.liveDataOk = true;
        result.liveDataMsg = `today=${data.dailyGeneration}, total=${data.totalGeneration}, power=${data.peakPower}`;
      } else if (connectionType === "FoxESS" && hasApiKey) {
        const data = await fetchFoxessData(c.inverterApiKey!, c.inverterDeviceSn || undefined);
        result.liveDataOk = true;
        result.liveDataMsg = `today=${data.dailyGeneration}, total=${data.totalGeneration}, power=${data.peakPower}`;
      } else if (connectionType === "Solarman" && hasApiKey && hasPass) {
        const creds = {
          appId: c.inverterApiKey!,
          appSecret: c.inverterPassword!,
          email: c.inverterLoginId || "",
          password: c.inverterDeviceSn || "",
        };
        const data = await fetchSolarmanData(creds);
        result.liveDataOk = true;
        result.liveDataMsg = `today=${data.dailyGeneration}, total=${data.totalGeneration}, power=${data.peakPower}`;
      } else if (connectionType === "Solis" && hasApiKey && hasPass) {
        const data = await fetchSolisData(c.inverterApiKey!, c.inverterPassword!, c.inverterLoginId || undefined);
        result.liveDataOk = true;
        result.liveDataMsg = `today=${data.dailyGeneration}, total=${data.totalGeneration}, power=${data.peakPower}`;
      } else if (connectionType === "Waaree") {
        const data = await fetchWaareeData(c.inverterApiKey || "", c.inverterDeviceSn || "", c.inverterLoginId || undefined, c.inverterPassword || undefined);
        result.liveDataOk = true;
        result.liveDataMsg = `today=${data.dailyGeneration}, total=${data.totalGeneration}, power=${data.peakPower} (simulated=${data.isSimulated}, source=${data.liveSource})`;
      } else {
        result.liveDataMsg = "Insufficient credentials for this connection type";
      }
    } catch (e: any) {
      result.liveDataMsg = e.message?.slice(0, 120) || "Unknown error";
    }
    console.log(`  Live Data: ${result.liveDataOk ? "✓" : "✗"} ${result.liveDataMsg}`);

    // Test Real-time History
    try {
      if (connectionType === "ShineMonitor" && hasLogin && hasPass) {
        const hist = await fetchShineMonitorHistory(c.inverterLoginId!, c.inverterPassword!, "realtime");
        result.realtimeOk = hist.length > 0;
        result.realtimeMsg = `${hist.length} data points`;
      } else if (connectionType === "Growatt" && hasLogin && hasPass) {
        const hist = await fetchGrowattHistory(c.inverterLoginId!, c.inverterPassword!, "realtime", c.inverterDeviceSn || undefined);
        result.realtimeOk = hist.length > 0;
        result.realtimeMsg = `${hist.length} data points`;
      } else if (connectionType === "FoxESS" && hasApiKey) {
        const hist = await fetchFoxessHistory(c.inverterApiKey!, c.inverterDeviceSn || undefined, "realtime");
        result.realtimeOk = hist.length > 0;
        result.realtimeMsg = `${hist.length} data points`;
      } else if (connectionType === "Solarman" && hasApiKey && hasPass) {
        const creds = {
          appId: c.inverterApiKey!,
          appSecret: c.inverterPassword!,
          email: c.inverterLoginId || "",
          password: c.inverterDeviceSn || "",
        };
        const hist = await fetchSolarmanHistory(creds, "realtime");
        result.realtimeOk = hist.length > 0;
        result.realtimeMsg = `${hist.length} data points`;
      } else if (connectionType === "Solis" && hasApiKey && hasPass) {
        const hist = await fetchSolisHistory(c.inverterApiKey!, c.inverterPassword!, "realtime", c.inverterLoginId || undefined);
        result.realtimeOk = hist.length > 0;
        result.realtimeMsg = `${hist.length} data points`;
      } else if (connectionType === "Waaree") {
        const hist = await fetchWaareeHistory(c.inverterApiKey || "", c.inverterDeviceSn || "", "realtime", c.inverterLoginId || undefined, c.inverterPassword || undefined);
        result.realtimeOk = hist.length > 0;
        result.realtimeMsg = `${hist.length} data points`;
      } else {
        result.realtimeMsg = "Insufficient credentials";
      }
    } catch (e: any) {
      result.realtimeMsg = e.message?.slice(0, 120) || "Unknown error";
    }
    console.log(`  Realtime:  ${result.realtimeOk ? "✓" : "✗"} ${result.realtimeMsg}`);

    // Test Daily History
    try {
      if (connectionType === "ShineMonitor" && hasLogin && hasPass) {
        const hist = await fetchShineMonitorHistory(c.inverterLoginId!, c.inverterPassword!, "daily");
        result.dailyOk = hist.length > 0;
        result.dailyMsg = `${hist.length} data points`;
      } else if (connectionType === "Growatt" && hasLogin && hasPass) {
        const hist = await fetchGrowattHistory(c.inverterLoginId!, c.inverterPassword!, "daily", c.inverterDeviceSn || undefined);
        result.dailyOk = hist.length > 0;
        result.dailyMsg = `${hist.length} data points`;
      } else if (connectionType === "FoxESS" && hasApiKey) {
        const hist = await fetchFoxessHistory(c.inverterApiKey!, c.inverterDeviceSn || undefined, "daily");
        result.dailyOk = hist.length > 0;
        result.dailyMsg = `${hist.length} data points`;
      } else if (connectionType === "Solarman" && hasApiKey && hasPass) {
        const creds = {
          appId: c.inverterApiKey!,
          appSecret: c.inverterPassword!,
          email: c.inverterLoginId || "",
          password: c.inverterDeviceSn || "",
        };
        const hist = await fetchSolarmanHistory(creds, "daily");
        result.dailyOk = hist.length > 0;
        result.dailyMsg = `${hist.length} data points`;
      } else if (connectionType === "Solis" && hasApiKey && hasPass) {
        const hist = await fetchSolisHistory(c.inverterApiKey!, c.inverterPassword!, "daily", c.inverterLoginId || undefined);
        result.dailyOk = hist.length > 0;
        result.dailyMsg = `${hist.length} data points`;
      } else if (connectionType === "Waaree") {
        const hist = await fetchWaareeHistory(c.inverterApiKey || "", c.inverterDeviceSn || "", "daily", c.inverterLoginId || undefined, c.inverterPassword || undefined);
        result.dailyOk = hist.length > 0;
        result.dailyMsg = `${hist.length} data points`;
      } else {
        result.dailyMsg = "Insufficient credentials";
      }
    } catch (e: any) {
      result.dailyMsg = e.message?.slice(0, 120) || "Unknown error";
    }
    console.log(`  Daily:     ${result.dailyOk ? "✓" : "✗"} ${result.dailyMsg}`);

    // Test Monthly History
    try {
      if (connectionType === "ShineMonitor" && hasLogin && hasPass) {
        const hist = await fetchShineMonitorHistory(c.inverterLoginId!, c.inverterPassword!, "monthly");
        result.monthlyOk = hist.length > 0;
        result.monthlyMsg = `${hist.length} data points`;
      } else if (connectionType === "Growatt" && hasLogin && hasPass) {
        const hist = await fetchGrowattHistory(c.inverterLoginId!, c.inverterPassword!, "monthly", c.inverterDeviceSn || undefined);
        result.monthlyOk = hist.length > 0;
        result.monthlyMsg = `${hist.length} data points`;
      } else if (connectionType === "FoxESS" && hasApiKey) {
        const hist = await fetchFoxessHistory(c.inverterApiKey!, c.inverterDeviceSn || undefined, "monthly");
        result.monthlyOk = hist.length > 0;
        result.monthlyMsg = `${hist.length} data points`;
      } else if (connectionType === "Solarman" && hasApiKey && hasPass) {
        const creds = {
          appId: c.inverterApiKey!,
          appSecret: c.inverterPassword!,
          email: c.inverterLoginId || "",
          password: c.inverterDeviceSn || "",
        };
        const hist = await fetchSolarmanHistory(creds, "monthly");
        result.monthlyOk = hist.length > 0;
        result.monthlyMsg = `${hist.length} data points`;
      } else if (connectionType === "Solis" && hasApiKey && hasPass) {
        const hist = await fetchSolisHistory(c.inverterApiKey!, c.inverterPassword!, "monthly", c.inverterLoginId || undefined);
        result.monthlyOk = hist.length > 0;
        result.monthlyMsg = `${hist.length} data points`;
      } else if (connectionType === "Waaree") {
        const hist = await fetchWaareeHistory(c.inverterApiKey || "", c.inverterDeviceSn || "", "monthly", c.inverterLoginId || undefined, c.inverterPassword || undefined);
        result.monthlyOk = hist.length > 0;
        result.monthlyMsg = `${hist.length} data points`;
      } else {
        result.monthlyMsg = "Insufficient credentials";
      }
    } catch (e: any) {
      result.monthlyMsg = e.message?.slice(0, 120) || "Unknown error";
    }
    console.log(`  Monthly:   ${result.monthlyOk ? "✓" : "✗"} ${result.monthlyMsg}`);

    results.push(result);
  }

  // 3. Summary
  console.log("\n" + "=" .repeat(80));
  console.log("  FINAL RESULTS SUMMARY");
  console.log("=" .repeat(80));

  console.log("\n%-5s %-20s %-15s %-6s %-6s %-6s %-6s".replace(/%(\d+)s/g, (_, n) => " ".repeat(Number(n))));
  console.log(`${"ID".padEnd(5)} ${"Name".padEnd(22)} ${"Connection".padEnd(15)} ${"Live".padEnd(6)} ${"RT".padEnd(6)} ${"Day".padEnd(6)} ${"Mon".padEnd(6)}`);
  console.log("-".repeat(70));

  for (const r of results) {
    console.log(
      `${String(r.customerId).padEnd(5)} ${r.name.slice(0, 20).padEnd(22)} ${r.connectionType.padEnd(15)} ${(r.liveDataOk ? "✓" : "✗").padEnd(6)} ${(r.realtimeOk ? "✓" : "✗").padEnd(6)} ${(r.dailyOk ? "✓" : "✗").padEnd(6)} ${(r.monthlyOk ? "✓" : "✗").padEnd(6)}`
    );
  }

  const totalTests = results.length * 4;
  const passedTests = results.reduce(
    (acc, r) => acc + (r.liveDataOk ? 1 : 0) + (r.realtimeOk ? 1 : 0) + (r.dailyOk ? 1 : 0) + (r.monthlyOk ? 1 : 0),
    0
  );

  console.log(`\nTotal: ${passedTests}/${totalTests} tests passed across ${results.length} customers with credentials.`);

  // Show customers that are on simulation (no real data)
  const simCustomers = allCustomers.filter(c => {
    const ct = parseBrandAndType(c.inverterBrand || "");
    const hasLogin = !!c.inverterLoginId && c.inverterLoginId.trim() !== "";
    const hasPass = !!c.inverterPassword && c.inverterPassword.trim() !== "" && c.inverterPassword !== "api_token";
    const hasApiKey = !!c.inverterApiKey && c.inverterApiKey.trim() !== "" && c.inverterApiKey !== "null";
    return ct === "Simulation" || (!hasLogin && !hasPass && !hasApiKey);
  });
  
  console.log(`\nCustomers on simulation/no credentials: ${simCustomers.length}`);
  for (const c of simCustomers.slice(0, 10)) {
    console.log(`  [${c.id}] ${c.fullName} | brand="${c.inverterBrand || "none"}" | No credentials configured`);
  }
  if (simCustomers.length > 10) console.log(`  ... and ${simCustomers.length - 10} more`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
