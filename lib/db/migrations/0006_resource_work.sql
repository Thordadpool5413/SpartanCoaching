-- 0006_resource_work.sql
-- HSP-26: executable resource saved work (tenant + member scoped).
-- Additive. Primary apply: pnpm --filter @workspace/db run push

CREATE TABLE IF NOT EXISTS resource_work (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  member_id integer NOT NULL,
  resource_key varchar(120) NOT NULL,
  resource_id integer,
  title varchar(300) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'draft',
  form_schema_version varchar(64) NOT NULL DEFAULT 'v1',
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS resource_work_tenant_member_key
  ON resource_work (organization_id, member_id, resource_key);

CREATE INDEX IF NOT EXISTS resource_work_member_updated
  ON resource_work (organization_id, member_id, updated_at);
