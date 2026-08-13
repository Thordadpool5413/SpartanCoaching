-- 0014_org_structure.sql
-- HSP-41 Slice C / pass (9): provider org branches, teams, member assignment.
-- Additive. Source of truth: lib/db/src/schema/auth.ts

CREATE TABLE IF NOT EXISTS org_branches (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  name varchar(255) NOT NULL,
  code varchar(64),
  status varchar(32) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_branches_org
  ON org_branches (organization_id);

CREATE TABLE IF NOT EXISTS org_teams (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  branch_id integer,
  name varchar(255) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_teams_org
  ON org_teams (organization_id);

ALTER TABLE client_members ADD COLUMN IF NOT EXISTS branch_id integer;
ALTER TABLE client_members ADD COLUMN IF NOT EXISTS team_id integer;
ALTER TABLE client_members ADD COLUMN IF NOT EXISTS manager_member_id integer;

CREATE INDEX IF NOT EXISTS idx_client_members_branch
  ON client_members (organization_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_client_members_team
  ON client_members (organization_id, team_id);
