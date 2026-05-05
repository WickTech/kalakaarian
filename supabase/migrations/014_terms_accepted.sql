-- Track T&C acceptance per user for legal compliance
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
