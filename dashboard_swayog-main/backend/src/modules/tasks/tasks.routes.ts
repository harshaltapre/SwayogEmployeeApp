import { UserRole } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.js";
import { completeTaskHandler, createTaskHandler, listTasksHandler } from "./tasks.controller.js";
import {
  completeTaskSchema,
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
} from "./tasks.schemas.js";

export const taskRoutes = Router();

taskRoutes.get(
  "/",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUB_ADMIN),
  validateQuery(listTasksQuerySchema),
  asyncHandler(listTasksHandler),
);

taskRoutes.post(
  "/",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN),
  validateBody(createTaskSchema),
  asyncHandler(createTaskHandler),
);

taskRoutes.patch(
  "/:id/complete",
  authenticateAccessToken,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE),
  validateParams(taskIdParamsSchema),
  validateBody(completeTaskSchema),
  asyncHandler(completeTaskHandler),
);
