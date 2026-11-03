import { UserRole } from "@prisma/client";
import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, requireMinRole } from "../../middleware/auth.js";
import {
  getAllServiceRequests,
  updateServiceRequest,
  getServiceRequestStats,
} from "./subadmin.controller.js";
import {
  getAmcCustomers,
  updateAmcSettings,
  listAmcVisits,
  markVisitCompleted,
  updateAmcVisit
} from "./amc.controller.js";

export const subadminRoutes = Router();

/**
 * Sub-Admin routes require a valid token and SUB_ADMIN role or higher.
 * ADMIN and SUPER_ADMIN can also access these routes for oversight.
 */

// Get service request statistics
subadminRoutes.get(
  "/service-requests/stats",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(getServiceRequestStats)
);

// Get all service requests (admin-level view)
subadminRoutes.get(
  "/service-requests",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(getAllServiceRequests)
);

// Update a service request (schedule / change status)
subadminRoutes.patch(
  "/service-requests/:requestId",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(updateServiceRequest)
);

// --- AMC Management ---

// Get all customers with AMC details
subadminRoutes.get(
  "/amc/customers",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(getAmcCustomers)
);

// Update AMC settings for a customer
subadminRoutes.patch(
  "/customers/:customerId/amc-settings",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(updateAmcSettings)
);

// List AMC visits
subadminRoutes.get(
  "/amc-visits",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(listAmcVisits)
);

// Mark AMC visit completed
subadminRoutes.post(
  "/amc-visits/:visitId/complete",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(markVisitCompleted)
);

// Update AMC visit (date / assignment)
subadminRoutes.patch(
  "/amc-visits/:visitId",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(updateAmcVisit)
);
