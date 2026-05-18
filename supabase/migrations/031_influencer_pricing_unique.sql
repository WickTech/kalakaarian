-- Adds the unique constraint that completeGoogleOnboarding and updateInfluencerProfile
-- depend on for ON CONFLICT upserts. Without this, pricing inserts silently fail
-- (PostgREST rejects ON CONFLICT specifications that don't match any unique index).
ALTER TABLE influencer_pricing
  ADD CONSTRAINT influencer_pricing_unique_combo
  UNIQUE (influencer_id, platform, content_type);
