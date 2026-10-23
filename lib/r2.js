import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export function getR2Client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_DOMAIN) {
    throw new Error('R2 environment variables are not fully configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY,
      secretAccessKey: R2_SECRET_KEY,
    },
  });
}

export async function uploadToR2({ buffer, key, contentType = 'image/webp' }) {
  const { R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } = process.env;
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${R2_PUBLIC_DOMAIN.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`;
}
