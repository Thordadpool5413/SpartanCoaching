CREATE TABLE IF NOT EXISTS "coach_conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" integer NOT NULL REFERENCES "client_organizations"("id") ON DELETE CASCADE,
  "member_id" integer NOT NULL REFERENCES "client_members"("id") ON DELETE CASCADE,
  "title" varchar(160) NOT NULL DEFAULT 'New conversation',
  "status" varchar(24) NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'archived')),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_coach_conversations_owner" ON "coach_conversations" ("organization_id", "member_id", "updated_at");

CREATE TABLE IF NOT EXISTS "coach_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" uuid NOT NULL REFERENCES "coach_conversations"("id") ON DELETE CASCADE,
  "client_request_id" uuid NOT NULL,
  "organization_id" integer NOT NULL REFERENCES "client_organizations"("id") ON DELETE CASCADE,
  "member_id" integer NOT NULL REFERENCES "client_members"("id") ON DELETE CASCADE,
  "role" varchar(16) NOT NULL CHECK ("role" IN ('user', 'assistant')),
  "content" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_coach_messages_owner_time" ON "coach_messages" ("organization_id", "member_id", "conversation_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_coach_messages_request_role" ON "coach_messages" ("conversation_id", "client_request_id", "role");

CREATE TABLE IF NOT EXISTS "coach_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" integer NOT NULL REFERENCES "client_organizations"("id") ON DELETE CASCADE,
  "member_id" integer NOT NULL REFERENCES "client_members"("id") ON DELETE CASCADE,
  "memory_enabled" boolean NOT NULL DEFAULT false,
  "response_style" varchar(24) NOT NULL DEFAULT 'balanced' CHECK ("response_style" IN ('concise', 'balanced', 'detailed')),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_coach_preferences_owner" ON "coach_preferences" ("organization_id", "member_id");

CREATE TABLE IF NOT EXISTS "coach_memory_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" integer NOT NULL REFERENCES "client_organizations"("id") ON DELETE CASCADE,
  "member_id" integer NOT NULL REFERENCES "client_members"("id") ON DELETE CASCADE,
  "category" varchar(24) NOT NULL CHECK ("category" IN ('goal', 'preference', 'commitment', 'context')),
  "content" text NOT NULL,
  "enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_coach_memory_owner" ON "coach_memory_items" ("organization_id", "member_id", "updated_at");

CREATE TABLE IF NOT EXISTS "coach_shared_summaries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" integer NOT NULL REFERENCES "client_organizations"("id") ON DELETE CASCADE,
  "owner_member_id" integer NOT NULL REFERENCES "client_members"("id") ON DELETE CASCADE,
  "shared_with_member_id" integer NOT NULL REFERENCES "client_members"("id") ON DELETE CASCADE,
  "conversation_id" uuid REFERENCES "coach_conversations"("id") ON DELETE SET NULL,
  "summary" text NOT NULL,
  "commitments" jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof("commitments") = 'array'),
  "shared_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_coach_shared_recipient" ON "coach_shared_summaries" ("organization_id", "shared_with_member_id", "shared_at");
CREATE INDEX IF NOT EXISTS "idx_coach_shared_owner" ON "coach_shared_summaries" ("organization_id", "owner_member_id", "shared_at");
