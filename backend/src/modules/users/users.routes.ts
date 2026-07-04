import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.js";
import {
  createInternalUserHandler,
  deleteInternalUserHandler,
  getInternalUserHandler,
  listInternalUsersHandler,
  transferInternalUserTeamHandler,
  updateInternalUserHandler,
} from "./users.controller.js";
import {
  createInternalUserSchema,
  internalUserParamsSchema,
  listInternalUsersQuerySchema,
  transferInternalUserTeamSchema,
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

userRoutes.get(
  "/internal/:userId",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  validateParams(internalUserParamsSchema),
  asyncHandler(getInternalUserHandler),
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

userRoutes.post(
  "/internal/:userId/transfer-team",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateParams(internalUserParamsSchema),
  validateBody(transferInternalUserTeamSchema),
  asyncHandler(transferInternalUserTeamHandler),
);

userRoutes.delete(
  "/internal/:userId",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateParams(internalUserParamsSchema),
  asyncHandler(deleteInternalUserHandler),
);
