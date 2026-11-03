import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.js";
import {
  createInternalUserHandler,
  deleteInternalUserHandler,
  listInternalUsersHandler,
  updateInternalUserHandler,
} from "./users.controller.js";
import {
  createInternalUserSchema,
  internalUserParamsSchema,
  listInternalUsersQuerySchema,
  updateInternalUserSchema,
} from "./users.schemas.js";

export const userRoutes = Router();

userRoutes.get(
  "/internal",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  validateQuery(listInternalUsersQuerySchema),
  asyncHandler(listInternalUsersHandler),
);

userRoutes.post(
  "/internal",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateBody(createInternalUserSchema),
  asyncHandler(createInternalUserHandler),
);

userRoutes.patch(
  "/internal/:userId",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateParams(internalUserParamsSchema),
  validateBody(updateInternalUserSchema),
  asyncHandler(updateInternalUserHandler),
);

userRoutes.delete(
  "/internal/:userId",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateParams(internalUserParamsSchema),
  asyncHandler(deleteInternalUserHandler),
);
