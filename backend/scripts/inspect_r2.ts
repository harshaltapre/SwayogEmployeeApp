import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function check() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME || 'swayog-dashboard';

  console.log('Connecting to R2 with bucket:', bucket, 'endpoint:', endpoint);

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });

  try {
    const listCmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: 'releases/' });
    const listRes = await client.send(listCmd);
    console.log('Releases objects:');
    for (const c of listRes.Contents || []) {
      console.log(` - ${c.Key} (${c.Size} bytes, modified ${c.LastModified})`);
    }
  } catch (err: any) {
    console.error('List releases failed:', err.message);
  }

  for (const k of ['latest.json', 'releases/android/latest.json']) {
    try {
      const getCmd = new GetObjectCommand({ Bucket: bucket, Key: k });
      const getRes = await client.send(getCmd);
      const chunks: Uint8Array[] = [];
      for await (const chunk of getRes.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      console.log(`\n=== Manifest in R2 at ${k} ===`);
      console.log(Buffer.concat(chunks).toString('utf-8'));
    } catch (e: any) {
      console.log(`Error reading ${k} from R2:`, e.message);
    }
  }
}

check().catch(console.error);
