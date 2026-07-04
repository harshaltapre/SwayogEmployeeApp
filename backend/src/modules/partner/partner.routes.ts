import { UserRole } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, requireRole } from "../../middleware/auth.js";
import {
  getPartnerProfile,
  getPartnerStats,
  getAvailableServices,
  submitServiceRequest,
  getMyRequests,
} from "./partner.controller.js";

export const partnerRoutes = Router();

/**
 * All Partner routes require:
 * 1. Valid JWT token (authenticateAccessToken)
 * 2. User role must be PARTNER (requireRole)
 */

// Get partner profile
partnerRoutes.get(
  "/profile",
  authenticateAccessToken,
  requireRole(UserRole.PARTNER),
  asyncHandler(getPartnerProfile)
);

// Get partner statistics and business metrics
partnerRoutes.get(
  "/stats",
  authenticateAccessToken,
  requireRole(UserRole.PARTNER),
  asyncHandler(getPartnerStats)
);

// Get available services to offer
partnerRoutes.get(
  "/services",
  authenticateAccessToken,
  requireRole(UserRole.PARTNER),
  asyncHandler(getAvailableServices)
);

// Submit a service request
partnerRoutes.post(
  "/requests",
  authenticateAccessToken,
  requireRole(UserRole.PARTNER),
  asyncHandler(submitServiceRequest)
);

// Get my service requests
partnerRoutes.get(
  "/requests",
  authenticateAccessToken,
  requireRole(UserRole.PARTNER),
  asyncHandler(getMyRequests)
);
