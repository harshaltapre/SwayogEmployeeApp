import { Request, Response } from "express";
import { getFromR2, generatePresignedUrl, isR2Configured, getBucketName } from "../../services/r2StorageService.js";

export interface AppUpdateManifest {
  versionCode: number;
  versionName: string;
  minimumVersionCode?: number;
  mandatory: boolean;
  releaseDate?: string;
  title?: string;
  releaseNotes: string[];
  apkUrl: string;
  sha256: string;
  fileSize?: number;
}

/**
 * Fallback manifest used when R2 does not yet contain a latest.json release
 * or for local development environments.
 */
const DEFAULT_FALLBACK_MANIFEST: AppUpdateManifest = {
  versionCode: 1,
  versionName: "1.0.0",
  minimumVersionCode: 1,
  mandatory: false,
  releaseDate: new Date().toISOString().split("T")[0],
  title: "Swayog Employee App",
  releaseNotes: [
    "Initial production release",
    "Field attendance with face verification",
    "Task tracking and management"
  ],
  apkUrl: "https://swayog-dashboard.vercel.app/releases/android/app-release.apk",
  sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
};

/**
 * GET /api/v1/app/update/latest
 * GET /app/update/latest
 * GET /app/update/latest.json
 *
 * Public endpoint that serves the latest application release manifest.
 * Checks Cloudflare R2 for `releases/android/latest.json`.
 * Automatically generates a presigned download URL if R2 storage is private.
 */
export async function getLatestAppUpdate(req: Request, res: Response): Promise<void> {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    let manifest: AppUpdateManifest | null = null;

    if (isR2Configured()) {
      try {
        const manifestBuffer = await getFromR2("releases/android/latest.json");
        manifest = JSON.parse(manifestBuffer.toString("utf-8")) as AppUpdateManifest;
      } catch (err: any) {
        console.warn("[AppUpdate] Could not load releases/android/latest.json from R2:", err.message);
      }
    }

    if (!manifest) {
      manifest = { ...DEFAULT_FALLBACK_MANIFEST };
    }

    // Resolve apkUrl: if it refers to an R2 object key (or is relative), generate a presigned URL
    if (manifest.apkUrl) {
      const cleanKey = manifest.apkUrl.trim();
      // If it's an object key path like "releases/android/..." or doesn't start with http
      if (!cleanKey.startsWith("http://") && !cleanKey.startsWith("https://")) {
        if (isR2Configured()) {
          try {
            // Presigned URL valid for 24 hours (86400 seconds)
            manifest.apkUrl = await generatePresignedUrl(cleanKey, 86400);
          } catch (e: any) {
            console.error("[AppUpdate] Failed to presign APK URL:", e.message);
          }
        }
      } else if (cleanKey.includes(".r2.cloudflarestorage.com")) {
        // If it points to an internal R2 endpoint, presign it securely
        try {
          const pathSegments = new URL(cleanKey).pathname.split("/").filter(Boolean);
          const bucket = getBucketName();
          // Remove bucket name if prefixed in pathname
          const objectKey = pathSegments[0] === bucket ? pathSegments.slice(1).join("/") : pathSegments.join("/");
          if (objectKey && isR2Configured()) {
            manifest.apkUrl = await generatePresignedUrl(objectKey, 86400);
          }
        } catch {
          // Keep original URL
        }
      }
    }

    res.status(200).json(manifest);
  } catch (error: any) {
    console.error("[AppUpdate] Error in getLatestAppUpdate:", error);
    res.status(200).json(DEFAULT_FALLBACK_MANIFEST);
  }
}

/**
 * GET /api/v1/app/update/download/latest
 *
 * Redirects client directly to the latest release APK download location.
 */
export async function downloadLatestApk(req: Request, res: Response): Promise<void> {
  try {
    let apkKey = "releases/android/latest.apk";

    if (isR2Configured()) {
      try {
        const manifestBuffer = await getFromR2("releases/android/latest.json");
        const manifest = JSON.parse(manifestBuffer.toString("utf-8")) as AppUpdateManifest;
        if (manifest.apkUrl && !manifest.apkUrl.startsWith("http")) {
          apkKey = manifest.apkUrl;
        } else if (manifest.apkUrl.startsWith("http")) {
          res.redirect(302, manifest.apkUrl);
          return;
        }
      } catch (err: any) {
        console.warn("[AppUpdate] Manifest read error on download redirect:", err.message);
      }

      const signedUrl = await generatePresignedUrl(apkKey, 3600);
      res.redirect(302, signedUrl);
      return;
    }

    res.status(404).json({
      error: "Release APK storage is not configured",
    });
  } catch (error: any) {
    console.error("[AppUpdate] Download redirect failed:", error);
    res.status(500).json({ error: "Failed to resolve download link" });
  }
}
