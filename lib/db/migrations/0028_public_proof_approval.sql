-- Explicit publication permission for public testimonials and case studies.
-- Existing records remain drafts until an administrator records written approval.
ALTER TABLE "testimonials"
  ADD COLUMN IF NOT EXISTS "approval_status" varchar(32) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS "approval_reference" text,
  ADD COLUMN IF NOT EXISTS "approved_at" timestamp;

ALTER TABLE "case_studies"
  ADD COLUMN IF NOT EXISTS "approval_status" varchar(32) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS "approval_reference" text,
  ADD COLUMN IF NOT EXISTS "approved_at" timestamp;

CREATE INDEX IF NOT EXISTS "testimonials_public_approval_idx"
  ON "testimonials" ("approval_status", "approved_at");

CREATE INDEX IF NOT EXISTS "case_studies_public_approval_idx"
  ON "case_studies" ("approval_status", "approved_at");