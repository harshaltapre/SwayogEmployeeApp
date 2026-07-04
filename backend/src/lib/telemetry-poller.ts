import { getActiveCustomerIds, broadcastToCustomer } from "./telemetry-ws.js";
import { fetchInverterGenerationDirect } from "../modules/subadmin/subadmin.controller.js";

const pollingCustomers = new Set<number>();

async function pollCustomerTelemetry(customerId: number) {
  if (pollingCustomers.has(customerId)) {
    return;
  }

  pollingCustomers.add(customerId);
  try {
    console.log(`[Telemetry Poller] Polling telemetry for active customer ${customerId}`);
    // Bypass cache to fetch fresh data from inverter cloud/simulation
    const data = await fetchInverterGenerationDirect(customerId, true);
    broadcastToCustomer(customerId, data);
  } catch (err: any) {
    console.error(`[Telemetry Poller] Error polling customer ${customerId}:`, err.message);
  } finally {
    pollingCustomers.delete(customerId);
  }
}

let intervalId: NodeJS.Timeout | null = null;

export function startTelemetryPoller() {
  if (intervalId) {
    return;
  }

  console.log("[Telemetry Poller] Starting telemetry poller background service...");
  
  // Every 30 seconds, query telemetry for all active clients
  intervalId = setInterval(async () => {
    const activeIds = getActiveCustomerIds();
    if (activeIds.length === 0) {
      return;
    }

    console.log(`[Telemetry Poller] Active customers to poll: [${activeIds.join(", ")}]`);
    for (const customerId of activeIds) {
      pollCustomerTelemetry(customerId);
    }
  }, 30000);
}

export function stopTelemetryPoller() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Telemetry Poller] Stopped telemetry poller.");
  }
}
