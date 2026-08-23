-- Non-clinical, member-owned continuity records for cross-device restore.
-- Raw Coach conversations, clinical/vault outputs, audio, and retry request
-- bodies are intentionally not represented in this table.

CREATE TABLE IF NOT EXISTS "member_sync_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" integer NOT NULL,
  "member_id" integer NOT NULL,
  "record_type" varchar(40) NOT NULL,
  "record_id" varchar(160) NOT NULL,
  "mutation_id" varchar(96) NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "client_updated_at" timestamp with time zone NOT NULL,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "member_sync_record_owner_key"
  ON "member_sync_records" ("organization_id", "member_id", "record_type", "record_id");
CREATE UNIQUE INDEX IF NOT EXISTS "member_sync_mutation_owner_key"
  ON "member_sync_records" ("organization_id", "member_id", "mutation_id");
CREATE INDEX IF NOT EXISTS "member_sync_owner_updated_idx"
  ON "member_sync_records" ("organization_id", "member_id", "updated_at");