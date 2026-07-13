import { app } from "./app.js";
import { env } from "./config/env.js";
import { disconnectPrisma } from "./lib/prisma.js";
import { startGrowattScheduler } from "./lib/growatt-scheduler.js";
import { startWaareeScheduler } from "./lib/waaree-scheduler.js";
import { initWebSocketServer } from "./lib/telemetry-ws.js";
import { startTelemetryPoller } from "./lib/telemetry-poller.js";

const server = app.listen(env.PORT, () => {
  console.log(`Solar OS backend listening on port ${env.PORT}`);
  
  // Initialize the Growatt Live Telemetry Polling Scheduler
  try {
    startGrowattScheduler();
  } catch (error: any) {
    console.error("Failed to start Growatt background scheduler:", error.message);
  }

  // Initialize the Waaree Live Telemetry Polling Scheduler
  try {
    startWaareeScheduler();
  } catch (error: any) {
    console.error("Failed to start Waaree background scheduler:", error.message);
  }

  // Initialize the WebSocket Server and Telemetry Poller
  try {
    initWebSocketServer(server);
    startTelemetryPoller();
    console.log("WebSocket telemetry server and poller successfully started.");
  } catch (error: any) {
    console.error("Failed to start WebSocket telemetry services:", error.message);
  }
});

// ---------------------------------------------------------------------------
// Graceful shutdown — drain active requests and close DB connections cleanly
// ---------------------------------------------------------------------------
const SHUTDOWN_TIMEOUT_MS = 10_000;
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[SHUTDOWN] Received ${signal}. Starting graceful shutdown…`);

  // Stop accepting new connections
  server.close(async () => {
    console.log("[SHUTDOWN] HTTP server closed — no more inbound connections.");

    try {
      await disconnectPrisma();
      console.log("[SHUTDOWN] Prisma disconnected.");
    } catch (err) {
      console.error("[SHUTDOWN] Error disconnecting Prisma:", err);
    }

    process.exit(0);
  });

  // Force exit if draining takes too long
  setTimeout(() => {
    console.error(`[SHUTDOWN] Could not close connections within ${SHUTDOWN_TIMEOUT_MS}ms — forcing exit.`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

