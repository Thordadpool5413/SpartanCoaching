-- 0005_member_workspace_items.sql
-- Cross-device authoritative store for saved results / workspace items.
-- Safe to re-run: CREATE IF NOT EXISTS.
-- Source of truth: lib/db/src/schema/workspace.ts

CREATE TABLE IF NOT EXISTS member_workspace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id integer NOT NULL,
  member_id integer NOT NULL,
  kind varchar(64) NOT NULL,
  client_key varchar(128) NOT NULL,
  title text,
  payload jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  client_updated_at_ms integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS member_workspace_member_kind_key
  ON member_workspace_items (member_id, kind, client_key);

CREATE INDEX IF NOT EXISTS member_workspace_member_kind
  ON member_workspace_items (member_id, kind);

CREATE INDEX IF NOT EXISTS member_workspace_org
  ON member_workspace_items (organization_id);
