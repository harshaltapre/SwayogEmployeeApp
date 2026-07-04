import "./config/env.js";
import { fetchGrowattData, fetchGrowattHistory } from "./lib/growatt.js";

async function test() {
  console.log("=== Testing Roshan Nagpure Growatt Live Data ===");
  try {
    const data = await fetchGrowattData("R Nagpure", "Swapnila@09");
    console.log("SUCCESS Live Data:", data);
  } catch (e: any) {
    console.error("FAILED Live Data:", e.message);
  }

  console.log("\n=== Testing Roshan Nagpure Growatt History (Real-time) ===");
  try {
    const history = await fetchGrowattHistory("R Nagpure", "Swapnila@09", "realtime");
    console.log("SUCCESS Real-time History count:", history.length);
    console.log("Sample:", history.slice(0, 5));
  } catch (e: any) {
    console.error("FAILED Real-time History:", e.message);
  }

  console.log("\n=== Testing Roshan Nagpure Growatt History (Daily) ===");
  try {
    const history = await fetchGrowattHistory("R Nagpure", "Swapnila@09", "daily");
    console.log("SUCCESS Daily History count:", history.length);
    console.log("Sample:", history.slice(0, 5));
  } catch (e: any) {
    console.error("FAILED Daily History:", e.message);
  }

  console.log("\n=== Testing Roshan Nagpure Growatt History (Monthly) ===");
  try {
    const history = await fetchGrowattHistory("R Nagpure", "Swapnila@09", "monthly");
    console.log("SUCCESS Monthly History count:", history.length);
    console.log("Sample:", history.slice(0, 5));
  } catch (e: any) {
    console.error("FAILED Monthly History:", e.message);
  }

  console.log("\n=== Testing Roshan Nagpure Growatt History (Yearly) ===");
  try {
    const history = await fetchGrowattHistory("R Nagpure", "Swapnila@09", "yearly");
    console.log("SUCCESS Yearly History count:", history.length);
    console.log("Sample:", history.slice(0, 5));
  } catch (e: any) {
    console.error("FAILED Yearly History:", e.message);
  }
}

test().catch(console.error);
