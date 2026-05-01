import { adminClient } from '../config/supabase';

// Bucket name → purpose mapping
const BUCKET_MAP: Record<string, string> = {
  profile: 'avatars',
  campaign: 'campaign-files',
  video: 'campaign-files',
};

export const getPresignedUploadUrl = async (
  key: string,
  _contentType: string,
  expiresIn = 300
): Promise<{ uploadUrl: string; fileUrl: string } | null> => {
  const purpose = key.split('/')[0] ?? 'campaign';
  const bucket = BUCKET_MAP[purpose] ?? 'campaign-files';

  const { data, error } = await adminClient.storage
    .from(bucket)
    .createSignedUploadUrl(key, { upsert: true });

  if (error || !data) return null;

  const { data: publicData } = adminClient.storage.from(bucket).getPublicUrl(key);

  return {
    uploadUrl: data.signedUrl,
    fileUrl: publicData.publicUrl,
  };
};

export const deleteFile = async (key: string): Promise<void> => {
  const purpose = key.split('/')[0] ?? 'campaign';
  const bucket = BUCKET_MAP[purpose] ?? 'campaign-files';
  await adminClient.storage.from(bucket).remove([key]);
};
