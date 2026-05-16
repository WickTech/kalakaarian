-- Add state field to influencer_profiles
ALTER TABLE influencer_profiles ADD COLUMN IF NOT EXISTS state TEXT;
