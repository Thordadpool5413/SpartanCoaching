-- 0007_resource_lifecycle.sql
-- HSP-27: resource versioning, publishing, retirement, audit history.
-- Additive / non-destructive. Existing rows default to published current v1.0.
-- Primary apply: pnpm --filter @workspace/db run push

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS series_key varchar(120);

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS version_label varchar(32) DEFAULT '1.0';

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS lifecycle_status varchar(32) DEFAULT 'published';

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS superseded_by_id integer;

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT true;

-- Backfill nulls for legacy rows (idempotent)
UPDATE resources
SET
  version_label = COALESCE(version_label, '1.0'),
  lifecycle_status = COALESCE(lifecycle_status, 'published'),
  is_current = COALESCE(is_current, true),
  series_key = COALESCE(series_key, 'resource-' || id::text)
WHERE series_key IS NULL
   OR version_label IS NULL
   OR lifecycle_status IS NULL
   OR is_current IS NULL;

CREATE TABLE IF NOT EXISTS resource_lifecycle_events (
  id serial PRIMARY KEY,
  resource_id integer NOT NULL,
  series_key varchar(120),
  action varchar(64) NOT NULL,
  from_status varchar(32),
  to_status varchar(32),
  actor_label varchar(200),
  note text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resource_lifecycle_events_resource
  ON resource_lifecycle_events (resource_id);

CREATE INDEX IF NOT EXISTS resource_lifecycle_events_series
  ON resource_lifecycle_events (series_key);
