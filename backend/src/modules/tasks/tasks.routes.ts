import { UserRole } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.js";
import { completeTaskHandler, createTaskHandler, createBulkTasksHandler, listTasksHandler, rateTaskHandler } from "./tasks.controller.js";
import {
  completeTaskSchema,
  createTaskSchema,
  createBulkTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  rateTaskSchema,
} from "./tasks.schemas.js";

export const taskRoutes = Router();

taskRoutes.get(
  "/",
  authenticateAccessToken,
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
    UserRole.SUB_ADMIN,
    UserRole.TEAM_LEAD,
    UserRole.DEPARTMENT_HEAD,
    UserRole.CUSTOMER
  ),
  validateQuery(listTasksQuerySchema),
  asyncHandler(listTasksHandler),
);

taskRoutes.post(
  "/",
  authenticateAccessToken,
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.SUB_ADMIN,
    UserRole.EMPLOYEE,
    UserRole.TEAM_LEAD,
    UserRole.DEPARTMENT_HEAD
  ),
  validateBody(createTaskSchema),
  asyncHandler(createTaskHandler),
);

taskRoutes.post(
  "/bulk",
  authenticateAccessToken,
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.SUB_ADMIN,
    UserRole.EMPLOYEE,
    UserRole.TEAM_LEAD,
    UserRole.DEPARTMENT_HEAD
  ),
  validateBody(createBulkTaskSchema),
  asyncHandler(createBulkTasksHandler),
);

taskRoutes.patch(
  "/:id/complete",
  authenticateAccessToken,
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
    UserRole.TEAM_LEAD,
    UserRole.DEPARTMENT_HEAD
  ),
  validateParams(taskIdParamsSchema),
  validateBody(completeTaskSchema),
  asyncHandler(completeTaskHandler),
);

taskRoutes.patch(
  "/:id/rate",
  authenticateAccessToken,
  authorizeRoles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.SUB_ADMIN,
    UserRole.CUSTOMER
  ),
  validateParams(taskIdParamsSchema),
  validateBody(rateTaskSchema),
  asyncHandler(rateTaskHandler),
);
