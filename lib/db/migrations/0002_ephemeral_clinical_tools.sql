CREATE TABLE IF NOT EXISTS clinical_ephemeral_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id integer NOT NULL,
  created_by_member_id integer NOT NULL,
  coverage_snapshot_id uuid REFERENCES coverage_snapshots(id),
  status varchar(32) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','processing','purging')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_ephemeral_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES clinical_ephemeral_sessions(id) ON DELETE CASCADE,
  organization_id integer NOT NULL,
  object_key varchar(255) NOT NULL UNIQUE,
  content_type varchar(128) NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 26214400),
  scan_status varchar(32) NOT NULL DEFAULT 'pending'
    CHECK (scan_status IN ('pending','scanning','safe')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS clinical_ephemeral_sessions_tenant_expiry
  ON clinical_ephemeral_sessions (organization_id, expires_at);
CREATE INDEX IF NOT EXISTS clinical_ephemeral_objects_session
  ON clinical_ephemeral_objects (organization_id, session_id);

-- The ephemeral architecture no longer permits retained clinical payloads.
UPDATE clinical_reviews
SET encrypted_notes = NULL
WHERE run_id IN (SELECT id FROM ai_tool_runs WHERE contains_phi = true);

UPDATE ai_tool_runs
SET output = NULL,
    encrypted_payload = NULL,
    status = 'deleted',
    error_code = COALESCE(error_code, 'CLINICAL_RESULT_NOT_RETAINED')
WHERE contains_phi = true;

-- The application retention worker removes corresponding legacy objects.
UPDATE clinical_cases
SET status = 'deleting',
    retention_until = now(),
    deleted_at = COALESCE(deleted_at, now()),
    updated_at = now()
WHERE legal_hold = false
  AND purge_completed_at IS NULL;
