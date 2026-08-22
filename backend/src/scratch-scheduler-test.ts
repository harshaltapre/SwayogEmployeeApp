import { syncGrowattCurrentPower } from "./lib/growatt-scheduler.js";
import { syncWaareeCurrentPower } from "./lib/waaree-scheduler.js";

async function testSchedulers() {
  console.log("Testing Growatt Scheduler...");
  await syncGrowattCurrentPower();
  console.log("Testing Waaree Scheduler...");
  await syncWaareeCurrentPower();
  console.log("Schedulers executed successfully!");
}

testSchedulers().catch(console.error);
