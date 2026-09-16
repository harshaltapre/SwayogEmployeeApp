import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { getLatestAppUpdate, downloadReleaseApk } from "./appUpdate.controller.js";

export const appUpdateRouter = Router();

// Primary canonical endpoint expected by Android App
appUpdateRouter.get("/latest.json", (req: Request, res: Response, next: NextFunction) => {
  getLatestAppUpdate(req, res).catch(next);
});

// Backward-compatible alias endpoints
appUpdateRouter.get("/latest", (req: Request, res: Response, next: NextFunction) => {
  getLatestAppUpdate(req, res).catch(next);
});
appUpdateRouter.get("/android/latest.json", (req: Request, res: Response, next: NextFunction) => {
  getLatestAppUpdate(req, res).catch(next);
});
appUpdateRouter.get("/update/latest.json", (req: Request, res: Response, next: NextFunction) => {
  getLatestAppUpdate(req, res).catch(next);
});
appUpdateRouter.get("/api/v1/app/update/latest.json", (req: Request, res: Response, next: NextFunction) => {
  getLatestAppUpdate(req, res).catch(next);
});

// Direct APK download routes
appUpdateRouter.get(
  "/releases/android/:versionName/build-:versionCode/app-release.apk",
  (req: Request, res: Response, next: NextFunction) => {
    downloadReleaseApk(req, res).catch(next);
  }
);
appUpdateRouter.get("/download/latest", (req: Request, res: Response, next: NextFunction) => {
  downloadReleaseApk(req, res).catch(next);
});
appUpdateRouter.get("/api/v1/app/update/download/latest", (req: Request, res: Response, next: NextFunction) => {
  downloadReleaseApk(req, res).catch(next);
});
