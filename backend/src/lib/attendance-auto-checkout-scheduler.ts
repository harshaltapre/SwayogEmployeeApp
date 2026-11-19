import { closeOpenAttendanceRecords } from "../services/attendanceService.js";

let checkoutInterval: NodeJS.Timeout | null = null;

export function startAttendanceAutoCheckoutScheduler() {
  if (checkoutInterval) return;

  // Repair historical records once when the backend starts.
  closeOpenAttendanceRecords("BACKFILL").catch((err) =>
    console.error("[AttendanceAutoCheckout] Failed to backfill open records:", err),
  );

  const runDailyCheckout = () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);

    if (hour > 19 || (hour === 19 && minute >= 0)) {
      closeOpenAttendanceRecords("DAILY").catch((err) =>
        console.error("[AttendanceAutoCheckout] Failed to close open records:", err),
      );
    }
  };

  runDailyCheckout();
  checkoutInterval = setInterval(runDailyCheckout, 60 * 1000);
  console.log("[AttendanceAutoCheckout] Scheduler started; daily cutoff is 7:00 PM IST.");
}
