-- 0008_provider_resources.sql
-- HSP-28: provider-owned private resource libraries (tenant-isolated).
-- Additive. Primary apply: pnpm --filter @workspace/db run push

CREATE TABLE IF NOT EXISTS provider_resources (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  title varchar(300) NOT NULL,
  description text,
  file_url varchar(1000) NOT NULL,
  kind varchar(64) NOT NULL DEFAULT 'other',
  status varchar(32) NOT NULL DEFAULT 'draft',
  ownership varchar(32) NOT NULL DEFAULT 'provider',
  meta jsonb,
  created_by_member_id integer NOT NULL,
  updated_by_member_id integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS provider_resources_org_status
  ON provider_resources (organization_id, status);

CREATE INDEX IF NOT EXISTS provider_resources_org_updated
  ON provider_resources (organization_id, updated_at);
