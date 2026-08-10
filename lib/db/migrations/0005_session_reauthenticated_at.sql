-- 0005_session_reauthenticated_at.sql
-- Separate account-lifecycle reauth from clinical MFA (mfa_verified_at).
-- Safe to re-run: ADD COLUMN IF NOT EXISTS.
-- Source of truth: lib/db/src/schema/auth.ts (client_sessions.reauthenticatedAt)

ALTER TABLE client_sessions
  ADD COLUMN IF NOT EXISTS reauthenticated_at timestamptz;
