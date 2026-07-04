import { getWaareeLiveTelemetry, getWaareeGraphData } from "../src/lib/waaree.js";

async function main() {
  console.log("=== TESTING WAAREE SERVICE ===");
  const testPlantId = "WR-12345-TEST";

  try {
    console.log(`\n1. Fetching live telemetry for plant: ${testPlantId}`);
    const telemetry = await getWaareeLiveTelemetry(testPlantId, "test-user", "test-pass");
    console.log("Live Telemetry Result:", JSON.stringify(telemetry, null, 2));

    console.log(`\n2. Fetching real-time graph data for plant: ${testPlantId}`);
    const graphRealtime = await getWaareeGraphData(testPlantId, "test-user", "test-pass", "realtime");
    console.log(`Real-time data points count: ${graphRealtime.timestamps.length}`);
    console.log("Real-time preview (first 5 points):");
    for (let i = 0; i < Math.min(5, graphRealtime.timestamps.length); i++) {
      console.log(`  [${graphRealtime.timestamps[i]}]: ${graphRealtime.values[i]} kW`);
    }

    console.log(`\n3. Fetching daily graph data for plant: ${testPlantId}`);
    const graphDaily = await getWaareeGraphData(testPlantId, "test-user", "test-pass", "daily");
    console.log(`Daily data points count: ${graphDaily.timestamps.length}`);
    console.log("Daily preview:");
    for (let i = 0; i < graphDaily.timestamps.length; i++) {
      console.log(`  [${graphDaily.timestamps[i]}]: ${graphDaily.values[i]} kWh`);
    }

    console.log("\n✅ Waaree Inverter Service testing passed successfully!");
  } catch (err: any) {
    console.error("❌ Waaree Service testing failed:", err.message || err);
  }
}

main();
