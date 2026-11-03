import { UserRole } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, requireMinRole } from "../../middleware/auth.js";
import {
  getCustomerProfile,
  getCustomerStats,
  submitServiceRequest,
  getMyServiceRequests,
  getRequestDetails,
  getCustomerInstallationData,
  getInverterLiveData,
} from "./customer.controller.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "./payments.controller.js";

export const customerRoutes = Router();

/**
 * All Customer routes require:
 * 1. Valid JWT token (authenticateAccessToken)
 * 2. User role must be CUSTOMER or higher (requireMinRole)
 */

// Get customer profile
customerRoutes.get(
  "/profile",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(getCustomerProfile)
);

// Get customer statistics
customerRoutes.get(
  "/stats",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(getCustomerStats)
);

// Submit a service request
customerRoutes.post(
  "/requests",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(submitServiceRequest)
);

// Get my service requests
customerRoutes.get(
  "/requests",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(getMyServiceRequests)
);

// Get specific request details
customerRoutes.get(
  "/requests/:requestId",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(getRequestDetails)
);

// Get installation tracker data
customerRoutes.get(
  "/installation",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(getCustomerInstallationData)
);

customerRoutes.post(
  "/inverter-data",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(getInverterLiveData)
);

customerRoutes.post(
  "/payments/razorpay/order",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(createRazorpayOrder)
);

customerRoutes.post(
  "/payments/razorpay/verify",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(verifyRazorpayPayment)
);
