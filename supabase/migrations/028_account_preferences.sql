-- Account preferences: privacy flags, notification prefs, data export requests

-- Privacy / discovery flags for creators
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS is_discoverable     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketplace_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS presence_visible    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS profile_visibility  text    NOT NULL DEFAULT 'public'
    CHECK (profile_visibility IN ('public', 'brands_only', 'private'));

-- Privacy flags for brands
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS marketplace_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS profile_visibility  text    NOT NULL DEFAULT 'public'
    CHECK (profile_visibility IN ('public', 'private'));

-- Notification preferences on the base profile row (works for all roles)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{
    "campaigns": true,
    "proposals": true,
    "messages":  true,
    "payments":  true,
    "marketing": false
  }'::jsonb;

-- Audit table for GDPR-style data export requests
CREATE TABLE IF NOT EXISTS data_export_requests (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       text         NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'fulfilled', 'rejected')),
  requested_at timestamptz  NOT NULL DEFAULT now(),
  fulfilled_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_status
  ON data_export_requests (user_id, status);
