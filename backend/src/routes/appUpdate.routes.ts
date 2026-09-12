import { Router } from "express";
import { getLatestAppUpdate, downloadLatestApk } from "../modules/app-update/appUpdate.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const appUpdateRoutes = Router();

// Manifest endpoints
appUpdateRoutes.get("/latest", asyncHandler(getLatestAppUpdate));
appUpdateRoutes.get("/latest.json", asyncHandler(getLatestAppUpdate));

// Direct download redirect
appUpdateRoutes.get("/download/latest", asyncHandler(downloadLatestApk));
