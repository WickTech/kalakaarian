-- Super admin role, user management columns, audit logs, feature flags

-- profiles: super admin flag + suspension
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- Seed super admins
UPDATE profiles SET is_super_admin = TRUE
  WHERE email IN ('masteranhad@gmail.com', 'rishabhverma707@gmail.com');

-- influencer_profiles: manual verification flag
ALTER TABLE influencer_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Admin action audit trail
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   UUID NOT NULL REFERENCES profiles(id),
  action     TEXT NOT NULL,
  target_type TEXT,
  target_id  TEXT,
  details    JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_idx   ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_idx ON admin_audit_logs(created_at DESC);

-- Platform feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  key        TEXT PRIMARY KEY,
  enabled    BOOLEAN DEFAULT TRUE,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO feature_flags (key, enabled, description) VALUES
  ('maintenance_mode',      FALSE, 'Take the site offline for maintenance'),
  ('new_registrations',     TRUE,  'Allow new user registrations'),
  ('marketplace_visible',   TRUE,  'Show marketplace to brands'),
  ('campaign_creation',     TRUE,  'Allow brands to create new campaigns'),
  ('creator_registrations', TRUE,  'Allow new creator sign-ups')
ON CONFLICT (key) DO NOTHING;
