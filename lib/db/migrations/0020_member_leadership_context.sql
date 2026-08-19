-- 0020_member_leadership_context.sql
-- Adds the optional team leadership context without changing a member's primary role.

ALTER TABLE "client_members"
  ADD COLUMN IF NOT EXISTS "also_leads_team" boolean NOT NULL DEFAULT false;
