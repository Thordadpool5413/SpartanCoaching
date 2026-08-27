CREATE TABLE IF NOT EXISTS "member_work_items" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" integer NOT NULL,
  "member_id" integer NOT NULL,
  "account_id" uuid,
  "kind" text NOT NULL,
  "tool_id" text NOT NULL,
  "title" text NOT NULL,
  "status" text DEFAULT 'completed' NOT NULL,
  "input" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "output" jsonb NOT NULL,
  "next_action" jsonb,
  "source_platform" text DEFAULT 'web' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "archived_at" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "member_work_owner_updated_idx" ON "member_work_items" ("organization_id", "member_id", "updated_at");
CREATE INDEX IF NOT EXISTS "member_work_account_idx" ON "member_work_items" ("organization_id", "account_id");
CREATE INDEX IF NOT EXISTS "member_work_tool_idx" ON "member_work_items" ("organization_id", "member_id", "tool_id");
