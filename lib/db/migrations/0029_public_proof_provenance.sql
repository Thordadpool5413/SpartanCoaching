ALTER TABLE "testimonials"
  ADD COLUMN IF NOT EXISTS "approval_scope" text,
  ADD COLUMN IF NOT EXISTS "timeframe" text,
  ADD COLUMN IF NOT EXISTS "evidence_source" text,
  ADD COLUMN IF NOT EXISTS "measurement_context" text,
  ADD COLUMN IF NOT EXISTS "verification_status" varchar(32) NOT NULL DEFAULT 'client_reported',
  ADD COLUMN IF NOT EXISTS "attribution_limitations" text;

ALTER TABLE "case_studies"
  ADD COLUMN IF NOT EXISTS "approval_scope" text,
  ADD COLUMN IF NOT EXISTS "timeframe" text,
  ADD COLUMN IF NOT EXISTS "evidence_source" text,
  ADD COLUMN IF NOT EXISTS "measurement_context" text,
  ADD COLUMN IF NOT EXISTS "verification_status" varchar(32) NOT NULL DEFAULT 'client_reported',
  ADD COLUMN IF NOT EXISTS "attribution_limitations" text;