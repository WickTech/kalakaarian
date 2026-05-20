-- 034_rename_proposals_to_campaign_creators.sql
-- Per product decision (2026-05-20): creators no longer bid on campaigns.
-- Brand-only selection flow: marketplace pick -> cart -> checkout -> campaign_creators row.
-- Rename mechanical: same data, same workflow, new identifiers.
--
-- DEPLOY ORDER (zero-downtime is NOT possible — schedule a short window):
--   1. Deploy app code that references the new names (this PR).
--   2. Apply this migration.
-- If the migration is applied BEFORE the new code lands, the old serverless function
-- will 404 on /api/proposals/* until the new code deploys.

BEGIN;

-- 1. Drop the proposal-submitted brand-notification trigger (no longer relevant —
--    rows are now created by the brand themselves at checkout, not by creators).
DROP TRIGGER  IF EXISTS trg_notify_brand_proposal     ON proposals;
DROP FUNCTION IF EXISTS _notify_brand_on_proposal();

-- 2. Drop the workflow RPC so it can be recreated against the renamed table.
DROP FUNCTION IF EXISTS transition_workflow_stage(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, INT);

-- 3. Drop RLS policies that reference the renamed columns/tables (recreated below).
DROP POLICY IF EXISTS "activity_log_select"           ON proposal_activity_log;
DROP POLICY IF EXISTS "activity_log_no_client_write"  ON proposal_activity_log;

-- 4. Rename tables.
ALTER TABLE proposals               RENAME TO campaign_creators;
ALTER TABLE proposal_activity_log   RENAME TO campaign_creator_activity_log;

-- 5. Rename the price column — "bid_amount" implied creator bidding; the value
--    is now the brand-paid agreed price.
ALTER TABLE campaign_creators
  RENAME COLUMN bid_amount TO agreed_price;

-- 6. Rename FK columns on dependent tables.
ALTER TABLE campaign_creator_activity_log
  RENAME COLUMN proposal_id TO campaign_creator_id;
ALTER TABLE ratings
  RENAME COLUMN proposal_id TO campaign_creator_id;
ALTER TABLE workflow_events
  RENAME COLUMN proposal_id TO campaign_creator_id;

-- 7. Rename indexes for clarity.
ALTER INDEX IF EXISTS idx_proposals_campaign_id        RENAME TO idx_campaign_creators_campaign_id;
ALTER INDEX IF EXISTS idx_proposals_influencer_id      RENAME TO idx_campaign_creators_influencer_id;
ALTER INDEX IF EXISTS idx_activity_log_proposal_created
  RENAME TO idx_campaign_creator_activity_log_created;
ALTER INDEX IF EXISTS idx_ratings_proposal             RENAME TO idx_ratings_campaign_creator;
ALTER INDEX IF EXISTS idx_workflow_events_proposal_id  RENAME TO idx_workflow_events_campaign_creator_id;

-- 8. Rename the updated_at trigger to match the new table name.
ALTER TRIGGER trg_proposals_updated_at ON campaign_creators
  RENAME TO trg_campaign_creators_updated_at;

-- 9. Recreate RLS policies on the renamed activity log.
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

-- 10. Recreate the workflow-stage transition RPC against the renamed table.
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

  -- Optimistic-lock check.
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

  -- Transition table. 'system' is permitted alongside 'admin' for payment
  -- transitions so the cart checkout (webhook + free-checkout path) can advance
  -- to payment_pending / payment_released without an admin in the loop.
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

-- 11. Pin search_path on the recreated function (matches 012_security_hardening pattern).
ALTER FUNCTION transition_workflow_stage(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, INT)
  SET search_path = public;

COMMIT;
