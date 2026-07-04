import { Router, type RequestHandler } from "express";
import { UserRole } from "@prisma/client";
import { authenticateAccessToken, authorizeRoles } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { ApiError } from "../../middleware/error.js";
import {
  createInventoryItemHandler,
  deleteInventoryItemHandler,
  getInventoryItemHandler,
  listInventoryItemsHandler,
  updateInventoryItemHandler,
  createDispatchRecordHandler,
  deleteDispatchRecordHandler,
  listDispatchRecordsHandler,
  updateDispatchRecordHandler,
} from "./inventory.controller.js";
import {
  createInventorySchema,
  updateInventorySchema,
  createDispatchSchema,
  updateDispatchSchema,
} from "./inventory.schemas.js";

export const inventoryRoutes = Router();

// Custom middleware to authorize write access:
// Only SUPER_ADMIN, ADMIN, or an EMPLOYEE with jobRole "inventory executive" can modify inventory
const authorizeInventoryManager: RequestHandler = (req, _res, next) => {
  if (!req.auth) {
    return next(new ApiError(401, "Authentication required"));
  }

  const role = req.auth.role;
  const isSuperOrAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
  const isInventoryExecutive =
    role === UserRole.EMPLOYEE &&
    req.auth.jobRole?.toLowerCase().trim() === "inventory executive";

  if (isSuperOrAdmin || isInventoryExecutive) {
    return next();
  }

  next(new ApiError(403, "Access denied. Only the inventory executive is authorized to manage inventory data."));
};

// Apply auth check globally on inventory routes
inventoryRoutes.use(authenticateAccessToken);

// Inventory items endpoints
inventoryRoutes.get(
  "/",
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  asyncHandler(listInventoryItemsHandler)
);

inventoryRoutes.get(
  "/:id",
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  asyncHandler(getInventoryItemHandler)
);

inventoryRoutes.post(
  "/",
  authorizeInventoryManager,
  validateBody(createInventorySchema),
  asyncHandler(createInventoryItemHandler)
);

inventoryRoutes.patch(
  "/:id",
  authorizeInventoryManager,
  validateBody(updateInventorySchema),
  asyncHandler(updateInventoryItemHandler)
);

inventoryRoutes.delete(
  "/:id",
  authorizeInventoryManager,
  asyncHandler(deleteInventoryItemHandler)
);

// Dispatch records endpoints
inventoryRoutes.get(
  "/dispatches/all",
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.EMPLOYEE),
  asyncHandler(listDispatchRecordsHandler)
);

inventoryRoutes.post(
  "/dispatches",
  authorizeInventoryManager,
  validateBody(createDispatchSchema),
  asyncHandler(createDispatchRecordHandler)
);

inventoryRoutes.patch(
  "/dispatches/:id",
  authorizeInventoryManager,
  validateBody(updateDispatchSchema),
  asyncHandler(updateDispatchRecordHandler)
);

inventoryRoutes.delete(
  "/dispatches/:id",
  authorizeInventoryManager,
  asyncHandler(deleteDispatchRecordHandler)
);
