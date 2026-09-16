/**
 * Swayog Employee App Update Module
 * 
 * This module provides the server-side implementation for Android app updates.
 * It can be integrated into any Express application to serve update manifests
 * and redirect to APK downloads stored in Cloudflare R2.
 */

export { appUpdateRoutes } from './routes/appUpdate.routes.js';
export { getLatestAppUpdate, downloadLatestApk } from './controllers/appUpdate.controller.js';
export { uploadToR2, getFromR2, generatePresignedUrl, isR2Configured, getBucketName } from './services/r2StorageService.js';
export { env, ENV_ERROR } from './config/env.js';
export type { AppUpdateManifest } from './controllers/appUpdate.controller.js';