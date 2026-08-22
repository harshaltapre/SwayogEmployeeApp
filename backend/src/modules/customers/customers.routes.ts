import { UserRole } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import {
  createCustomerHandler,
  deleteCustomerHandler,
  getCustomerHandler,
  listCustomersHandler,
  updateCustomerHandler,
  updatePartnerLeadStatusHandler,
  listEpcAssignedLeadsHandler,
  updateEpcAssignmentStatusHandler,
} from "./customers.controller.js";
import {
  createCustomerSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "./customers.schemas.js";

export const customerRoutes = Router();

customerRoutes.get(
  "/",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER, UserRole.EMPLOYEE, UserRole.SUB_ADMIN),
  validateQuery(listCustomersQuerySchema),
  asyncHandler(listCustomersHandler),
);

// EPC Contractor: fetch their assigned partner leads
customerRoutes.get(
  "/epc-assigned-leads",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUB_ADMIN),
  asyncHandler(listEpcAssignedLeadsHandler),
);

customerRoutes.get(
  "/:id",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER, UserRole.EMPLOYEE, UserRole.SUB_ADMIN),
  asyncHandler(getCustomerHandler),
);

customerRoutes.post(
  "/",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  validateBody(createCustomerSchema),
  asyncHandler(createCustomerHandler),
);

customerRoutes.patch(
  "/:id/partner-lead-status",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  asyncHandler(updatePartnerLeadStatusHandler),
);

// EPC Contractor: accept or reject their assignment
customerRoutes.patch(
  "/:id/epc-assignment-status",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  asyncHandler(updateEpcAssignmentStatusHandler),
);

customerRoutes.patch(
  "/:id",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  validateBody(updateCustomerSchema),
  asyncHandler(updateCustomerHandler),
);

customerRoutes.delete(
  "/:id",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  asyncHandler(deleteCustomerHandler),
);
