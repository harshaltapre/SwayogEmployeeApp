import { app } from "./app.js";
import { env } from "./config/env.js";
import { finalizeMissingLogouts } from "./modules/employee/attendance.service.js";

app.listen(env.PORT, () => {
  console.log(`Solar OS backend listening on port ${env.PORT}`);
});

function scheduleAutoLogout() {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(13, 30, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);

  setTimeout(() => {
    void finalizeMissingLogouts().catch((error) => {
      console.error("[Attendance] Scheduled auto-logout failed:", error);
    });
    setInterval(() => {
      void finalizeMissingLogouts().catch((error) => {
        console.error("[Attendance] Scheduled auto-logout failed:", error);
      });
    }, 24 * 60 * 60 * 1000);
  }, next.getTime() - now.getTime());
}

scheduleAutoLogout();
