import { prisma } from "./prisma.js";
import { getWaareeLiveTelemetry } from "./waaree.js";

/**
 * Updates current power (kW) and online/offline status for all active Waaree customers
 * Interval: 5 minutes
 */
export async function syncWaareeCurrentPower() {
  console.log("[Waaree Scheduler] Starting 5-minute instantaneous current power and status sync...");
  try {
    const activeCustomers = await prisma.customer.findMany({
      where: {
        status: "ACTIVE",
        inverterBrand: {
          contains: "Waaree",
          mode: "insensitive",
        },
      },
    });

    console.log(`[Waaree Scheduler] Found ${activeCustomers.length} active Waaree customers for power sync.`);

    for (const customer of activeCustomers) {
      const loginId = (customer.inverterLoginId || "").trim();
      const password = (customer.inverterPassword || "").trim();
      const apiKey = (customer.inverterApiKey || "").trim();
      const deviceSn = (customer.inverterDeviceSn || "").trim();

      const hasAnyCred = loginId !== "" || apiKey !== "" || deviceSn !== "";
      if (!hasAnyCred) {
        continue;
      }

      try {
        const telemetry = await getWaareeLiveTelemetry(deviceSn, loginId, password, apiKey);

        const existingGen = await prisma.waareeGeneration.findFirst({
          where: { customerId: customer.id },
        });

        if (existingGen) {
          await prisma.waareeGeneration.update({
            where: { id: existingGen.id },
            data: {
              currentPower: telemetry.peakPower,
              status: telemetry.status,
              lastUpdated: new Date(),
            },
          });
        } else {
          await prisma.waareeGeneration.create({
            data: {
              customerId: customer.id,
              currentPower: telemetry.peakPower,
              status: telemetry.status,
              lastUpdated: new Date(),
            },
          });
        }

        console.log(`[Waaree Scheduler] Customer "${customer.fullName}" (ID: ${customer.id}) updated: ${telemetry.peakPower} kW (${telemetry.status})`);
      } catch (err: any) {
        console.error(`[Waaree Scheduler Error] Failed power sync for customer "${customer.fullName}":`, err.message);
      }
    }
    console.log("[Waaree Scheduler] 5-minute current power and status sync finished.");
  } catch (err: any) {
    console.error("[Waaree Scheduler Error] Global current power sync failed:", err.message);
  }
}

/**
 * Updates full historical energy generation statistics (Daily, Monthly, Yearly, Total kWh)
 * Interval: 30 minutes
 */
export async function syncWaareeGenerationStats() {
  console.log("[Waaree Scheduler] Starting 30-minute historical generation metrics sync...");
  try {
    const activeCustomers = await prisma.customer.findMany({
      where: {
        status: "ACTIVE",
        inverterBrand: {
          contains: "Waaree",
          mode: "insensitive",
        },
      },
    });

    console.log(`[Waaree Scheduler] Found ${activeCustomers.length} active Waaree customers for generation sync.`);

    for (const customer of activeCustomers) {
      const loginId = (customer.inverterLoginId || "").trim();
      const password = (customer.inverterPassword || "").trim();
      const apiKey = (customer.inverterApiKey || "").trim();
      const deviceSn = (customer.inverterDeviceSn || "").trim();

      const hasAnyCred = loginId !== "" || apiKey !== "" || deviceSn !== "";
      if (!hasAnyCred) {
        continue;
      }

      try {
        const telemetry = await getWaareeLiveTelemetry(deviceSn, loginId, password, apiKey);

        const existingGen = await prisma.waareeGeneration.findFirst({
          where: { customerId: customer.id },
        });

        if (existingGen) {
          await prisma.waareeGeneration.update({
            where: { id: existingGen.id },
            data: {
              todayGeneration: telemetry.dailyGeneration,
              monthlyGeneration: telemetry.monthlyGeneration,
              yearlyGeneration: 0,
              totalGeneration: telemetry.totalGeneration,
              currentPower: telemetry.peakPower,
              status: telemetry.status,
              lastUpdated: new Date(),
            },
          });
        } else {
          await prisma.waareeGeneration.create({
            data: {
              customerId: customer.id,
              todayGeneration: telemetry.dailyGeneration,
              monthlyGeneration: telemetry.monthlyGeneration,
              yearlyGeneration: 0,
              totalGeneration: telemetry.totalGeneration,
              currentPower: telemetry.peakPower,
              status: telemetry.status,
              lastUpdated: new Date(),
            },
          });
        }

        console.log(`[Waaree Scheduler] Customer "${customer.fullName}" (ID: ${customer.id}) updated: today=${telemetry.dailyGeneration} kWh, total=${telemetry.totalGeneration} kWh`);
      } catch (err: any) {
        console.error(`[Waaree Scheduler Error] Failed generation sync for customer "${customer.fullName}":`, err.message);
      }
    }
    console.log("[Waaree Scheduler] 30-minute generation metrics sync finished.");
  } catch (err: any) {
    console.error("[Waaree Scheduler Error] Global generation stats sync failed:", err.message);
  }
}

/**
 * Bootstraps the polling intervals
 */
export function startWaareeScheduler() {
  console.log("[Waaree Scheduler] Initializing background polling schedulers...");

  // Set up 5-minute instantaneous power updates
  const POWER_INTERVAL = 5 * 60 * 1000;
  setInterval(async () => {
    try {
      await syncWaareeCurrentPower();
    } catch (e: any) {
      console.error("[Waaree Scheduler] Error running scheduled power sync:", e.message);
    }
  }, POWER_INTERVAL);

  // Set up 30-minute long-term generation statistics updates
  const GEN_INTERVAL = 30 * 60 * 1000;
  setInterval(async () => {
    try {
      await syncWaareeGenerationStats();
    } catch (e: any) {
      console.error("[Waaree Scheduler] Error running scheduled generation sync:", e.message);
    }
  }, GEN_INTERVAL);

  // Trigger initial updates asynchronously after a short bootstrap delay
  setTimeout(async () => {
    console.log("[Waaree Scheduler] Triggering initial startup syncs...");
    try {
      await syncWaareeGenerationStats();
    } catch (e: any) {
      console.error("[Waaree Scheduler] Error running initial startup sync:", e.message);
    }
  }, 12000); // 12s delay to avoid database contention on server boot
}
