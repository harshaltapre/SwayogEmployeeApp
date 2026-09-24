import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

const BUCKET_NAME = env.R2_BUCKET_NAME;

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

export function getBucketName(): string {
  return BUCKET_NAME;
}

export function isR2Configured(): boolean {
  return !!(
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET_NAME &&
    env.R2_ENDPOINT
  );
}

export async function uploadToR2(
  buffer: Buffer,
  objectKey: string,
  mimeType: string,
  fileName: string
): Promise<{ objectKey: string; url: string }> {
  const client = getS3Client();
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
    Body: buffer,
    ContentType: mimeType,
    Metadata: {
      originalFileName: fileName,
      uploadedAt: new Date().toISOString(),
    },
  });

  await client.send(command);

  // Generate presigned URL for immediate access
  const url = await generatePresignedUrl(objectKey, 604800); // 7 days

  console.log(`[R2] Uploaded file: ${objectKey} (${buffer.length} bytes)`);

  return { objectKey, url };
}

export async function getFromR2(objectKey: string): Promise<Buffer> {
  const client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });

  const response = await client.send(command);
  
  if (!response.Body) {
    throw new Error(`No body received for object: ${objectKey}`);
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  const stream = response.Body as any;
  
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

export async function generatePresignedUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
  const client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });

  return await getSignedUrl(client, command, { expiresIn });
}