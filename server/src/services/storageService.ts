import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3: S3Client | null = null;

function getS3(): S3Client | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;
  if (!s3) {
    s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    });
  }
  return s3;
}

const BUCKET = process.env.R2_BUCKET || 'kalakaarian';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

export const getPresignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<{ uploadUrl: string; fileUrl: string } | null> => {
  const client = getS3();
  if (!client) return null;

  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const fileUrl = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : uploadUrl.split('?')[0];
  return { uploadUrl, fileUrl };
};

export const deleteFile = async (key: string): Promise<void> => {
  const client = getS3();
  if (!client) return;
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};
