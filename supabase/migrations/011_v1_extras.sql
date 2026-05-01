-- =============================================================
-- KALAKAARIAN V1 EXTRAS — Extends the v2 base schema (001-010)
-- with tables and columns specific to the v1 feature set.
-- Apply AFTER running migrations 001-010 from kalakaarian-v2.
-- =============================================================


-- ─────────────────────────────────────────────
-- ADD COLUMNS: profiles
-- ─────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_phone_login  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS username        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS whatsapp_notifications JSONB NOT NULL DEFAULT '{
    "enabled": false,
    "campaigns": true,
    "proposals": true,
    "messages": true,
    "payments": true
  }'::jsonb;


-- ─────────────────────────────────────────────
-- ADD COLUMNS: influencer_profiles
-- ─────────────────────────────────────────────

ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS portfolio       TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS instagram_posts JSONB   NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS youtube_videos  JSONB   NOT NULL DEFAULT '[]';


-- ─────────────────────────────────────────────
-- ADD COLUMNS: contacts
-- Extends v2 contacts with phone + type fields
-- ─────────────────────────────────────────────

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS type  TEXT NOT NULL DEFAULT 'general'
    CHECK (type IN ('general', 'callback', 'business'));


-- ─────────────────────────────────────────────
-- ADD COLUMNS: cart_items
-- Adds per-item price (v1 stores it at add-time)
-- ─────────────────────────────────────────────

ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS price     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS added_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW();


-- ─────────────────────────────────────────────
-- TABLE: transactions
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  influencer_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id    UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  amount         NUMERIC(10, 2) NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_transactions_brand_id      ON transactions(brand_id);
CREATE INDEX IF NOT EXISTS idx_transactions_influencer_id ON transactions(influencer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_campaign_id   ON transactions(campaign_id);


-- ─────────────────────────────────────────────
-- TABLE: influencer_analytics
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS influencer_analytics (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id         UUID        NOT NULL UNIQUE REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  er                    NUMERIC(5, 4) NOT NULL DEFAULT 0,   -- engagement rate 0..1
  avg_views             NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cpv                   NUMERIC(10, 4) NOT NULL DEFAULT 0,  -- cost per view
  fake_followers_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  total_followers       INTEGER     NOT NULL DEFAULT 0,
  last_updated          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_influencer_analytics_updated_at
  BEFORE UPDATE ON influencer_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_influencer_analytics_influencer_id ON influencer_analytics(influencer_id);


-- ─────────────────────────────────────────────
-- TABLE: campaign_workflow
-- One row per campaign tracking shoot/upload/payment stages
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_workflow (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       UUID        NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
  selected_creators UUID[]      NOT NULL DEFAULT '{}',
  shooting          BOOLEAN     NOT NULL DEFAULT FALSE,
  shooting_at       TIMESTAMPTZ,
  uploaded          BOOLEAN     NOT NULL DEFAULT FALSE,
  uploaded_at       TIMESTAMPTZ,
  payment_done      BOOLEAN     NOT NULL DEFAULT FALSE,
  payment_at        TIMESTAMPTZ,
  videos            JSONB       NOT NULL DEFAULT '[]',
  notes             TEXT        NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_campaign_workflow_updated_at
  BEFORE UPDATE ON campaign_workflow
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_campaign_workflow_campaign_id ON campaign_workflow(campaign_id);


-- ─────────────────────────────────────────────
-- TABLE: campaign_videos
-- Individual deliverable video submissions per influencer
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_videos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id   UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  video_url     TEXT        NOT NULL,
  platform      TEXT        NOT NULL DEFAULT 'file'
    CHECK (platform IN ('instagram', 'youtube', 'file', 'drive')),
  status        TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'revision')),
  feedback      TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_campaign_videos_updated_at
  BEFORE UPDATE ON campaign_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_campaign_videos_campaign_id   ON campaign_videos(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_videos_influencer_id ON campaign_videos(influencer_id);


-- ─────────────────────────────────────────────
-- TABLE: otp_codes
-- Custom OTP storage (email-delivered, like v1).
-- Supabase cron or TTL-checked on read; no pg_cron needed.
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT        NOT NULL UNIQUE,
  otp_hash    TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);


-- ─────────────────────────────────────────────
-- RLS: new tables (service role bypasses RLS,
-- but enable for safety on client-facing tables)
-- ─────────────────────────────────────────────

ALTER TABLE transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_workflow  ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_videos    ENABLE ROW LEVEL SECURITY;

-- Transactions: brand or influencer can see their own
CREATE POLICY "transactions_select" ON transactions FOR SELECT
  USING (auth.uid() = brand_id OR auth.uid() = influencer_id);

-- Influencer analytics: public read
CREATE POLICY "influencer_analytics_select" ON influencer_analytics FOR SELECT
  USING (TRUE);
CREATE POLICY "influencer_analytics_upsert" ON influencer_analytics FOR ALL
  USING (auth.uid() = influencer_id);

-- Campaign workflow: campaign brand owner or selected creator
CREATE POLICY "campaign_workflow_select" ON campaign_workflow FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_workflow.campaign_id
        AND (c.brand_id = auth.uid() OR auth.uid() = ANY(campaign_workflow.selected_creators))
    )
  );
CREATE POLICY "campaign_workflow_update" ON campaign_workflow FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_workflow.campaign_id AND c.brand_id = auth.uid())
  );

-- Campaign videos: influencer owns their own, brand can view for their campaigns
CREATE POLICY "campaign_videos_select" ON campaign_videos FOR SELECT
  USING (
    auth.uid() = influencer_id OR
    EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND c.brand_id = auth.uid())
  );
CREATE POLICY "campaign_videos_insert" ON campaign_videos FOR INSERT
  WITH CHECK (auth.uid() = influencer_id);
CREATE POLICY "campaign_videos_update" ON campaign_videos FOR UPDATE
  USING (
    auth.uid() = influencer_id OR
    EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND c.brand_id = auth.uid())
  );
