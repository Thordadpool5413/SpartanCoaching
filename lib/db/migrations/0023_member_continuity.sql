-- Cross-device recovery metadata for approved member device-local work.
-- Download bytes and clinical/vault content are never stored in this table.

CREATE TABLE IF NOT EXISTS "member_continuity" (
  "id" serial PRIMARY KEY,
  "organization_id" integer NOT NULL,
  "member_id" integer NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{"schemaVersion":1,"toolDrafts":{},"toolResults":{},"calculatorReports":{},"downloads":{}}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "member_continuity_owner_uidx"
  ON "member_continuity" ("organization_id", "member_id");

CREATE INDEX IF NOT EXISTS "member_continuity_member_updated_idx"
  ON "member_continuity" ("member_id", "updated_at");