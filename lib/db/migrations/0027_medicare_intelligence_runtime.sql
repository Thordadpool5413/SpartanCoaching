-- Durable, tenant-scoped state and cache for the Medicare Intelligence workspace.
CREATE TABLE IF NOT EXISTS "medicare_workspace_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "bucket" text NOT NULL,
  "record" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "medicare_workspace_records_bucket_updated_idx"
  ON "medicare_workspace_records" ("bucket", "updated_at" DESC);

CREATE TABLE IF NOT EXISTS "medicare_cache_objects" (
  "path" text PRIMARY KEY,
  "content" text NOT NULL,
  "content_type" varchar(100) DEFAULT 'application/json' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "medicare_cache_objects_updated_idx"
  ON "medicare_cache_objects" ("updated_at" DESC);
