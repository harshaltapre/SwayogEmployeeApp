import { runAutoCheckout } from "../services/autoCheckoutService.js";

let schedulerTimer: NodeJS.Timeout | null = null;

/**
 * Returns the number of milliseconds until 7:00 PM IST today (or tomorrow if past 7 PM).
 * IST = UTC + 5h30m, so 19:00 IST = 13:30 UTC.
 */
function msUntilNextAutoCheckout(): number {
  const now = new Date();

  // Build today's 7:00 PM IST as a UTC timestamp
  const todayUtcDate = now.getUTCDate();
  const todayUtcMonth = now.getUTCMonth();
  const todayUtcYear = now.getUTCFullYear();

  let target = new Date(Date.UTC(todayUtcYear, todayUtcMonth, todayUtcDate, 13, 30, 0, 0));

  // If it's already past 7 PM IST (13:30 UTC), schedule for tomorrow
  if (now >= target) {
    target = new Date(target.getTime() + 24 * 60 * 60 * 1000);
  }

  return target.getTime() - now.getTime();
}

/**
 * Schedules the auto-checkout job to run every day at exactly 7:00 PM IST.
 * Uses a timeout->interval chain so the first run aligns precisely to 19:00 IST.
 */
export function startAutoCheckoutScheduler() {
  if (schedulerTimer) return; // already running

  const delayMs = msUntilNextAutoCheckout();
  const targetTime = new Date(Date.now() + delayMs);

  console.log(
    `[AutoCheckoutScheduler] Started. Next auto-checkout will run at ` +
      `${targetTime.toISOString()} (${Math.round(delayMs / 60000)} minutes from now).`
  );

  // First fire: aligned to 7:00 PM IST
  schedulerTimer = setTimeout(() => {
    runAutoCheckout().catch((err) =>
      console.error("[AutoCheckoutScheduler] Error during auto-checkout run:", err)
    );

    // Subsequent fires: every 24 hours
    schedulerTimer = setInterval(() => {
      runAutoCheckout().catch((err) =>
        console.error("[AutoCheckoutScheduler] Error during auto-checkout run:", err)
      );
    }, 24 * 60 * 60 * 1000);
  }, delayMs);
}

export function stopAutoCheckoutScheduler() {
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log("[AutoCheckoutScheduler] Stopped.");
  }
}
