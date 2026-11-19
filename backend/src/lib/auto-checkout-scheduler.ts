import { processMissingCheckOuts } from "../services/autoCheckoutService.js";

let checkoutInterval: NodeJS.Timeout | null = null;

export function startAutoCheckoutScheduler() {
  if (checkoutInterval) return;

  console.log("[AutoCheckoutScheduler] Starting automatic missing check-out scheduler...");

  // Run initial check after 15 seconds to catch up on any concluded shifts or past open records
  setTimeout(() => {
    processMissingCheckOuts().catch((err) =>
      console.error("[AutoCheckoutScheduler] Error in initial auto check-out run:", err)
    );
  }, 15_000);

  // Run periodic check every 15 minutes
  checkoutInterval = setInterval(() => {
    processMissingCheckOuts().catch((err) =>
      console.error("[AutoCheckoutScheduler] Error in periodic auto check-out run:", err)
    );
  }, 15 * 60 * 1000);
}
