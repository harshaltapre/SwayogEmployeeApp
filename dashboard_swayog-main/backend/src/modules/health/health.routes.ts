import { Router } from "express";

export const healthRoutes = Router();

healthRoutes.get("/", (_req, res) => {
  res.status(200).json({
    data: {
      status: "ok",
      service: "swayog-backend",
      timestamp: new Date().toISOString(),
    },
  });
});
