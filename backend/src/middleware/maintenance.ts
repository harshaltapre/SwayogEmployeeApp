import type { RequestHandler } from "express";

export type MaintenanceState = {
  enabled: boolean;
  message: string;
  updatedAt: string;
  updatedBy: string | null;
};

const DEFAULT_MESSAGE = "System is under maintenance. Please try again shortly.";

const maintenanceState: MaintenanceState = {
  enabled: false,
  message: DEFAULT_MESSAGE,
  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
};

function shouldBypassMaintenance(path: string): boolean {
  return (
    path.startsWith("/api/v1/health") ||
    path.startsWith("/api/v1/auth") ||
    path.startsWith("/api/v1/superadmin")
  );
}

export function getMaintenanceState(): MaintenanceState {
  return { ...maintenanceState };
}

export function setMaintenanceState(input: {
  enabled: boolean;
  message?: string;
  updatedBy?: string | null;
}): MaintenanceState {
  maintenanceState.enabled = input.enabled;

  if (typeof input.message === "string" && input.message.trim().length > 0) {
    maintenanceState.message = input.message.trim();
  } else if (!input.enabled) {
    maintenanceState.message = DEFAULT_MESSAGE;
  }

  maintenanceState.updatedAt = new Date().toISOString();
  maintenanceState.updatedBy = input.updatedBy ?? null;

  return getMaintenanceState();
}

export const maintenanceModeMiddleware: RequestHandler = (req, res, next) => {
  if (!maintenanceState.enabled || shouldBypassMaintenance(req.path)) {
    next();
    return;
  }

  res.status(503).json({
    error: maintenanceState.message,
    data: {
      maintenance: getMaintenanceState(),
    },
  });
};
