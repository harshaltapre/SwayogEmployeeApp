import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

export const healthRoutes = Router();

healthRoutes.get("/", async (_req, res) => {
  let dbStatus = "unknown";
  let dbError = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error: any) {
    dbStatus = "disconnected";
    dbError = error.message;
  }

  const statusCode = dbStatus === "connected" ? 200 : 503;
  res.status(statusCode).json({
    data: {
      status: dbStatus === "connected" ? "ok" : "error",
      service: "swayog-backend",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        error: dbError,
      },
    },
  });
});
