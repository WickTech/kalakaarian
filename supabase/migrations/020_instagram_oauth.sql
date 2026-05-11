-- Add per-creator Instagram OAuth columns
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS instagram_access_token TEXT,
  ADD COLUMN IF NOT EXISTS instagram_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS instagram_ig_user_id TEXT;
