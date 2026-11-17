import { UserRole } from "@prisma/client";
import { Router, type RequestHandler } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import {
  getIsphereGreenEntries,
  getIsphereGreenEntryById,
  createIsphereGreenEntry,
  updateIsphereGreenEntry,
  deleteIsphereGreenEntry,
} from "./isphere-green.controller.js";

export const isphereGreenRoutes = Router();

const INTERNAL_STAFF_ROLES = new Set<string>([
  UserRole.EMPLOYEE,
  UserRole.SUB_ADMIN,
  UserRole.TEAM_LEAD,
  UserRole.DEPARTMENT_HEAD,
]);

// Job roles (normalized: lowercase, separators removed) allowed to manage the
// Service & Executive directory — including the Liaisoning module used by the
// Monitoring Analyst dashboard.
const ALLOWED_JOB_ROLES = new Set([
  "monitoringanalyst",
  "monitoring",
  "ispheregreenhead",
  "ispheregreen",
  "serviceandexecutivehead",
  "serviceexecutivehead",
  "servicehead",
  "service&executivehead",
]);

function normalizeJobRole(jobRole?: string): string {
  return (jobRole ?? "").trim().toLowerCase().replace(/[_\s-]+/g, "");
}

/**
 * Restricts the iSphere Green directory API to admins and to internal staff
 * whose job role operates the Service & Executive / Monitoring Analyst modules
 * (e.g. Isphere Green head, Service & Executive Head, Monitoring Analyst).
 * Normal employees, partners and customers receive 403.
 */
export const requireIsphereGreenAccess: RequestHandler = (req, _res, next) => {
  const auth = req.auth;
  if (!auth) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  if (auth.role === UserRole.ADMIN || auth.role === UserRole.SUPER_ADMIN) {
    next();
    return;
  }

  if (INTERNAL_STAFF_ROLES.has(auth.role) && ALLOWED_JOB_ROLES.has(normalizeJobRole(auth.jobRole))) {
    next();
    return;
  }

  next(new ApiError(403, "You do not have access to the iSphere Green directory"));
};

// Routes (can be accessed by authenticated dashboard users)
isphereGreenRoutes.get("/", authenticateAccessToken, requireIsphereGreenAccess, asyncHandler(getIsphereGreenEntries));
isphereGreenRoutes.get("/:id", authenticateAccessToken, requireIsphereGreenAccess, asyncHandler(getIsphereGreenEntryById));
isphereGreenRoutes.post("/", authenticateAccessToken, requireIsphereGreenAccess, asyncHandler(createIsphereGreenEntry));
isphereGreenRoutes.put("/:id", authenticateAccessToken, requireIsphereGreenAccess, asyncHandler(updateIsphereGreenEntry));
isphereGreenRoutes.delete("/:id", authenticateAccessToken, requireIsphereGreenAccess, asyncHandler(deleteIsphereGreenEntry));
