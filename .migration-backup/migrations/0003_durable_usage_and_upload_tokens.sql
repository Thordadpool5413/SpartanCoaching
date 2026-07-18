CREATE TABLE IF NOT EXISTS "ai_usage_daily" (
  "date" varchar(10) PRIMARY KEY NOT NULL,
  "count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_usage_daily" (
  "date" varchar(10) PRIMARY KEY NOT NULL,
  "count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "object_upload_tokens" (
  "token" varchar(36) PRIMARY KEY NOT NULL,
  "expires_at" timestamp NOT NULL
);
