import { UserRole } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createApartmentHandler,
  deleteApartmentHandler,
  getApartmentHandler,
  listApartmentsHandler,
} from "./apartments.controller.js";
import { createApartmentSchema } from "./apartments.schemas.js";

export const apartmentsRoutes = Router();

apartmentsRoutes.get(
  "/",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER, UserRole.EMPLOYEE, UserRole.SUB_ADMIN),
  asyncHandler(listApartmentsHandler),
);

apartmentsRoutes.get(
  "/:id",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER, UserRole.EMPLOYEE, UserRole.SUB_ADMIN),
  asyncHandler(getApartmentHandler),
);

apartmentsRoutes.post(
  "/",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  validateBody(createApartmentSchema),
  asyncHandler(createApartmentHandler),
);

apartmentsRoutes.delete(
  "/:id",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  asyncHandler(deleteApartmentHandler),
);
