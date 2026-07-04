import { UserRole } from "@prisma/client";
import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, requireMinRole } from "../../middleware/auth.js";
import {
  getAllServiceRequests,
  updateServiceRequest,
  getServiceRequestStats,
  getCustomerInverterGeneration,
  getCustomerInverterGenerationHistory,
  getSubadminCustomerSummary,
  updateCustomerCredentials,
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

subadminRoutes.get(
  "/customers/:customerId/inverter-generation",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(getCustomerInverterGeneration),
);

subadminRoutes.get(
  "/customers/:customerId/inverter-generation-history",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(getCustomerInverterGenerationHistory),
);

subadminRoutes.get(
  "/customers/:customerId/summary",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(getSubadminCustomerSummary),
);

subadminRoutes.patch(
  "/customers/:customerId",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(updateCustomerCredentials),
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

// --- Growatt Solar OpenAPI V1 Integration ---
import {
  saveGrowattCredentials,
  getGrowattPlants,
  manualSyncGrowattPlant,
  deleteGrowattPlant
} from "./growatt.controller.js";

// Save credentials & auto-provision plants
subadminRoutes.post(
  "/growatt/credentials",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(saveGrowattCredentials)
);

// List all physical plants with generation stats
subadminRoutes.get(
  "/growatt/plants",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(getGrowattPlants)
);

// Manually trigger a real-time sync
subadminRoutes.post(
  "/growatt/sync",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(manualSyncGrowattPlant)
);

// Delete physical plant monitor
subadminRoutes.delete(
  "/growatt/plants/:id",
  authenticateAccessToken,
  requireMinRole(UserRole.EMPLOYEE),
  asyncHandler(deleteGrowattPlant)
);

