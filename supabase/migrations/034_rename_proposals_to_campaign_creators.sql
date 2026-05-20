-- 034_rename_proposals_to_campaign_creators.sql
-- Per product decision (2026-05-20): creators no longer bid on campaigns.
-- Brand-only selection flow: marketplace pick -> cart -> checkout -> campaign_creators row.
--
-- IDEMPOTENT / consolidated: prod skipped earlier workflow migrations (015 etc.),
-- so this also adds the workflow_stage columns, activity log, cron_runs table,
-- and transition_workflow_stage RPC. Safe to re-run.
--
-- Start state (prod, observed 2026-05-20):
--   - proposals(id, campaign_id, influencer_id, bid_amount, message, status,
--               created_at, updated_at)
--   - ratings(... proposal_id FK to proposals)
--   - workflow_events(... proposal_id FK to proposals)
--   - missing: proposal_activity_log, cron_runs, transition_workflow_stage RPC,
--              workflow_stage columns
-- End state:
--   - campaign_creators (renamed, with workflow columns)
--   - campaign_creator_activity_log
--   - cron_runs
--   - ratings/workflow_events with campaign_creator_id FK
--   - transition_workflow_stage(p_campaign_creator_id, ...) RPC

BEGIN;

-- 1. Drop legacy notify trigger (created by v2 base 010_email_triggers.sql).
--    Rows are now created by the brand at checkout, not the creator.
DROP TRIGGER  IF EXISTS trg_notify_brand_proposal     ON proposals;
DROP FUNCTION IF EXISTS _notify_brand_on_proposal();

-- 2. Drop any older RPC variants so we can recreate cleanly.
DROP FUNCTION IF EXISTS transition_workflow_stage(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, INT);
DROP FUNCTION IF EXISTS transition_workflow_stage(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB);

-- 3. Add workflow_* columns to proposals (from migration 015 which never landed in prod).
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS workflow_stage TEXT
    CHECK (workflow_stage IN (
      'shortlisted','accepted','content_in_progress','submitted',
      'under_review','approved','payment_pending','payment_released',
      'rejected_workflow'
    )),
  ADD COLUMN IF NOT EXISTS workflow_stage_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_approve_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_submission JSONB,
  ADD COLUMN IF NOT EXISTS transaction_ref TEXT;

-- 4. Rename proposals -> campaign_creators.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_schema='public' AND table_name='proposals')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables
                      WHERE table_schema='public' AND table_name='campaign_creators') THEN
    EXECUTE 'ALTER TABLE proposals RENAME TO campaign_creators';
  END IF;
END $$;

-- 5. Rename bid_amount -> agreed_price.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public'
                AND table_name='campaign_creators'
                AND column_name='bid_amount') THEN
    EXECUTE 'ALTER TABLE campaign_creators RENAME COLUMN bid_amount TO agreed_price';
  END IF;
END $$;

-- 6. Rename FK columns on dependent tables.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public'
                AND table_name='ratings' AND column_name='proposal_id') THEN
    EXECUTE 'ALTER TABLE ratings RENAME COLUMN proposal_id TO campaign_creator_id';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public'
                AND table_name='workflow_events' AND column_name='proposal_id') THEN
    EXECUTE 'ALTER TABLE workflow_events RENAME COLUMN proposal_id TO campaign_creator_id';
  END IF;
END $$;

-- 7. Rename indexes (no-op if names don't exist).
ALTER INDEX IF EXISTS idx_proposals_campaign_id       RENAME TO idx_campaign_creators_campaign_id;
ALTER INDEX IF EXISTS idx_proposals_influencer_id     RENAME TO idx_campaign_creators_influencer_id;
ALTER INDEX IF EXISTS idx_ratings_proposal            RENAME TO idx_ratings_campaign_creator;
ALTER INDEX IF EXISTS idx_workflow_events_proposal_id RENAME TO idx_workflow_events_campaign_creator_id;

-- 8. Rename updated_at trigger if it was on the old name.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger
              WHERE tgname='trg_proposals_updated_at'
                AND tgrelid='public.campaign_creators'::regclass) THEN
    EXECUTE 'ALTER TRIGGER trg_proposals_updated_at ON campaign_creators '
            'RENAME TO trg_campaign_creators_updated_at';
  END IF;
END $$;

-- 9. Create the activity log table (renamed from proposal_activity_log).
CREATE TABLE IF NOT EXISTS campaign_creator_activity_log (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_creator_id UUID        NOT NULL REFERENCES campaign_creators(id) ON DELETE CASCADE,
  actor_id            UUID        REFERENCES profiles(id),
  actor_role          TEXT,
  action              TEXT        NOT NULL,
  from_stage          TEXT,
  to_stage            TEXT,
  details             JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_creator_activity_log_created
  ON campaign_creator_activity_log (campaign_creator_id, created_at DESC);

ALTER TABLE campaign_creator_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_log_select"           ON campaign_creator_activity_log;
DROP POLICY IF EXISTS "activity_log_no_client_write"  ON campaign_creator_activity_log;

CREATE POLICY "activity_log_select" ON campaign_creator_activity_log
  FOR SELECT USING (
    auth.uid() IN (
      SELECT cc.influencer_id FROM campaign_creators cc WHERE cc.id = campaign_creator_id
      UNION
      SELECT c.brand_id FROM campaign_creators cc
        JOIN campaigns c ON cc.campaign_id = c.id
        WHERE cc.id = campaign_creator_id
    )
  );

CREATE POLICY "activity_log_no_client_write" ON campaign_creator_activity_log
  FOR INSERT WITH CHECK (FALSE);

-- 10. Cron heartbeat table (from 015).
CREATE TABLE IF NOT EXISTS cron_runs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job         TEXT        NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  processed   INT,
  error       TEXT
);

