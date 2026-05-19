-- Migration 033: media bucket for large videos + gallery images
--
-- Path convention: {purpose}/{userId}/{uuid}.{ext}
--   purpose ∈ ('video', 'gallery')
-- 500 MB cap to allow campaign / reel video uploads.
-- Service role (adminClient) bypasses RLS; policies below cover any future
-- client-direct writes.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  524288000,
  ARRAY[
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types,
      public             = EXCLUDED.public;

CREATE POLICY "media_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "media_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "media_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "media_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );
