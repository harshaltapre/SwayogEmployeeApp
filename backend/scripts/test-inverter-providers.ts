#!/usr/bin/env tsx
/**
 * Unified Inverter Provider Test Script
 * 
 * Tests all inverter telemetry providers using the unified factory pattern.
 * Run with: npx tsx scripts/test-inverter-providers.ts
 */

import { InverterProviderFactory, ProviderCredentials, HistoryPeriod } from "../src/lib/inverter-provider-factory.js";

// Test configurations for each provider
const testConfigs: ProviderCredentials[] = [
  {
    provider: "ShineMonitor",
    inverterLoginId: process.env.SHINEMONITOR_USER || "test_user",
    inverterPassword: process.env.SHINEMONITOR_PASS || "test_pass",
  },
  {
    provider: "Growatt",
    inverterLoginId: process.env.GROWATT_USER || "test_user",
    inverterPassword: process.env.GROWATT_PASS || "test_pass",
    inverterDeviceSn: process.env.GROWATT_DEVICE_SN,
  },
  {
    provider: "FoxESS",
    inverterApiKey: process.env.FOXESS_API_KEY || "test_key",
    inverterDeviceSn: process.env.FOXESS_DEVICE_SN,
    inverterPassword: process.env.FOXESS_PASSWORD,
  },
  {
    provider: "Solarman",
    appId: process.env.SOLARMAN_APP_ID || "test_appId",
    appSecret: process.env.SOLARMAN_APP_SECRET || "test_secret",
    inverterLoginId: process.env.SOLARMAN_EMAIL || "test@example.com",
    inverterPassword: process.env.SOLARMAN_PASSWORD || "test_pass",
    inverterDeviceSn: process.env.SOLARMAN_DEVICE_SN,
  },
  {
    provider: "Solis",
    keyId: process.env.SOLIS_KEY_ID || "test_keyId",
    keySecret: process.env.SOLIS_KEY_SECRET || "test_secret",
    inverterLoginId: process.env.SOLIS_PLANT_ID,
  },
  {
    provider: "Waaree",
    inverterApiKey: process.env.WAAREE_API_KEY || "test_key",
    inverterDeviceSn: process.env.WAAREE_PLANT_ID || "test_plantId",
    inverterLoginId: process.env.WAAREE_USERNAME,
    inverterPassword: process.env.WAAREE_PASSWORD,
  },
  {
    provider: "Sungrow",
    inverterLoginId: process.env.SUNGROW_USERNAME || "test_user",
    inverterPassword: process.env.SUNGROW_PASSWORD || "test_pass",
    appKey: process.env.SUNGROW_APP_KEY || "test_appKey",
    plantId: process.env.SUNGROW_PLANT_ID,
    deviceId: process.env.SUNGROW_DEVICE_ID,
    region: process.env.SUNGROW_REGION,
  },
  {
    provider: "Simulation",
  },
];

/**
 * Test a single provider for real-time telemetry
 */
async function testProviderTelemetry(config: ProviderCredentials): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing ${config.provider} Real-Time Telemetry`);
  console.log("=".repeat(60));

  try {
    const telemetry = await InverterProviderFactory.fetchTelemetry(config);
    console.log(`✓ ${config.provider} telemetry fetched successfully:`);
    console.log(`  - Total Generation: ${telemetry.totalGeneration} kWh`);
    console.log(`  - Daily Generation: ${telemetry.dailyGeneration} kWh`);
    console.log(`  - Peak Power: ${telemetry.peakPower} kW`);
  } catch (error: any) {
    console.error(`✗ ${config.provider} telemetry failed:`, error.message);
    if (process.env.VERBOSE === "true") {
      console.error(error);
    }
  }
}

/**
 * Test a single provider for historical data
 */
async function testProviderHistory(config: ProviderCredentials, period: HistoryPeriod): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing ${config.provider} History (${period})`);
  console.log("=".repeat(60));

  try {
    const history = await InverterProviderFactory.fetchHistory(config, period);
    console.log(`✓ ${config.provider} ${period} history fetched successfully:`);
    console.log(`  - Data points: ${history.length}`);
    if (history.length > 0) {
      console.log(`  - First entry:`, history[0]);
      console.log(`  - Last entry:`, history[history.length - 1]);
    }
  } catch (error: any) {
    console.error(`✗ ${config.provider} ${period} history failed:`, error.message);
    if (process.env.VERBOSE === "true") {
      console.error(error);
    }
  }
}

/**
 * Test provider parsing from brand strings
 */
function testProviderParsing(): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log("Testing Provider Brand Parsing");
  console.log("=".repeat(60));

  const testBrands = [
    "K-Solar (ShineMonitor)",
    "Growatt (GrowattPortal)",
    "UTL (FoxESS)",
    "Panasonic (Solarman)",
    "Solis (SolisCloud)",
    "Waaree (SolaxCloud)",
    "Sungrow (iSolarCloud)",
    "Unknown Brand",
  ];

  for (const brand of testBrands) {
    const provider = InverterProviderFactory.parseProvider(brand);
    console.log(`  "${brand}" → ${provider}`);
  }
}

/**
 * Main test runner
 */
async function main(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("INVERTER PROVIDER FACTORY TEST SUITE");
  console.log("=".repeat(60));

  const args = process.argv.slice(2);
  const testTelemetry = args.includes("--telemetry") || args.length === 0;
  const testHistory = args.includes("--history");
  const testParsing = args.includes("--parsing") || args.length === 0;
  const specificProvider = args.find(arg => arg.startsWith("--provider="))?.split("=")[1];

  // Filter providers if specific one requested
  let configsToTest = testConfigs;
  if (specificProvider) {
    configsToTest = testConfigs.filter(c => 
      c.provider.toLowerCase() === specificProvider.toLowerCase()
    );
    if (configsToTest.length === 0) {
      console.error(`Provider "${specificProvider}" not found. Available providers:`);
      testConfigs.forEach(c => console.log(`  - ${c.provider}`));
      process.exit(1);
    }
  }

  // Test provider parsing
  if (testParsing) {
    testProviderParsing();
  }

  // Test real-time telemetry
  if (testTelemetry) {
    console.log(`\n${"=".repeat(60)}`);
    console.log("REAL-TIME TELEMETRY TESTS");
    console.log("=".repeat(60));
    
    for (const config of configsToTest) {
      await testProviderTelemetry(config);
    }
  }

  // Test historical data
  if (testHistory) {
    const periods: HistoryPeriod[] = ["daily", "monthly", "yearly", "realtime"];
    
    console.log(`\n${"=".repeat(60)}`);
    console.log("HISTORICAL DATA TESTS");
    console.log("=".repeat(60));

    for (const config of configsToTest) {
      for (const period of periods) {
        await testProviderHistory(config, period);
      }
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUITE COMPLETE");
  console.log("=".repeat(60));
}

// Run tests
main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
