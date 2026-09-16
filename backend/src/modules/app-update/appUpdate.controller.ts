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
  apkUrl: "releases/android/1.0.0/build-20/app-release.apk",
  sha256: "dd5422cce433152653308bb0ba04ba6159a35ebf4c4b9f90eeb32670289ba3c4",
  fileSize: 76872575
};

/**
 * GET /latest.json
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
          if (manifest && manifest.versionCode > 0) break;
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

    // Resolve apkUrl: if it refers to an R2 object key or internal endpoint, generate a presigned or public URL
    const publicBaseUrl = process.env.R2_PUBLIC_URL || process.env.PUBLIC_DISTRIBUTION_URL;
    const hasPublicCdn = !!(
      publicBaseUrl &&
      !publicBaseUrl.includes(".r2.cloudflarestorage.com") &&
      !publicBaseUrl.includes("your-public-domain.com")
    );

    const rawApk = (manifest.apkUrl || "").trim();
    const isSelfRedirect = rawApk.includes("/app/update/download/latest");

    if (!rawApk || isSelfRedirect || !rawApk.startsWith("http")) {
      const targetKey = (!rawApk || isSelfRedirect)
        ? `releases/android/${manifest.versionName}/build-${manifest.versionCode}/app-release.apk`
        : rawApk.replace(/^\//, "");

      if (hasPublicCdn) {
        manifest.apkUrl = `${publicBaseUrl!.replace(/\/$/, "")}/${targetKey}`;
      } else if (isR2Configured()) {
        try {
          // Presigned URL valid for up to 7 days (604800 seconds max in SigV4)
          manifest.apkUrl = await generatePresignedUrl(targetKey, 604800);
        } catch (e: any) {
          console.error("[AppUpdate] Failed to presign APK URL:", e.message);
        }
      }
    } else if (rawApk.includes(".r2.cloudflarestorage.com")) {
      // If it points to an internal R2 endpoint, rewrite to publicBaseUrl or presign securely
      try {
        const pathSegments = new URL(rawApk).pathname.split("/").filter(Boolean);
        const bucket = getBucketName();
        const objectKey = pathSegments[0] === bucket ? pathSegments.slice(1).join("/") : pathSegments.join("/");
        if (hasPublicCdn && objectKey) {
          manifest.apkUrl = `${publicBaseUrl!.replace(/\/$/, "")}/${objectKey}`;
        } else if (objectKey && isR2Configured()) {
          manifest.apkUrl = await generatePresignedUrl(objectKey, 604800);
        }
      } catch {
        // Keep original URL
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
        const candidateApk = (manifest.apkUrl || "").trim();

        if (candidateApk && candidateApk.startsWith("http") && !candidateApk.includes("/download/latest")) {
          res.redirect(302, candidateApk);
          return;
        } else if (candidateApk && !candidateApk.startsWith("http")) {
          apkKey = candidateApk.replace(/^\//, "");
        } else if (manifest.versionName && manifest.versionCode) {
          apkKey = `releases/android/${manifest.versionName}/build-${manifest.versionCode}/app-release.apk`;
        }
      } catch (err: any) {
        console.warn("[AppUpdate] Manifest read error on download redirect:", err.message);
      }

      // Max 7 days in SigV4, or 24 hours (86400s) for redirects
      const signedUrl = await generatePresignedUrl(apkKey, 86400);
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
