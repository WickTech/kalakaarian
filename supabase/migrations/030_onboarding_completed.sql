-- Migration 030: Add onboarding_completed flag to profiles
-- Google OAuth users get this set to FALSE until they complete role-specific onboarding.
-- DEFAULT TRUE so existing users (and email/password registrations that already provide
-- all fields) are unaffected.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT TRUE;
