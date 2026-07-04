import { prisma } from "./prisma.js";
import { GrowattApiClient } from "./growatt-api.js";
import { decryptToken } from "./encryption.js";

/**
 * Updates current power (kW) and online/offline status for all active Growatt customers
 * Interval: 5 minutes
 */
export async function syncGrowattCurrentPower() {
  console.log("[Growatt Scheduler] Starting 5-minute instantaneous current power and status sync...");
  try {
    const activeCustomers = await prisma.growattCustomer.findMany({
      where: { isActive: true },
    });
    
    console.log(`[Growatt Scheduler] Found ${activeCustomers.length} active customer plants for power sync.`);
    
    for (const customer of activeCustomers) {
      try {
        const token = decryptToken(customer.apiToken);
        const currentPower = await GrowattApiClient.getCurrentPower(token, customer.plantId);
        const status = currentPower > 0 ? "online" : "offline";
        
        const existingGen = await prisma.growattGeneration.findFirst({
          where: { growattCustomerId: customer.id },
        });

        if (existingGen) {
          await prisma.growattGeneration.update({
            where: { id: existingGen.id },
            data: {
              currentPower,
              status,
              lastUpdated: new Date(),
            },
          });
        } else {
          // If no generation record exists, create a default one first
          await prisma.growattGeneration.create({
            data: {
              growattCustomerId: customer.id,
              currentPower,
              status,
              lastUpdated: new Date(),
            },
          });
        }
        
        console.log(`[Growatt Scheduler] Plant "${customer.plantName}" (ID: ${customer.plantId}) updated: ${currentPower} kW (${status})`);
      } catch (err: any) {
        console.error(`[Growatt Scheduler Error] Failed power sync for plant "${customer.plantName}":`, err.message);
        
        // Inactivate if token error detected
        const errMsg = err.message?.toLowerCase() || "";
        if (errMsg.includes("token invalid") || errMsg.includes("invalid token") || errMsg.includes("authentication failed")) {
          console.warn(`[Growatt Scheduler] Inactivating customer ID ${customer.id} due to invalid token during power polling.`);
          await prisma.growattCustomer.update({
            where: { id: customer.id },
            data: { isActive: false },
          });
        }
      }
    }
    console.log("[Growatt Scheduler] 5-minute current power and status sync finished.");
  } catch (err: any) {
    console.error("[Growatt Scheduler Error] Global current power sync failed:", err.message);
  }
}

/**
 * Updates full historical energy generation statistics (Daily, Monthly, Yearly, Total kWh)
 * Interval: 30 minutes
 */
export async function syncGrowattGenerationStats() {
  console.log("[Growatt Scheduler] Starting 30-minute historical generation metrics sync...");
  try {
    const activeCustomers = await prisma.growattCustomer.findMany({
      where: { isActive: true },
    });
    
    console.log(`[Growatt Scheduler] Found ${activeCustomers.length} active customer plants for generation sync.`);
    
    for (const customer of activeCustomers) {
      try {
        await GrowattApiClient.syncGeneration(customer.id);
      } catch (err: any) {
        console.error(`[Growatt Scheduler Error] Failed generation sync for plant "${customer.plantName}":`, err.message);
      }
    }
    console.log("[Growatt Scheduler] 30-minute generation metrics sync finished.");
  } catch (err: any) {
    console.error("[Growatt Scheduler Error] Global generation stats sync failed:", err.message);
  }
}

/**
 * Bootstraps the polling intervals
 */
export function startGrowattScheduler() {
  console.log("[Growatt Scheduler] Initializing background polling schedulers...");
  
  // Set up 5-minute instantaneous power updates
  const POWER_INTERVAL = 5 * 60 * 1000;
  setInterval(async () => {
    try {
      await syncGrowattCurrentPower();
    } catch (e: any) {
      console.error("[Growatt Scheduler] Error running scheduled power sync:", e.message);
    }
  }, POWER_INTERVAL);

  // Set up 30-minute long-term generation statistics updates
  const GEN_INTERVAL = 30 * 60 * 1000;
  setInterval(async () => {
    try {
      await syncGrowattGenerationStats();
    } catch (e: any) {
      console.error("[Growatt Scheduler] Error running scheduled generation sync:", e.message);
    }
  }, GEN_INTERVAL);

  // Trigger initial updates asynchronously after a short bootstrap delay
  setTimeout(async () => {
    console.log("[Growatt Scheduler] Triggering initial startup syncs...");
    try {
      await syncGrowattGenerationStats();
    } catch (e: any) {
      console.error("[Growatt Scheduler] Error running initial startup sync:", e.message);
    }
  }, 10000); // 10s delay to avoid database contention on server boot
}
