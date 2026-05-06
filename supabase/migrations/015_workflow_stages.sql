-- 015_workflow_stages.sql
-- Adds structured proposal workflow: stages, activity log, cron heartbeat, RPC.
-- All changes are additive / nullable — safe to apply without downtime.

-- ─── Proposal workflow columns ──────────────────────────────────────────────

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

-- ─── Activity log ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposal_activity_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id   UUID        NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  actor_id      UUID        REFERENCES profiles(id),
  actor_role    TEXT,
  action        TEXT        NOT NULL,
  from_stage    TEXT,
  to_stage      TEXT,
  details       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_proposal_created
  ON proposal_activity_log (proposal_id, created_at DESC);

ALTER TABLE proposal_activity_log ENABLE ROW LEVEL SECURITY;

-- Brands and influencers can read their own proposal activity
CREATE POLICY IF NOT EXISTS "activity_log_select" ON proposal_activity_log
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.influencer_id FROM proposals p WHERE p.id = proposal_id
      UNION
      SELECT c.brand_id FROM proposals p
        JOIN campaigns c ON p.campaign_id = c.id
        WHERE p.id = proposal_id
    )
  );

-- No client-side writes — server uses service role which bypasses RLS
CREATE POLICY IF NOT EXISTS "activity_log_no_client_write" ON proposal_activity_log
  FOR INSERT WITH CHECK (FALSE);

-- ─── Cron heartbeat ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cron_runs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job         TEXT        NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  processed   INT,
  error       TEXT
);

-- ─── RPC: transition_workflow_stage ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION transition_workflow_stage(
  p_proposal_id       UUID,
  p_actor_id          UUID,
  p_actor_role        TEXT,
  p_expected_stage    TEXT,          -- NULL means "workflow_stage must currently be NULL"
  p_to_stage          TEXT,
  p_action            TEXT,
  p_details           JSONB    DEFAULT NULL,
  p_auto_approve_hours INT     DEFAULT 72
) RETURNS proposals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal          proposals;
  v_allowed           BOOLEAN := FALSE;
  v_auto_approve_at   TIMESTAMPTZ;
  v_clear_submission  BOOLEAN := FALSE;
  v_new_submission    JSONB;
BEGIN
  SELECT * INTO v_proposal FROM proposals WHERE id = p_proposal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal % not found', p_proposal_id USING ERRCODE = 'P0002';
  END IF;

  -- Optimistic-lock check
  IF p_expected_stage IS NULL THEN
    IF v_proposal.workflow_stage IS NOT NULL THEN
      RAISE EXCEPTION 'Stage conflict: expected NULL but found %', v_proposal.workflow_stage
        USING ERRCODE = '23P01';
    END IF;
  ELSE
    IF v_proposal.workflow_stage IS DISTINCT FROM p_expected_stage THEN
      RAISE EXCEPTION 'Stage conflict: expected % but found %',
        p_expected_stage, v_proposal.workflow_stage
        USING ERRCODE = '23P01';
    END IF;
  END IF;

  -- Validate transition table
  v_allowed := CASE
    WHEN v_proposal.workflow_stage IS NULL
         AND p_to_stage = 'shortlisted'
         AND p_actor_role = 'brand'                                              THEN TRUE
    WHEN v_proposal.workflow_stage = 'shortlisted'
         AND p_to_stage = 'accepted'
         AND p_actor_role = 'brand'                                              THEN TRUE
    WHEN v_proposal.workflow_stage = 'shortlisted'
         AND p_to_stage = 'rejected_workflow'
         AND p_actor_role = 'brand'                                              THEN TRUE
    WHEN v_proposal.workflow_stage = 'accepted'
         AND p_to_stage = 'content_in_progress'
         AND p_actor_role = 'influencer'                                         THEN TRUE
    WHEN v_proposal.workflow_stage = 'content_in_progress'
         AND p_to_stage = 'submitted'
         AND p_actor_role = 'influencer'                                         THEN TRUE
    WHEN v_proposal.workflow_stage = 'submitted'
         AND p_to_stage = 'under_review'
         AND p_actor_role = 'system'                                             THEN TRUE
    WHEN v_proposal.workflow_stage = 'under_review'
         AND p_to_stage = 'approved'
         AND p_actor_role IN ('brand', 'system')                                 THEN TRUE
    WHEN v_proposal.workflow_stage = 'under_review'
         AND p_to_stage = 'content_in_progress'
         AND p_actor_role = 'brand'                                              THEN TRUE
    WHEN v_proposal.workflow_stage = 'approved'
         AND p_to_stage = 'payment_pending'
         AND p_actor_role = 'admin'                                              THEN TRUE
    WHEN v_proposal.workflow_stage = 'payment_pending'
         AND p_to_stage = 'payment_released'
         AND p_actor_role IN ('admin', 'system')                                 THEN TRUE
    WHEN v_proposal.workflow_stage NOT IN ('rejected_workflow', 'payment_released')
         AND p_to_stage = 'rejected_workflow'
         AND p_actor_role = 'brand'                                              THEN TRUE
    ELSE FALSE
  END;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Transition % → % not allowed for role %',
      COALESCE(v_proposal.workflow_stage, 'NULL'), p_to_stage, p_actor_role
      USING ERRCODE = 'P0001';
  END IF;

  -- Side-effect: auto_approve_at when entering under_review
  IF p_to_stage = 'under_review' THEN
    v_auto_approve_at := NOW() + (p_auto_approve_hours || ' hours')::INTERVAL;
  END IF;

  -- Side-effect: clear submission when brand requests revision
  IF p_to_stage = 'content_in_progress' AND v_proposal.workflow_stage = 'under_review' THEN
    v_clear_submission := TRUE;
  END IF;

  -- Side-effect: capture submission when creator submits
  IF p_to_stage = 'submitted' THEN
    v_new_submission := p_details;
  END IF;

  -- Side-effect: flip proposal.status = 'accepted' exactly once
  IF p_to_stage = 'accepted' THEN
    UPDATE proposals SET status = 'accepted' WHERE id = p_proposal_id AND status != 'accepted';
  END IF;

  -- Apply stage transition
  UPDATE proposals SET
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
  WHERE id = p_proposal_id
  RETURNING * INTO v_proposal;

  -- Record activity
  INSERT INTO proposal_activity_log
    (proposal_id, actor_id, actor_role, action, from_stage, to_stage, details)
  VALUES
    (p_proposal_id, p_actor_id, p_actor_role, p_action,
     COALESCE(p_expected_stage, NULL), p_to_stage, p_details);

  RETURN v_proposal;
END;
$$;
