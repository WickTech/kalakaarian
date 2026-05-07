-- 017_ratings.sql
-- Ratings & Trust Layer (Phase 6). Additive only — safe to apply without downtime.

-- ─── Denormalized rating cache on influencer profiles ───────────────────────

ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS avg_rating   NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS rating_count INT NOT NULL DEFAULT 0;

-- ─── Ratings table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ratings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  UUID        NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  rater_id     UUID        NOT NULL REFERENCES profiles(id),
  rater_role   TEXT        NOT NULL CHECK (rater_role IN ('brand', 'influencer')),
  ratee_id     UUID        NOT NULL REFERENCES profiles(id),
  score        INT         NOT NULL CHECK (score BETWEEN 1 AND 5),
  review       TEXT        CHECK (char_length(review) <= 500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (proposal_id, rater_role)
);

CREATE INDEX IF NOT EXISTS idx_ratings_ratee_created ON ratings (ratee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_proposal      ON ratings (proposal_id);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "ratings_public_read" ON ratings
  FOR SELECT USING (TRUE);

CREATE POLICY IF NOT EXISTS "ratings_no_client_write" ON ratings
  FOR INSERT WITH CHECK (FALSE);

-- ─── Trigger: refresh avg_rating / rating_count on influencer_profiles ───────

CREATE OR REPLACE FUNCTION refresh_influencer_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE influencer_profiles
  SET
    avg_rating   = (
      SELECT ROUND(AVG(score)::NUMERIC, 2)
      FROM ratings
      WHERE ratee_id = NEW.ratee_id AND rater_role = 'brand'
    ),
    rating_count = (
      SELECT COUNT(*)::INT
      FROM ratings
      WHERE ratee_id = NEW.ratee_id AND rater_role = 'brand'
    )
  WHERE id = NEW.ratee_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER after_rating_upsert
  AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION refresh_influencer_rating();
