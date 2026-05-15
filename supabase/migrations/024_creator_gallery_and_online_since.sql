-- 024: Creator gallery images + online_since timestamp
-- Adds a curated gallery of up to N images on influencer_profiles, plus an
-- online_since timestamp captured each time the creator toggles presence on.

ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}';

ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS online_since timestamptz NULL;
