import { UserRole } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, requireRole } from "../../middleware/auth.js";
import {
  getEmployeeDashboard,
  getMyTasks,
  getTaskDetails,
  updateTaskStatus,
  markTaskCompleted,
} from "./employee.controller.js";
import {
  attendanceListHandler,
  checkInHandler,
  checkOutHandler,
  updateBreaksHandler,
} from "./attendance.controller.js";

export const employeeRoutes = Router();

employeeRoutes.get(
  "/attendance",
  authenticateAccessToken,
  requireRole(UserRole.EMPLOYEE),
  asyncHandler(attendanceListHandler),
);
employeeRoutes.post(
  "/attendance/check-in",
  authenticateAccessToken,
  requireRole(UserRole.EMPLOYEE),
  asyncHandler(checkInHandler),
);
employeeRoutes.post(
  "/attendance/check-out",
  authenticateAccessToken,
  requireRole(UserRole.EMPLOYEE),
  asyncHandler(checkOutHandler),
);
employeeRoutes.patch(
  "/attendance/breaks",
  authenticateAccessToken,
  requireRole(UserRole.EMPLOYEE),
  asyncHandler(updateBreaksHandler),
);

/**
 * All Employee routes require:
 * 1. Valid JWT token (authenticateAccessToken)
 * 2. User role must be EMPLOYEE (requireRole)
 */

// Get employee dashboard with task summary
employeeRoutes.get(
  "/dashboard",
  authenticateAccessToken,
  requireRole(UserRole.EMPLOYEE),
  asyncHandler(getEmployeeDashboard)
);

// Get my assigned tasks
employeeRoutes.get(
  "/tasks",
  authenticateAccessToken,
  requireRole(UserRole.EMPLOYEE),
  asyncHandler(getMyTasks)
);

// Get specific task details
employeeRoutes.get(
  "/tasks/:taskId",
  authenticateAccessToken,
  requireRole(UserRole.EMPLOYEE),
  asyncHandler(getTaskDetails)
);

// Update task status
employeeRoutes.patch(
  "/tasks/:taskId/status",
  authenticateAccessToken,
  requireRole(UserRole.EMPLOYEE),
  asyncHandler(updateTaskStatus)
);

// Mark task as completed with documentation
employeeRoutes.post(
  "/tasks/:taskId/complete",
  authenticateAccessToken,
  requireRole(UserRole.EMPLOYEE),
  asyncHandler(markTaskCompleted)
);
