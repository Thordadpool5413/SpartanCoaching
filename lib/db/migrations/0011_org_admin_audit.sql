-- HSP-41/program: provider org admin audit trail (tenant-scoped)
CREATE TABLE IF NOT EXISTS org_admin_audit_events (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  actor_member_id integer,
  action varchar(64) NOT NULL,
  target_type varchar(64),
  target_id varchar(64),
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_admin_audit_org
  ON org_admin_audit_events (organization_id, created_at DESC);
