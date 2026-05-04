-- =============================================================
-- Security hardening: pin search_path on all public functions
-- to prevent search_path injection (Supabase security advisory).
-- Applied to DB 2026-05-01; reconstructed from pg_proc state.
-- =============================================================

ALTER FUNCTION update_updated_at()            SET search_path = public;
ALTER FUNCTION generate_referral_code()       SET search_path = public;
ALTER FUNCTION sort_participant_ids()         SET search_path = public;
ALTER FUNCTION _update_campaigns_fts()        SET search_path = public;
ALTER FUNCTION _update_influencer_fts()       SET search_path = public;
ALTER FUNCTION _update_influencer_min_price() SET search_path = public;
ALTER FUNCTION _sync_influencer_name()        SET search_path = public;
ALTER FUNCTION _notify_brand_on_proposal()    SET search_path = public;
ALTER FUNCTION _send_notification_email()     SET search_path = public;
