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

customerRoutes.get(
  "/:id",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER, UserRole.EMPLOYEE, UserRole.SUB_ADMIN),
  asyncHandler(getCustomerHandler),
);

customerRoutes.post(
  "/",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER),
  validateBody(createCustomerSchema),
  asyncHandler(createCustomerHandler),
);

customerRoutes.patch(
  "/:id",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER),
  validateBody(updateCustomerSchema),
  asyncHandler(updateCustomerHandler),
);

customerRoutes.delete(
  "/:id",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  asyncHandler(deleteCustomerHandler),
);
