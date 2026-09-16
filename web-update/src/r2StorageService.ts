import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _s3Client: S3Client | null = null;

export function getR2Client(): S3Client | null {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  if (!_s3Client) {
    _s3Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return _s3Client;
}

export function getBucketName(): string {
  return process.env.R2_BUCKET_NAME || "swayog-dashboard";
}

export function isR2Configured(): boolean {
  return !!getR2Client();
}

/**
 * Reads an object buffer directly from Cloudflare R2
 */
export async function getFromR2(objectKey: string): Promise<Buffer> {
  const client = getR2Client();
  if (!client) {
    throw new Error("Cloudflare R2 client is not configured");
  }

  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: objectKey,
  });

  const response = await client.send(command);
  if (!response.Body) {
    throw new Error(`Empty body returned for R2 object: ${objectKey}`);
  }

  const chunks: Uint8Array[] = [];
  const stream = response.Body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// In-memory cache for presigned URLs (expires in 24h)
const presignedCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Generates a presigned GET URL for an object in R2
 */
export async function generatePresignedDownloadUrl(
  objectKey: string,
  expiresInSeconds: number = 86400
): Promise<string> {
  const client = getR2Client();
  if (!client) {
    throw new Error("Cloudflare R2 client is not configured");
  }

  const now = Date.now();
  const cacheKey = `${objectKey}:${expiresInSeconds}`;
  const cached = presignedCache.get(cacheKey);

  if (cached && cached.expiresAt > now + 15 * 60 * 1000) {
    return cached.url;
  }

  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: objectKey,
  });

  const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  presignedCache.set(cacheKey, {
    url,
    expiresAt: now + expiresInSeconds * 1000,
  });

  return url;
}
