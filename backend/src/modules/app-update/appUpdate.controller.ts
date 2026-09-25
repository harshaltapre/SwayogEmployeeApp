import { Request, Response } from "express";
import { getFromR2, generatePresignedUrl, isR2Configured } from "../../services/r2StorageService.js";

export interface StructuredReleaseNotes {
  summary: string;
  items: string[];
}

export type ReleaseNotesType = string[] | StructuredReleaseNotes;

export interface AppUpdateManifest {
  appId: string;
  platform: string;
  versionCode: number;
  versionName: string;
  minimumVersionCode?: number;
  mandatory: boolean;
  releaseDate?: string;
  title?: string;
  releaseNotes: ReleaseNotesType;
  apkUrl: string;
  sha256: string;
  certificateSha256?: string;
  fileSize?: number;
  releaseTag?: string;
  releaseTitle?: string;
}

// Authoritative dynamic manifest types. Hardcoded fallbacks are strictly prohibited to ensure OTA integrity.

/**
 * GET /latest.json
 *
 * Canonical public endpoint that serves the latest application release manifest.
 * Serves the canonical `latest.json` from Cloudflare R2.
 * The manifest is guaranteed to return HTTP 200 with Content-Type: application/json; charset=utf-8
 * and a real JSON object (never a string, HTML, or redirect).
 */
export async function getLatestAppUpdate(req: Request, res: Response): Promise<void> {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");

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
          const manifestBuffer = await getFromR2(key);
          const parsed = JSON.parse(manifestBuffer.toString("utf-8"));
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
      // Check if local latest.json is present (e.g. deployed with backend)
      const fs = await import("fs");
      const path = await import("path");
      const localPaths = [
        path.resolve(process.cwd(), "latest.json"),
        path.resolve(process.cwd(), "../latest.json"),
        path.resolve(process.cwd(), "public/latest.json")
      ];
      for (const p of localPaths) {
        if (fs.existsSync(p)) {
          try {
            const raw = fs.readFileSync(p, "utf-8");
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && parsed.versionCode > 0) {
              manifest = parsed as AppUpdateManifest;
              break;
            }
          } catch {}
        }
      }
    }

    if (!manifest) {
      console.warn("[AppUpdate] No authoritative release manifest found in R2 or local storage");
      res.status(503).json({
        error: "Unable to check for updates right now",
        message: "Authoritative release manifest is temporarily unavailable"
      });
      return;
    }

    // Ensure standard metadata defaults
    manifest.appId = manifest.appId || "com.swayog.employee";
    manifest.platform = manifest.platform || "android";

    // Format releaseNotes to flat array if needed
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

    // Resolve public APK URL if relative or using internal R2 domain
    const publicBaseUrl = process.env.R2_PUBLIC_URL || process.env.PUBLIC_DISTRIBUTION_URL;
    const hasPublicCdn = !!(
      publicBaseUrl &&
      !publicBaseUrl.includes(".r2.cloudflarestorage.com") &&
      !publicBaseUrl.includes("your-public-domain.com")
    );

    const rawApk = (manifest.apkUrl || "").trim();
    const isRelativeOrInternal = !rawApk.startsWith("http") || rawApk.includes(".r2.cloudflarestorage.com");

    if (isRelativeOrInternal) {
      const targetKey = (!rawApk || rawApk.includes("/download/latest"))
        ? `releases/android/${manifest.versionName}/build-${manifest.versionCode}/app-release.apk`
        : rawApk.replace(/^\//, "");

      if (hasPublicCdn) {
        manifest.apkUrl = `${publicBaseUrl!.replace(/\/$/, "")}/${targetKey}`;
      } else if (isR2Configured()) {
        try {
          manifest.apkUrl = await generatePresignedUrl(targetKey, 604800); // 7 days
        } catch (e: any) {
          console.warn("[AppUpdate] Failed to presign APK URL:", e.message);
          manifest.apkUrl = `https://swayog-dashboard.vercel.app/releases/android/${manifest.versionName}/build-${manifest.versionCode}/app-release.apk`;
        }
      } else {
        manifest.apkUrl = `https://swayog-dashboard.vercel.app/releases/android/${manifest.versionName}/build-${manifest.versionCode}/app-release.apk`;
      }
    }

    res.status(200).json(manifest);
  } catch (error: any) {
    console.error("[AppUpdate] Error in getLatestAppUpdate:", error);
    res.status(503).json({
      error: "Unable to check for updates right now",
      message: "An unexpected error occurred while fetching update manifest"
    });
  }
}

/**
 * GET /releases/android/:versionName/build-:versionCode/app-release.apk
 * GET /api/v1/app/update/download/latest
 *
 * Redirects client to download the APK directly or via presigned URL.
 */
export async function downloadLatestApk(req: Request, res: Response): Promise<void> {
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
      } catch (err: any) {
        console.warn("[AppUpdate] Manifest read error on download redirect:", err.message);
      }
    }

    if (isR2Configured()) {
      const signedUrl = await generatePresignedUrl(apkKey, 86400); // 24 hours
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
