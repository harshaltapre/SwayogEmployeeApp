import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";

// Lazy S3 client for Cloudflare R2
let _s3Client: S3Client | null = null;

export function getS3Client(): S3Client | null {
  const endpoint = env.R2_ENDPOINT || process.env.R2_ENDPOINT;
  const accessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;

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
  return env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || "swayog-dashboard";
}


// Allowed file types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface UploadResult {
  objectKey: string;
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface R2Config {
  taskId: number | string;
  type: "before" | "after" | "site-visit" | string;
  fileName?: string;
}

/**
 * Generate a unique object key for R2 storage
 * Format: tasks/{taskType}/{customerName}/{taskId}/{type}/{uuid}.{ext}
 */
export function generateObjectKey(config: R2Config & { taskType?: string; customerName?: string }, fileName: string): string {
  const { taskId, type, taskType = "task", customerName = "unknown" } = config;
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const uuid = crypto.randomUUID();
  const cleanTaskId = String(taskId).replace(/^TASK-amc_|^amc_visit_|^amc_/, "");
  
  // Sanitize customer name for URL (remove special characters, replace spaces with hyphens)
  const sanitizedCustomerName = customerName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50); // Limit length
  
  // Sanitize task type for URL
  const sanitizedTaskType = taskType
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);
  
  return `tasks/${sanitizedTaskType}/${sanitizedCustomerName}/${cleanTaskId}/${type}/${uuid}.${ext}`;
}

/**
 * Validate file type
 */
export function validateFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return mimeToExt[mimeType] || "jpg";
}

/**
 * Upload a buffer to R2
 */
export async function uploadToR2(
  buffer: Buffer,
  objectKey: string,
  mimeType: string,
  fileName: string
): Promise<UploadResult> {
  const client = getS3Client();
  if (!client) {
    throw new Error("Cloudflare R2 client not initialized. Check R2 environment variables.");
  }

  if (!validateFileType(mimeType)) {
    throw new Error(`Invalid file type: ${mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`);
  }

  if (!validateFileSize(buffer.length)) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const bucketName = getBucketName();

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        originalFileName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    await client.send(command);

    // Generate secure presigned GET URL (valid for 7 days)
    let url: string;
    try {
      url = await generatePresignedUrl(objectKey, 604800);
    } catch {
      const endpoint = env.R2_ENDPOINT || process.env.R2_ENDPOINT;
      url = `${endpoint}/${bucketName}/${objectKey}`;
    }

    console.log(`[R2] Uploaded file: ${objectKey} (${buffer.length} bytes)`);

    return {
      objectKey,
      url,
      fileName,
      mimeType,
      fileSize: buffer.length,
    };
  } catch (error) {
    console.error("[R2] Upload failed:", error);
    throw new Error(`Failed to upload to R2: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract an R2 object key from an existing raw or signed R2 URL
 */
export function extractObjectKeyFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  if (!url.includes(".r2.cloudflarestorage.com/")) return null;

  try {
    const withoutHost = url.split(".r2.cloudflarestorage.com/")[1];
    if (!withoutHost) return null;
    const pathOnly = withoutHost.split("?")[0];
    const segments = pathOnly.split("/");
    if (segments[0] === env.R2_BUCKET_NAME) {
      return segments.slice(1).join("/");
    }
    return segments.join("/");
  } catch {
    return null;
  }
}

/**
 * Get an object from R2
 */
export async function getFromR2(objectKey: string): Promise<Buffer> {
  const client = getS3Client();
  if (!client) {
    throw new Error("Cloudflare R2 client not initialized. Check R2 environment variables.");
  }

  try {
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: objectKey,
    });

    const response = await client.send(command);

    if (!response.Body) {
      throw new Error("No body in response");
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    console.log(`[R2] Retrieved file: ${objectKey} (${buffer.length} bytes)`);

    return buffer;
  } catch (error) {
    console.error("[R2] Download failed:", error);
    throw new Error(`Failed to download from R2: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete an object from R2
 */
export async function deleteFromR2(objectKey: string): Promise<void> {
  const client = getS3Client();
  if (!client) {
    throw new Error("Cloudflare R2 client not initialized. Check R2 environment variables.");
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: objectKey,
    });

    await client.send(command);

    console.log(`[R2] Deleted file: ${objectKey}`);
  } catch (error) {
    console.error("[R2] Delete failed:", error);
    throw new Error(`Failed to delete from R2: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// In-memory cache for presigned URLs to minimize crypto/signing overhead
const presignedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Generate a presigned URL for temporary access (with in-memory cache)
 */
export async function generatePresignedUrl(
  objectKey: string,
  expiresIn: number = 86400 // default 24 hours
): Promise<string> {
  const client = getS3Client();
  if (!client) {
    throw new Error("Cloudflare R2 client not initialized. Check R2 environment variables.");
  }

  const now = Date.now();
  const cacheKey = `${objectKey}:${expiresIn}`;
  const cached = presignedUrlCache.get(cacheKey);

  // Return cached presigned URL if it still has at least 15 minutes of validity remaining
  if (cached && cached.expiresAt > now + 15 * 60 * 1000) {
    return cached.url;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: objectKey,
    });

    const url = await getSignedUrl(client, command, { expiresIn });

    // Store in cache
    presignedUrlCache.set(cacheKey, {
      url,
      expiresAt: now + expiresIn * 1000,
    });

    // Prune cache if it grows too large (> 5000 items)
    if (presignedUrlCache.size > 5000) {
      for (const [k, v] of presignedUrlCache.entries()) {
        if (v.expiresAt <= now) {
          presignedUrlCache.delete(k);
        }
      }
    }

    return url;
  } catch (error) {
    console.error("[R2] Presigned URL generation failed:", error);
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a public URL for an object (assuming bucket is public)
 */
export function generatePublicUrl(objectKey: string): string {
  if (!env.R2_ENDPOINT) {
    throw new Error("R2_ENDPOINT not configured");
  }

  return `${env.R2_ENDPOINT}/${getBucketName()}/${objectKey}`;
}

/**
 * Check if R2 is properly configured
 */
export function isR2Configured(): boolean {
  return !!getS3Client();
}

/**
 * Get R2 configuration status (for debugging)
 */
export function getR2Status() {
  const client = getS3Client();
  const endpoint = env.R2_ENDPOINT || process.env.R2_ENDPOINT;
  const accountId = env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = getBucketName();

  return {
    configured: !!client,
    hasAccountId: !!accountId,
    hasAccessKeyId: !!accessKeyId,
    hasSecretAccessKey: !!secretKey,
    hasBucketName: !!bucketName,
    hasEndpoint: !!endpoint,
    bucketName,
    endpoint,
  };
}
