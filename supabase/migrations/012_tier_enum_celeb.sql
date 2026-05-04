-- =============================================================
-- Fix influencer_tier enum: add 'celeb', migrate 'mega' rows.
-- 'mid' and 'mega' remain in the type (Postgres can't drop enum
-- values without recreating the type) but the server never writes
-- them — normalizeTier() maps any 'mega' input to 'celeb'.
-- =============================================================

ALTER TYPE influencer_tier ADD VALUE IF NOT EXISTS 'celeb';

-- Migrate any existing rows that were seeded with the old value
UPDATE influencer_profiles SET tier = 'celeb' WHERE tier = 'mega';
