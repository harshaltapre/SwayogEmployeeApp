import { UserRole } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, requireRole, authorizeRoles } from "../../middleware/auth.js";
import {
  getAdminDashboard,
  getAdminEmployees,
  getAdminTasks,
  getAdminComplaints,
  assignTaskToEmployee,
  getTaskDetails,
  updateTaskStatus,
} from "./admin.controller.js";

export const adminRoutes = Router();

/**
 * All Admin routes require:
 * 1. Valid JWT token (authenticateAccessToken)
 * 2. User role must be ADMIN (requireRole)
 * Note: SuperAdmin can also access via authorizeRoles if needed
 */

// Get admin dashboard with stats
adminRoutes.get(
  "/dashboard",
  authenticateAccessToken,
  requireRole(UserRole.ADMIN),
  asyncHandler(getAdminDashboard)
);

// Get employees under this admin
adminRoutes.get(
  "/employees",
  authenticateAccessToken,
  requireRole(UserRole.ADMIN),
  asyncHandler(getAdminEmployees)
);

// Get all tasks
adminRoutes.get(
  "/tasks",
  authenticateAccessToken,
  requireRole(UserRole.ADMIN),
  asyncHandler(getAdminTasks)
);

// Get all complaints (service requests)
adminRoutes.get(
  "/complaints",
  authenticateAccessToken,
  requireRole(UserRole.ADMIN),
  asyncHandler(getAdminComplaints)
);

// Get specific task details
adminRoutes.get(
  "/tasks/:taskId",
  authenticateAccessToken,
  requireRole(UserRole.ADMIN),
  asyncHandler(getTaskDetails)
);

// Assign task to employee
adminRoutes.post(
  "/tasks/assign",
  authenticateAccessToken,
  requireRole(UserRole.ADMIN),
  asyncHandler(assignTaskToEmployee)
);

// Update task status
adminRoutes.patch(
  "/tasks/:taskId/status",
  authenticateAccessToken,
  requireRole(UserRole.ADMIN),
  asyncHandler(updateTaskStatus)
);
