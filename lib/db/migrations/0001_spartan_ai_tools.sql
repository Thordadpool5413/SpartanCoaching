CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- client_sessions is created in 0003. On fresh migrate-only DBs this ALTER must
-- not fail if 0003 has not run yet; 0003 also adds mfa_verified_at when creating.
DO $$
BEGIN
  IF to_regclass('public.client_sessions') IS NOT NULL THEN
    ALTER TABLE client_sessions
      ADD COLUMN IF NOT EXISTS mfa_verified_at timestamptz;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ai_tool_organization_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id integer NOT NULL,
  tool_id varchar(96) NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  updated_by_member_id integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_tool_org_flag_tenant_tool UNIQUE (organization_id, tool_id)
);

CREATE TABLE IF NOT EXISTS clinical_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id integer NOT NULL,
  member_id integer NOT NULL,
  can_use boolean NOT NULL DEFAULT false,
  can_review boolean NOT NULL DEFAULT false,
  can_admin boolean NOT NULL DEFAULT false,
  granted_by_member_id integer NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT clinical_permissions_tenant_member UNIQUE (organization_id, member_id)
);

CREATE TABLE IF NOT EXISTS clinical_mfa_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id integer NOT NULL,
  member_id integer NOT NULL,
  challenge_hash varchar(128) NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coverage_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source varchar(32) NOT NULL DEFAULT 'CMS_MCD',
  document_type varchar(32) NOT NULL,
  document_id varchar(96) NOT NULL,
  version varchar(64) NOT NULL,
  jurisdiction varchar(128),
  title text NOT NULL,
  source_url text NOT NULL,
  content_hash varchar(64) NOT NULL,
  effective_at timestamptz,
  retired_at timestamptz,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coverage_snapshots_document_version UNIQUE (source, document_type, document_id, version)
);

CREATE TABLE IF NOT EXISTS ai_tool_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id integer NOT NULL,
  member_id integer NOT NULL,
  tool_id varchar(96) NOT NULL,
  tool_version varchar(32) NOT NULL,
  model varchar(128) NOT NULL,
  prompt_version varchar(128) NOT NULL,
  input_hash varchar(64) NOT NULL,
  idempotency_key_hash varchar(64) NOT NULL,
  contains_phi boolean NOT NULL DEFAULT false,
  status varchar(32) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','completed','failed','deleted')),
  output jsonb,
  encrypted_payload text,
  error_code varchar(64),
  review_status varchar(32) NOT NULL DEFAULT 'not_required' CHECK (review_status IN ('not_required','pending','approved','changes_requested')),
  clinical_case_id uuid,
  coverage_snapshot_id uuid REFERENCES coverage_snapshots(id),
  coverage_document_id varchar(96),
  coverage_version varchar(64),
  coverage_content_hash varchar(64),
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT ai_tool_runs_idempotency UNIQUE (organization_id, member_id, tool_id, idempotency_key_hash)
);

ALTER TABLE ai_tool_runs
  ADD COLUMN IF NOT EXISTS coverage_document_id varchar(96),
  ADD COLUMN IF NOT EXISTS coverage_version varchar(64),
  ADD COLUMN IF NOT EXISTS coverage_content_hash varchar(64);

CREATE TABLE IF NOT EXISTS clinical_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id integer NOT NULL,
  created_by_member_id integer NOT NULL,
  encrypted_label text NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'open' CHECK (status IN ('open','review','closed','deleting','deleted')),
  retention_days integer NOT NULL DEFAULT 30 CHECK (retention_days BETWEEN 1 AND 365),
  retention_until timestamptz NOT NULL,
  legal_hold boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  purge_completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS clinical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES clinical_cases(id),
  organization_id integer NOT NULL,
  uploaded_by_member_id integer NOT NULL,
  object_key varchar(255) NOT NULL UNIQUE,
  encrypted_metadata text NOT NULL,
  content_type varchar(128) NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 26214400),
  sha256 varchar(64),
  scan_status varchar(32) NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending','scanning','safe','rejected','deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS clinical_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id integer NOT NULL,
  run_id uuid NOT NULL REFERENCES ai_tool_runs(id),
  reviewer_member_id integer NOT NULL,
  decision varchar(32) NOT NULL CHECK (decision IN ('approved','changes_requested')),
  encrypted_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id integer NOT NULL,
  actor_member_id integer NOT NULL,
  action varchar(96) NOT NULL,
  target_type varchar(64) NOT NULL,
  target_id uuid,
  request_id varchar(128) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_tool_runs_tenant_member_time ON ai_tool_runs (organization_id, member_id, created_at);
CREATE INDEX IF NOT EXISTS ai_tool_org_flag_enabled ON ai_tool_organization_flags (organization_id, enabled);
CREATE INDEX IF NOT EXISTS ai_tool_runs_clinical_case ON ai_tool_runs (organization_id, clinical_case_id);
CREATE INDEX IF NOT EXISTS clinical_mfa_member_expiry ON clinical_mfa_challenges (member_id, expires_at);
CREATE INDEX IF NOT EXISTS clinical_cases_tenant_status ON clinical_cases (organization_id, status);
CREATE INDEX IF NOT EXISTS clinical_documents_case ON clinical_documents (organization_id, case_id);
CREATE INDEX IF NOT EXISTS clinical_reviews_run ON clinical_reviews (organization_id, run_id);
CREATE INDEX IF NOT EXISTS coverage_snapshots_effective ON coverage_snapshots (document_type, jurisdiction, effective_at);
CREATE INDEX IF NOT EXISTS clinical_audit_tenant_time ON clinical_audit_events (organization_id, occurred_at);
