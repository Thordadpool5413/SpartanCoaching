-- HSP-38: in-app notifications, preferences, secure deep-link metadata
CREATE TABLE IF NOT EXISTS "member_notification_prefs" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" integer NOT NULL,
  "member_id" integer NOT NULL,
  "preferences" jsonb DEFAULT '{"schemaVersion":1,"enabled":true,"lockScreenMinimal":true,"channels":{"inApp":true,"push":true,"email":false},"types":{"follow_up_due":true,"upcoming_meeting":true,"weekly_plan_incomplete":true,"assigned_coaching":true,"org_content_published":true,"important_next_action":true,"subscription_issue":true,"evaluation_expiration":true},"orgControls":{"suppressOrgContentPush":false,"suppressCoachingPush":false}}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "member_notification_prefs_member_uidx"
  ON "member_notification_prefs" ("member_id");

CREATE INDEX IF NOT EXISTS "member_notification_prefs_org_idx"
  ON "member_notification_prefs" ("organization_id");

CREATE TABLE IF NOT EXISTS "member_notifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" integer NOT NULL,
  "member_id" integer NOT NULL,
  "type" varchar(64) NOT NULL,
  "title_safe" varchar(200) NOT NULL,
  "body_safe" text NOT NULL,
  "deep_link" jsonb NOT NULL,
  "dedupe_key" varchar(200) NOT NULL,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "member_notifications_dedupe_uidx"
  ON "member_notifications" ("member_id", "dedupe_key");

CREATE INDEX IF NOT EXISTS "member_notifications_member_created_idx"
  ON "member_notifications" ("member_id", "created_at");

CREATE INDEX IF NOT EXISTS "member_notifications_org_idx"
  ON "member_notifications" ("organization_id");
