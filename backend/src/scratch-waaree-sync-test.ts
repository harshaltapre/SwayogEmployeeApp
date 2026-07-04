import { syncWaareeCurrentPower, syncWaareeGenerationStats } from "./lib/waaree-scheduler.js";

async function runTest() {
  console.log("Starting Waaree scheduler test run...");
  await syncWaareeCurrentPower();
  await syncWaareeGenerationStats();
  console.log("Waaree scheduler test run complete!");
}

runTest().catch(console.error);
