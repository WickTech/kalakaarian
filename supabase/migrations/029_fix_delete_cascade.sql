-- Fix FK delete rules so account deletion is clean with no orphaned data

-- ratings: cascade-delete ratings when rater or ratee is deleted
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_rater_id_fkey;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_ratee_id_fkey;
ALTER TABLE ratings
  ADD CONSTRAINT ratings_rater_id_fkey FOREIGN KEY (rater_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT ratings_ratee_id_fkey FOREIGN KEY (ratee_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- admin_audit_logs: preserve audit trail but nullify deleted actor reference
ALTER TABLE admin_audit_logs DROP CONSTRAINT IF EXISTS admin_audit_logs_admin_id_fkey;
ALTER TABLE admin_audit_logs
  ADD CONSTRAINT admin_audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- feature_flags: preserve flag record but nullify who last updated it
ALTER TABLE feature_flags DROP CONSTRAINT IF EXISTS feature_flags_updated_by_fkey;
ALTER TABLE feature_flags
  ADD CONSTRAINT feature_flags_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;
