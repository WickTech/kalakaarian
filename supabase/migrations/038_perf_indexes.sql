-- Phase 5: performance.
--
-- The base schema (v2 migrations) is already thoroughly indexed — every
-- marketplace filter (tier / city / gender / niches / platforms), every FK,
-- the FTS columns, and the hot transaction / notification / message paths
-- all have covering indexes. Verified against pg_indexes; no redundant
-- indexes are added here.
--
-- This migration adds the one genuinely missing index and enables pgvector
-- as preparation for Phase 7 semantic search.

-- The auto-approve cron (POST /api/internal/cron/auto-approve) scans
-- campaign_creators by workflow_stage + auto_approve_at on every run, and
-- neither column was indexed. A partial index over just the 'under_review'
-- subset keeps that query fast as the table grows.
CREATE INDEX IF NOT EXISTS idx_campaign_creators_auto_approve
  ON campaign_creators (auto_approve_at)
  WHERE workflow_stage = 'under_review';

-- Phase 7 prep — semantic creator search. Enabling the extension is the safe,
-- idempotent prep step; the `embedding` column + its ivfflat/hnsw index are
-- added in a Phase 7 migration once the embedding model (and its vector
-- dimension) is chosen.
CREATE EXTENSION IF NOT EXISTS vector;
