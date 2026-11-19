import type { VercelRequest, VercelResponse } from "@vercel/node";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export interface AppUpdateManifest {
  appId: string;
  platform: string;
  versionName: string;
  versionCode: number;
  releaseDate?: string;
  mandatory?: boolean;
  minimumVersionCode?: number;
  apkUrl: string;
  sha256: string;
  fileSize?: number;
  title?: string;
  releaseNotes?: string[] | { summary?: string; items?: string[] };
  releaseTag?: string;
  releaseTitle?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enforce no-cache and JSON headers
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || "swayog-dashboard";

  if (endpoint && accessKeyId && secretAccessKey) {
    try {
      const client = new S3Client({
        region: "auto",
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });

      // Canonical manifest keys in Cloudflare R2
      const candidateKeys = [
        "latest.json",
        "releases/android/latest.json",
        "app/android/latest.json",
      ];

      for (const key of candidateKeys) {
        try {
          const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          });
          const response = await client.send(command);
          if (response.Body) {
            const chunks: Uint8Array[] = [];
            const stream = response.Body as AsyncIterable<Uint8Array>;
            for await (const chunk of stream) chunks.push(chunk);
            const buffer = Buffer.concat(chunks);
            const parsed = JSON.parse(buffer.toString("utf-8")) as AppUpdateManifest;

            if (
              parsed &&
              typeof parsed === "object" &&
              typeof parsed.versionCode === "number" &&
              parsed.versionCode > 0 &&
              parsed.versionName &&
              parsed.apkUrl &&
              parsed.sha256
            ) {
              parsed.appId = parsed.appId || "com.swayog.employee";
              parsed.platform = parsed.platform || "android";
              // Never return private unauthenticated R2 endpoint to Android clients
              if (
                parsed.apkUrl.includes(".r2.cloudflarestorage.com") &&
                !parsed.apkUrl.includes("X-Amz-Signature")
              ) {
                parsed.apkUrl = `https://swayog-dashboard.vercel.app/releases/android/${parsed.versionName}/build-${parsed.versionCode}/app-release.apk`;
              }
              return res.status(200).json(parsed);
            }
          }
        } catch {
          // Check next candidate key
        }
      }
    } catch (e: any) {
      console.error("[Vercel /latest.json] Cloudflare R2 retrieval error:", e.message);
    }
  }

  // Never return HTML, never return HTTP 404, never return stale hardcoded Build 20 fallback
  console.warn("[Vercel /latest.json] Authoritative manifest temporarily unavailable in R2");
  return res.status(503).json({
    error: "Update service is temporarily unavailable",
    message: "Authoritative release manifest is temporarily unavailable",
  });
}
