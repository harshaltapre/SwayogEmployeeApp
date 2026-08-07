import { UserRole } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import {
  getPartnerProfile,
  getPartnerStats,
  getAvailableServices,
  submitServiceRequest,
  getMyRequests,
  submitLead,
} from "./partner.controller.js";

export const partnerRoutes = Router();

const partnerAuth = [
  authenticateAccessToken,
  authorizeRoles(UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE),
];

// Get partner profile
partnerRoutes.get(
  "/profile",
  ...partnerAuth,
  asyncHandler(getPartnerProfile)
);

// Get partner statistics and business metrics
partnerRoutes.get(
  "/stats",
  ...partnerAuth,
  asyncHandler(getPartnerStats)
);

// Get available services to offer
partnerRoutes.get(
  "/services",
  ...partnerAuth,
  asyncHandler(getAvailableServices)
);

// Submit a service request
partnerRoutes.post(
  "/requests",
  ...partnerAuth,
  asyncHandler(submitServiceRequest)
);

// Get my service requests
partnerRoutes.get(
  "/requests",
  ...partnerAuth,
  asyncHandler(getMyRequests)
);

// Submit a lead
partnerRoutes.post(
  "/leads",
  ...partnerAuth,
  asyncHandler(submitLead)
);
