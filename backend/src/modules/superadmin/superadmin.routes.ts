import { UserRole } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, requireRole } from "../../middleware/auth.js";
import {
  getSuperAdminDashboard,
  getServiceRequestsComplaints,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  updateUserRole,
  resetUserPassword,
  forceLogoutUser,
  getUserLoginHistory,
  exportUsers,
  importUsers,
  forceSyncAllData,
  clearSystemCache,
  deactivateUsersByRole,
  purgeAuditLogs,
  getSystemMaintenanceMode,
  setSystemMaintenanceMode,
} from "./superadmin.controller.js";

export const superadminRoutes = Router();

// All routes require SUPER_ADMIN
const SA = [authenticateAccessToken, requireRole(UserRole.SUPER_ADMIN)];

// Dashboard
superadminRoutes.get("/dashboard", ...SA, asyncHandler(getSuperAdminDashboard));

// Complaints (Service Requests)
superadminRoutes.get("/complaints", ...SA, asyncHandler(getServiceRequestsComplaints));

// System Controls
superadminRoutes.post("/system/force-sync", ...SA, asyncHandler(forceSyncAllData));
superadminRoutes.post("/system/clear-cache", ...SA, asyncHandler(clearSystemCache));
superadminRoutes.post("/system/deactivate-users", ...SA, asyncHandler(deactivateUsersByRole));
superadminRoutes.delete("/system/audit-logs", ...SA, asyncHandler(purgeAuditLogs));
superadminRoutes.get("/system/maintenance-mode", ...SA, asyncHandler(getSystemMaintenanceMode));
superadminRoutes.post("/system/maintenance-mode", ...SA, asyncHandler(setSystemMaintenanceMode));

// User listing & detail
superadminRoutes.get("/users/export", ...SA, asyncHandler(exportUsers));     // before :userId
superadminRoutes.get("/users",         ...SA, asyncHandler(getAllUsers));
superadminRoutes.get("/users/:userId", ...SA, asyncHandler(getUserById));

// Create / Update / Delete
superadminRoutes.post("/users",           ...SA, asyncHandler(createUser));
superadminRoutes.patch("/users/:userId",  ...SA, asyncHandler(updateUser));
superadminRoutes.delete("/users/:userId", ...SA, asyncHandler(deleteUser));

// Role
superadminRoutes.patch("/users/:userId/role", ...SA, asyncHandler(updateUserRole));

// Activate / Deactivate
superadminRoutes.post("/users/:userId/activate",   ...SA, asyncHandler(activateUser));
superadminRoutes.post("/users/:userId/deactivate", ...SA, asyncHandler(deactivateUser));

// Password & Sessions
superadminRoutes.post("/users/:userId/reset-password", ...SA, asyncHandler(resetUserPassword));
superadminRoutes.post("/users/:userId/force-logout",   ...SA, asyncHandler(forceLogoutUser));

// Login History
superadminRoutes.get("/users/:userId/login-history", ...SA, asyncHandler(getUserLoginHistory));

// Bulk Import
superadminRoutes.post("/users/import", ...SA, asyncHandler(importUsers));
