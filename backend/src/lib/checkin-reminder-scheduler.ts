import { sendCheckInReminders } from "../services/checkInReminderService.js";

let reminderInterval: NodeJS.Timeout | null = null;

export function startCheckInReminderScheduler() {
  if (reminderInterval) return;

  console.log("[CheckInReminderScheduler] Starting check-in reminder scheduler...");

  // Run initial check after 10 seconds
  setTimeout(() => {
    sendCheckInReminders().catch((err) =>
      console.error("[CheckInReminderScheduler] Error running initial reminder check:", err)
    );
  }, 10_000);

  // Run periodic check every 30 minutes
  reminderInterval = setInterval(() => {
    sendCheckInReminders().catch((err) =>
      console.error("[CheckInReminderScheduler] Error running periodic reminder check:", err)
    );
  }, 30 * 60 * 1000);
}
