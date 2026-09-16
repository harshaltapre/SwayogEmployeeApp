import type { Request, Response } from "express";
import { getFromR2, generatePresignedDownloadUrl, isR2Configured } from "./r2StorageService.js";

export interface AppUpdateManifest {
  appId: string;
  platform: string;
  versionCode: number;
  versionName: string;
  minimumVersionCode?: number;
  mandatory: boolean;
  releaseDate?: string;
  releaseTag?: string;
  releaseTitle?: string;
  releaseNotes: string[];
  apkUrl: string;
  sha256: string;
  fileSize?: number;
}

/**
 * Authoritative fallback manifest for Build 20 if R2 is temporarily unreachable.
 */
export const DEFAULT_FALLBACK_MANIFEST: AppUpdateManifest = {
  appId: "com.swayog.employee",
  platform: "android",
  versionCode: 20,
  versionName: "1.0.0",
  minimumVersionCode: 1,
  mandatory: false,
  releaseDate: "2026-09-15",
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
  apkUrl: "https://swayog-dashboard.vercel.app/api/v1/app/update/download/latest",
  sha256: "dd5422cce433152653308bb0ba04ba6159a35ebf4c4b9f90eeb32670289ba3c4",
  fileSize: 76872575,
};

/**
 * GET /latest.json
 * 
 * Serves the authoritative application release manifest.
 * Guaranteed to return HTTP 200 with Content-Type: application/json; charset=utf-8
 * and a real JSON object (never a string, HTML, or SPA redirect).
 */
export async function getLatestAppUpdate(req: Request, res: Response): Promise<void> {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    let manifest: AppUpdateManifest | null = null;

    if (isR2Configured()) {
      const candidateKeys = [
        "latest.json",
        "releases/android/latest.json",
        "app/android/latest.json"
      ];

      for (const key of candidateKeys) {
        try {
          const buffer = await getFromR2(key);
          const parsed = JSON.parse(buffer.toString("utf-8"));
          if (parsed && typeof parsed === "object" && parsed.versionCode > 0) {
            manifest = parsed as AppUpdateManifest;
            break;
          }
        } catch {
          // Check next candidate key
        }
      }
    }

    if (!manifest) {
      manifest = { ...DEFAULT_FALLBACK_MANIFEST };
    }

    // Enforce required contract fields
    manifest.appId = manifest.appId || "com.swayog.employee";
    manifest.platform = manifest.platform || "android";
    if (!Array.isArray(manifest.releaseNotes)) {
      if (typeof manifest.releaseNotes === "string") {
        manifest.releaseNotes = [manifest.releaseNotes];
      } else if (manifest.releaseNotes && typeof manifest.releaseNotes === "object") {
        const notesObj = manifest.releaseNotes as any;
        manifest.releaseNotes = Array.isArray(notesObj.items) ? notesObj.items : [];
      } else {
        manifest.releaseNotes = [];
      }
    }

    // Resolve public APK URL if needed
    const publicBaseUrl = process.env.R2_PUBLIC_URL || process.env.PUBLIC_DISTRIBUTION_URL;
    const hasPublicDomain = !!(
      publicBaseUrl &&
      !publicBaseUrl.includes(".r2.cloudflarestorage.com") &&
      !publicBaseUrl.includes("your-public-domain.com")
    );

    const rawApk = (manifest.apkUrl || "").trim();
    const isRelativeOrInternal = !rawApk.startsWith("http") || rawApk.includes(".r2.cloudflarestorage.com");

    if (isRelativeOrInternal) {
      const apkKey = `releases/android/${manifest.versionName}/build-${manifest.versionCode}/app-release.apk`;
      if (hasPublicDomain) {
        manifest.apkUrl = `${publicBaseUrl!.replace(/\/$/, "")}/${apkKey}`;
      } else if (isR2Configured()) {
        try {
          manifest.apkUrl = await generatePresignedDownloadUrl(apkKey, 604800); // 7 days
        } catch (e: any) {
          console.warn("[AppUpdate] Could not presign APK URL:", e.message);
          manifest.apkUrl = "https://swayog-dashboard.vercel.app/api/v1/app/update/download/latest";
        }
      }
    }

    res.status(200).json(manifest);
  } catch (err: any) {
    console.error("[AppUpdate] Unexpected error serving manifest:", err);
    res.status(200).json(DEFAULT_FALLBACK_MANIFEST);
  }
}

/**
 * GET /releases/android/:versionName/build-:versionCode/app-release.apk
 * GET /api/v1/app/update/download/latest
 *
 * Redirects client or streams APK from R2.
 */
export async function downloadReleaseApk(req: Request, res: Response): Promise<void> {
  try {
    const { versionName, versionCode } = req.params;
    let apkKey = "releases/android/latest.apk";

    if (versionName && versionCode) {
      apkKey = `releases/android/${versionName}/build-${versionCode}/app-release.apk`;
    } else if (isR2Configured()) {
      try {
        const manifestBuffer = await getFromR2("latest.json");
        const manifest = JSON.parse(manifestBuffer.toString("utf-8"));
        if (manifest.versionName && manifest.versionCode) {
          apkKey = `releases/android/${manifest.versionName}/build-${manifest.versionCode}/app-release.apk`;
        }
      } catch {
        // use default latest.apk key
      }
    }

    if (isR2Configured()) {
      const signedUrl = await generatePresignedDownloadUrl(apkKey, 86400); // 24 hours
      res.redirect(302, signedUrl);
      return;
    }

    res.status(404).json({ error: "Release storage is not configured" });
  } catch (err: any) {
    console.error("[AppUpdate] Download redirect error:", err);
    res.status(500).json({ error: "Failed to resolve download URL" });
  }
}
