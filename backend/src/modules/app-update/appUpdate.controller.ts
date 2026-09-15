import { Request, Response } from "express";
import { getFromR2, generatePresignedUrl, isR2Configured, getBucketName } from "../../services/r2StorageService.js";

export interface StructuredReleaseNotes {
  summary: string;
  items: string[];
}

export type ReleaseNotesType = string[] | StructuredReleaseNotes;

export interface AppUpdateManifest {
  appId?: string;
  platform?: string;
  versionCode: number;
  versionName: string;
  minimumVersionCode?: number;
  mandatory: boolean;
  releaseDate?: string;
  title?: string;
  releaseNotes: ReleaseNotesType;
  apkUrl: string;
  sha256: string;
  fileSize?: number;
  releaseTag?: string;
  releaseTitle?: string;
}

/**
 * Fallback manifest used when R2 does not yet contain a latest.json release
 * or for local development environments.
 * Updated to Build 20 for current production release.
 */
const DEFAULT_FALLBACK_MANIFEST: AppUpdateManifest = {
  appId: "com.swayog.employee",
  platform: "android",
  versionCode: 20,
  versionName: "1.0.0",
  minimumVersionCode: 1,
  mandatory: false,
  releaseDate: "2026-09-15",
  title: "Swayog Employee App v1.0.0 — Build 20",
  releaseTag: "v1.0.0-build20",
  releaseTitle: "Swayog Employee App v1.0.0 — Build 20",
  releaseNotes: [
    "Improved attendance tracking",
    "Improved attendance working-time calculation",
    "Improved attendance calendar synchronization",
    "Improved employee/admin attendance synchronization",
    "Improved GPS attendance verification",
    "Improved profile synchronization",
    "Improved app update system",
    "Bug fixes and performance improvements"
  ],
  apkUrl: "https://swayog-dashboard.r2.dev/releases/android/1.0.0/build-20/app-release.apk",
  sha256: "dd5422cce433152653308bb0ba04ba6159a35ebf4c4b9f90eeb32670289ba3c4",
  fileSize: 0
};

/**
 * GET /api/v1/app/update/latest
 * GET /api/v1/app/update/latest.json
 * GET /api/v1/app/android/latest.json
 * GET /app/android/latest.json
 * GET /app/update/latest
 * GET /app/update/latest.json
 *
 * Public endpoint that serves the latest application release manifest.
 * Checks Cloudflare R2 for `releases/android/latest.json` (or `app/android/latest.json`).
 * Automatically generates a presigned download URL if R2 storage is private.
 */
export async function getLatestAppUpdate(req: Request, res: Response): Promise<void> {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    let manifest: AppUpdateManifest | null = null;

    if (isR2Configured()) {
      const candidateKeys = [
        "releases/android/latest.json",
        "app/android/latest.json",
        "latest.json"
      ];

      for (const key of candidateKeys) {
        try {
          const manifestBuffer = await getFromR2(key);
          manifest = JSON.parse(manifestBuffer.toString("utf-8")) as AppUpdateManifest;
          if (manifest) break;
        } catch {
          // try next candidate key
        }
      }
    }

    if (!manifest) {
      manifest = { ...DEFAULT_FALLBACK_MANIFEST };
    }

    // Ensure standard metadata defaults
    if (!manifest.appId) manifest.appId = "com.swayog.employee";
    if (!manifest.platform) manifest.platform = "android";

    // Resolve apkUrl: if it refers to an R2 object key (or is relative), generate a presigned or public URL
    const publicBaseUrl = process.env.R2_PUBLIC_URL || process.env.PUBLIC_DISTRIBUTION_URL;

    if (manifest.apkUrl) {
      const cleanKey = manifest.apkUrl.trim();
      if (!cleanKey.startsWith("http://") && !cleanKey.startsWith("https://")) {
        if (publicBaseUrl) {
          manifest.apkUrl = `${publicBaseUrl.replace(/\/$/, "")}/${cleanKey.replace(/^\//, "")}`;
        } else if (isR2Configured()) {
          try {
            // Presigned URL valid for 24 hours (86400 seconds)
            manifest.apkUrl = await generatePresignedUrl(cleanKey, 86400);
          } catch (e: any) {
            console.error("[AppUpdate] Failed to presign APK URL:", e.message);
          }
        }
      } else if (cleanKey.includes(".r2.cloudflarestorage.com")) {
        // If it points to an internal R2 endpoint, rewrite to publicBaseUrl or presign securely
        try {
          const pathSegments = new URL(cleanKey).pathname.split("/").filter(Boolean);
          const bucket = getBucketName();
          const objectKey = pathSegments[0] === bucket ? pathSegments.slice(1).join("/") : pathSegments.join("/");
          if (publicBaseUrl && objectKey) {
            manifest.apkUrl = `${publicBaseUrl.replace(/\/$/, "")}/${objectKey}`;
          } else if (objectKey && isR2Configured()) {
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
