import type { VercelRequest, VercelResponse } from "@vercel/node";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

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

      // Canonical manifest key in R2
      const candidateKeys = ["latest.json", "releases/android/latest.json"];
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

  // Never return an old stale fallback release like Build 20.
  // Return explicit 503 so client displays "Unable to check for updates right now".
  return res.status(503).json({
    error: "Unable to check for updates right now",
    message: "Authoritative release manifest is temporarily unavailable"
  });
}
