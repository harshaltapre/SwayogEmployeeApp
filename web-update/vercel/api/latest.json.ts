import type { VercelRequest, VercelResponse } from "@vercel/node";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Fallback manifest for Build 20
const DEFAULT_MANIFEST = {
  appId: "com.swayog.employee",
  platform: "android",
  versionName: "1.0.0",
  versionCode: 20,
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
  fileSize: 76872575
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

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
      });

      for (const key of ["latest.json", "releases/android/latest.json"]) {
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
            const parsed = JSON.parse(buffer.toString("utf-8"));
            if (parsed && typeof parsed === "object" && parsed.versionCode > 0) {
              return res.status(200).json(parsed);
            }
          }
        } catch {
          // Try next key
        }
      }
    } catch (e: any) {
      console.error("[Vercel latest.json] R2 retrieval failed:", e.message);
    }
  }

  return res.status(200).json(DEFAULT_MANIFEST);
}
