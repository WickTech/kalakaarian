-- Unified creator platform integration (Instagram + YouTube + future)
-- Replaces scattered instagram_* columns on influencer_profiles.

-- Platform enum
DO $$ BEGIN
  CREATE TYPE platform_kind AS ENUM ('instagram', 'youtube');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Per-creator OAuth account
CREATE TABLE IF NOT EXISTS creator_platform_accounts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform                 platform_kind NOT NULL,
  platform_user_id         TEXT NOT NULL,
  platform_username        TEXT,
  platform_profile_url     TEXT,
  access_token_encrypted   TEXT NOT NULL,
  refresh_token_encrypted  TEXT,
  token_expires_at         TIMESTAMPTZ,
  scopes                   TEXT[],
  connected_at             TIMESTAMPTZ DEFAULT now(),
  last_synced_at           TIMESTAMPTZ,
  last_sync_status         TEXT,
  last_sync_error          TEXT,
  deleted_at               TIMESTAMPTZ
);

-- One active account per creator per platform (soft-delete safe)
CREATE UNIQUE INDEX IF NOT EXISTS creator_platform_accounts_active_uq
  ON creator_platform_accounts (influencer_id, platform)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS creator_platform_accounts_influencer_idx
  ON creator_platform_accounts (influencer_id)
  WHERE deleted_at IS NULL;

-- Current snapshot per account
CREATE TABLE IF NOT EXISTS creator_platform_metrics (
  account_id           UUID PRIMARY KEY REFERENCES creator_platform_accounts(id) ON DELETE CASCADE,
  followers            INT,
  following            INT,
  posts_count          INT,
  reach_28d            INT,
  impressions_28d      INT,
  avg_likes            INT,
  avg_comments         INT,
  engagement_rate      NUMERIC(5,2),
  audience_gender_age  JSONB,
  audience_country     JSONB,
  top_media            JSONB,
  authenticity_score   INT,
  fetched_at           TIMESTAMPTZ DEFAULT now()
);

-- Daily history (append-only)
CREATE TABLE IF NOT EXISTS creator_platform_metric_history (
  id              BIGSERIAL PRIMARY KEY,
  account_id      UUID NOT NULL REFERENCES creator_platform_accounts(id) ON DELETE CASCADE,
  captured_at     DATE NOT NULL,
  followers       INT,
  engagement_rate NUMERIC(5,2),
  reach_28d       INT,
  UNIQUE (account_id, captured_at)
);

CREATE INDEX IF NOT EXISTS creator_platform_metric_history_account_date_idx
  ON creator_platform_metric_history (account_id, captured_at DESC);
