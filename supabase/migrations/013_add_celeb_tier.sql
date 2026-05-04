-- =============================================================
-- Add 'celeb' to influencer_tier enum.
-- v2 base schema only had: nano, micro, mid, macro, mega.
-- Server renamed 'mega' -> 'celeb' in the celeb-tier refactor.
-- Applied to DB 2026-05-03; mid/mega remain (cannot drop enum values).
-- =============================================================

ALTER TYPE influencer_tier ADD VALUE IF NOT EXISTS 'celeb';
UPDATE influencer_profiles SET tier = 'celeb' WHERE tier = 'mega';
