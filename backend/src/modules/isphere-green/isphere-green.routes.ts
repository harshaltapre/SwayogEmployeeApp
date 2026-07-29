import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken } from "../../middleware/auth.js";
import {
  getIsphereGreenEntries,
  getIsphereGreenEntryById,
  createIsphereGreenEntry,
  updateIsphereGreenEntry,
  deleteIsphereGreenEntry,
} from "./isphere-green.controller.js";

export const isphereGreenRoutes = Router();

// Routes (can be accessed by authenticated dashboard users)
isphereGreenRoutes.get("/", authenticateAccessToken, asyncHandler(getIsphereGreenEntries));
isphereGreenRoutes.get("/:id", authenticateAccessToken, asyncHandler(getIsphereGreenEntryById));
isphereGreenRoutes.post("/", authenticateAccessToken, asyncHandler(createIsphereGreenEntry));
isphereGreenRoutes.put("/:id", authenticateAccessToken, asyncHandler(updateIsphereGreenEntry));
isphereGreenRoutes.delete("/:id", authenticateAccessToken, asyncHandler(deleteIsphereGreenEntry));
