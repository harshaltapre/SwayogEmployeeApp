import { Router, Request, Response, NextFunction } from 'express';
import { getLatestAppUpdate, downloadLatestApk } from '../controllers/appUpdate.controller.js';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const appUpdateRoutes = Router();

// Canonical public update manifest endpoint
appUpdateRoutes.get('/latest.json', asyncHandler(getLatestAppUpdate));

// Compatibility aliases
appUpdateRoutes.get('/latest', asyncHandler(getLatestAppUpdate));
appUpdateRoutes.get('/android/latest.json', asyncHandler(getLatestAppUpdate));
appUpdateRoutes.get('/update/latest.json', asyncHandler(getLatestAppUpdate));

// Direct download endpoints
appUpdateRoutes.get('/releases/android/:versionName/build-:versionCode/app-release.apk', asyncHandler(downloadLatestApk));
appUpdateRoutes.get('/download/latest', asyncHandler(downloadLatestApk));
appUpdateRoutes.get('/update/download/latest', asyncHandler(downloadLatestApk));