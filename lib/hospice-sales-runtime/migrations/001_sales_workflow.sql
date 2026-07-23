BEGIN;
CREATE TABLE IF NOT EXISTS sales_workflow_entities (
  id uuid PRIMARY KEY, organization_id uuid NOT NULL, kind text NOT NULL, version integer NOT NULL DEFAULT 1,
  data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  UNIQUE (organization_id, kind, id), CHECK (version > 0)
);
CREATE INDEX IF NOT EXISTS sales_workflow_entities_tenant_kind ON sales_workflow_entities(organization_id, kind) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS sales_workflow_entities_data ON sales_workflow_entities USING gin(data);
CREATE TABLE IF NOT EXISTS sales_workflow_outbox (
  id uuid PRIMARY KEY, organization_id uuid NOT NULL, event_type text NOT NULL, aggregate_id uuid NOT NULL, payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL, published_at timestamptz, attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(), last_error_code text, dead_lettered_at timestamptz
);
CREATE INDEX IF NOT EXISTS sales_workflow_outbox_pending ON sales_workflow_outbox(available_at) WHERE published_at IS NULL;
CREATE TABLE IF NOT EXISTS sales_workflow_audit (
  id uuid PRIMARY KEY, organization_id uuid NOT NULL, actor_user_id uuid NOT NULL, action text NOT NULL, aggregate_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, occurred_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sales_workflow_audit_tenant_time ON sales_workflow_audit(organization_id, occurred_at DESC);
CREATE TABLE IF NOT EXISTS sales_workflow_idempotency(organization_id uuid NOT NULL,key_hash text NOT NULL,fingerprint text NOT NULL,state text NOT NULL CHECK(state IN ('processing','completed','failed')),status integer,body jsonb,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(organization_id,key_hash));
CREATE INDEX IF NOT EXISTS sales_workflow_idempotency_expiry ON sales_workflow_idempotency(expires_at);
ALTER TABLE sales_workflow_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_entities FORCE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_outbox FORCE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_audit FORCE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_idempotency FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sales_workflow_entity_tenant ON sales_workflow_entities;
CREATE POLICY sales_workflow_entity_tenant ON sales_workflow_entities USING (organization_id::text = current_setting('app.organization_id', true)) WITH CHECK (organization_id::text = current_setting('app.organization_id', true));
DROP POLICY IF EXISTS sales_workflow_outbox_tenant ON sales_workflow_outbox;
CREATE POLICY sales_workflow_outbox_tenant ON sales_workflow_outbox USING (organization_id::text = current_setting('app.organization_id', true)) WITH CHECK (organization_id::text = current_setting('app.organization_id', true));
DROP POLICY IF EXISTS sales_workflow_audit_tenant ON sales_workflow_audit;
CREATE POLICY sales_workflow_audit_tenant ON sales_workflow_audit USING (organization_id::text = current_setting('app.organization_id', true)) WITH CHECK (organization_id::text = current_setting('app.organization_id', true));
DROP POLICY IF EXISTS sales_workflow_idempotency_tenant ON sales_workflow_idempotency;
CREATE POLICY sales_workflow_idempotency_tenant ON sales_workflow_idempotency USING (organization_id::text = current_setting('app.organization_id', true)) WITH CHECK (organization_id::text = current_setting('app.organization_id', true));
COMMIT;
