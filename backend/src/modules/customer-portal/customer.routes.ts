import { UserRole } from "@prisma/client";
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, requireMinRole } from "../../middleware/auth.js";
import {
  getCustomerProfile,
  getCustomerStats,
  submitServiceRequest,
  getMyServiceRequests,
  getRequestDetails,
  getCustomerInstallationData,
  getMyDispatches,
  getMyAmcVisits,
  listCustomerNotifications,
  getUnreadCount,
  markRead,
} from "./customer.controller.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "./payments.controller.js";

// Setup multer storage for service requests
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/requests";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png and .webp formats are allowed!"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

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
  upload.array("images"),
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

// Get my dispatches
customerRoutes.get(
  "/dispatches",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(getMyDispatches)
);

// Get my AMC visits
customerRoutes.get(
  "/amc-visits",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(getMyAmcVisits)
);

// Get customer notifications
customerRoutes.get(
  "/notifications",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(listCustomerNotifications)
);

// Get customer unread notifications count
customerRoutes.get(
  "/notifications/unread-count",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(getUnreadCount)
);

// Mark notification as read
customerRoutes.post(
  "/notifications/:notificationId/read",
  authenticateAccessToken,
  requireMinRole(UserRole.CUSTOMER),
  asyncHandler(markRead)
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
