import { UserRole } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, requireRole, authorizeRoles } from "../../middleware/auth.js";
import {
  getAdminDashboard,
  getAdminEmployees,
  getAdminTasks,
  getAdminComplaints,
  getAdminRevenueChart,
  getAdminInstallationChart,
  assignTaskToEmployee,
  getTaskDetails,
  updateTaskStatus,
  exportCustomerTemplate,
} from "./admin.controller.js";

export const adminRoutes = Router();

// Get admin dashboard with stats
adminRoutes.get(
  "/dashboard",
  authenticateAccessToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD),
  asyncHandler(getAdminDashboard)
);

adminRoutes.get(
  "/customers/export-template",
  authenticateAccessToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(exportCustomerTemplate)
);

adminRoutes.get(
  "/revenue-chart",
  authenticateAccessToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD),
  asyncHandler(getAdminRevenueChart)
);

adminRoutes.get(
  "/installation-chart",
  authenticateAccessToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD),
  asyncHandler(getAdminInstallationChart)
);

// Get employees under this admin
adminRoutes.get(
  "/employees",
  authenticateAccessToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(getAdminEmployees)
);

// Get all tasks
adminRoutes.get(
  "/tasks",
  authenticateAccessToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(getAdminTasks)
);

// Get all complaints (service requests)
adminRoutes.get(
  "/complaints",
  authenticateAccessToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(getAdminComplaints)
);

// Get specific task details
adminRoutes.get(
  "/tasks/:taskId",
  authenticateAccessToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(getTaskDetails)
);

// Assign task to employee
adminRoutes.post(
  "/tasks/assign",
  authenticateAccessToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(assignTaskToEmployee)
);

// Update task status
adminRoutes.patch(
  "/tasks/:taskId/status",
  authenticateAccessToken,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(updateTaskStatus)
);
