-- Migration 040: campaign-files bucket — allow Word brief uploads
--
-- The 'campaign-files' bucket was created out-of-band (2026-04-30) and never
-- tracked in a migration. Its allowed_mime_types only covered images + PDF,
-- so .doc/.docx campaign briefs (offered by the CartPage file input and the
-- 'campaign' purpose in routes/upload.ts) were rejected by the bucket even
-- after presign succeeded.
--
-- This migration records the full intended state of the bucket so prod is
-- reproducible from supabase/migrations/. Idempotent via ON CONFLICT.
--
-- Path convention: {purpose}/{userId}/{uuid}.{ext}  (purpose = 'campaign')

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-files',
  'campaign-files',
  true,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types,
      public             = EXCLUDED.public;
