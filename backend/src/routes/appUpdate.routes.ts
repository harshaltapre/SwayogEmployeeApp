import { Router } from "express";
import { getLatestAppUpdate, downloadLatestApk } from "../modules/app-update/appUpdate.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const appUpdateRoutes = Router();

// Canonical public update manifest endpoint
appUpdateRoutes.get("/latest.json", asyncHandler(getLatestAppUpdate));

// Compatibility aliases
appUpdateRoutes.get("/latest", asyncHandler(getLatestAppUpdate));
appUpdateRoutes.get("/android/latest.json", asyncHandler(getLatestAppUpdate));
appUpdateRoutes.get("/update/latest.json", asyncHandler(getLatestAppUpdate));

// Direct download endpoints
appUpdateRoutes.get("/releases/android/:versionName/build-:versionCode/app-release.apk", asyncHandler(downloadLatestApk));
appUpdateRoutes.get("/download/latest", asyncHandler(downloadLatestApk));
appUpdateRoutes.get("/update/download/latest", asyncHandler(downloadLatestApk));