-- 11. Workflow-stage transition RPC.
CREATE OR REPLACE FUNCTION transition_workflow_stage(
  p_campaign_creator_id UUID,
  p_actor_id            UUID,
  p_actor_role          TEXT,
  p_expected_stage      TEXT,
  p_to_stage            TEXT,
  p_action              TEXT,
  p_details             JSONB    DEFAULT NULL,
  p_auto_approve_hours  INT      DEFAULT 72
) RETURNS campaign_creators
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row               campaign_creators;
  v_allowed           BOOLEAN := FALSE;
  v_auto_approve_at   TIMESTAMPTZ;
  v_clear_submission  BOOLEAN := FALSE;
  v_new_submission    JSONB;
BEGIN
  SELECT * INTO v_row FROM campaign_creators
    WHERE id = p_campaign_creator_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign_creator % not found', p_campaign_creator_id
      USING ERRCODE = 'P0002';
  END IF;

  IF p_expected_stage IS NULL THEN
    IF v_row.workflow_stage IS NOT NULL THEN
      RAISE EXCEPTION 'Stage conflict: expected NULL but found %', v_row.workflow_stage
        USING ERRCODE = '23P01';
    END IF;
  ELSE
    IF v_row.workflow_stage IS DISTINCT FROM p_expected_stage THEN
      RAISE EXCEPTION 'Stage conflict: expected % but found %',
        p_expected_stage, v_row.workflow_stage
        USING ERRCODE = '23P01';
    END IF;
  END IF;

  v_allowed := CASE
    WHEN v_row.workflow_stage IS NULL
         AND p_to_stage = 'shortlisted'
         AND p_actor_role IN ('brand', 'system')                                 THEN TRUE
    WHEN v_row.workflow_stage IS NULL
         AND p_to_stage = 'approved'
         AND p_actor_role = 'system'                                             THEN TRUE
    WHEN v_row.workflow_stage = 'shortlisted'
         AND p_to_stage = 'accepted'
         AND p_actor_role = 'brand'                                              THEN TRUE
    WHEN v_row.workflow_stage = 'shortlisted'
         AND p_to_stage = 'rejected_workflow'
         AND p_actor_role = 'brand'                                              THEN TRUE
    WHEN v_row.workflow_stage = 'accepted'
         AND p_to_stage = 'content_in_progress'
         AND p_actor_role = 'influencer'                                         THEN TRUE
    WHEN v_row.workflow_stage = 'content_in_progress'
         AND p_to_stage = 'submitted'
         AND p_actor_role = 'influencer'                                         THEN TRUE
    WHEN v_row.workflow_stage = 'submitted'
         AND p_to_stage = 'under_review'
         AND p_actor_role = 'system'                                             THEN TRUE
    WHEN v_row.workflow_stage = 'under_review'
         AND p_to_stage = 'approved'
         AND p_actor_role IN ('brand', 'system')                                 THEN TRUE
    WHEN v_row.workflow_stage = 'under_review'
         AND p_to_stage = 'content_in_progress'
         AND p_actor_role = 'brand'                                              THEN TRUE
    WHEN v_row.workflow_stage = 'approved'
         AND p_to_stage = 'payment_pending'
         AND p_actor_role IN ('admin', 'system')                                 THEN TRUE
    WHEN v_row.workflow_stage = 'payment_pending'
         AND p_to_stage = 'payment_released'
         AND p_actor_role IN ('admin', 'system')                                 THEN TRUE
    WHEN v_row.workflow_stage NOT IN ('rejected_workflow', 'payment_released')
         AND p_to_stage = 'rejected_workflow'
         AND p_actor_role = 'brand'                                              THEN TRUE
    ELSE FALSE
  END;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Transition % -> % not allowed for role %',
      COALESCE(v_row.workflow_stage, 'NULL'), p_to_stage, p_actor_role
      USING ERRCODE = 'P0001';
  END IF;

  IF p_to_stage = 'under_review' THEN
    v_auto_approve_at := NOW() + (p_auto_approve_hours || ' hours')::INTERVAL;
  END IF;

  IF p_to_stage = 'content_in_progress' AND v_row.workflow_stage = 'under_review' THEN
    v_clear_submission := TRUE;
  END IF;

  IF p_to_stage = 'submitted' THEN
    v_new_submission := p_details;
  END IF;

  IF p_to_stage = 'accepted' THEN
    UPDATE campaign_creators SET status = 'accepted'
     WHERE id = p_campaign_creator_id AND status != 'accepted';
  END IF;

  UPDATE campaign_creators SET
    workflow_stage             = p_to_stage,
    workflow_stage_updated_at  = NOW(),
    auto_approve_at            = CASE
                                   WHEN p_to_stage = 'under_review' THEN v_auto_approve_at
                                   ELSE auto_approve_at
                                 END,
    current_submission         = CASE
                                   WHEN v_clear_submission THEN NULL
                                   WHEN v_new_submission IS NOT NULL THEN v_new_submission
                                   ELSE current_submission
                                 END,
    transaction_ref            = CASE
                                   WHEN p_details->>'transaction_ref' IS NOT NULL
                                     THEN p_details->>'transaction_ref'
                                   ELSE transaction_ref
                                 END
  WHERE id = p_campaign_creator_id
  RETURNING * INTO v_row;

  INSERT INTO campaign_creator_activity_log
    (campaign_creator_id, actor_id, actor_role, action, from_stage, to_stage, details)
  VALUES
    (p_campaign_creator_id, p_actor_id, p_actor_role, p_action,
     COALESCE(p_expected_stage, NULL), p_to_stage, p_details);

  RETURN v_row;
END;
$$;

ALTER FUNCTION transition_workflow_stage(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, INT)
  SET search_path = public;

COMMIT;
