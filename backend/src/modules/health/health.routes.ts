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

  res.status(200).json({
    data: {
      status: "ok",
      service: "swayog-backend",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        error: dbError,
      },
    },
  });
});
