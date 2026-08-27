-- Durable Stripe replay protection plus bounded analytics retention indexes.
-- This contains ordinary tables and indexes only so the supported schema
-- publish flow can apply it without deploy-time DDL.

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
  "id" varchar(255) PRIMARY KEY,
  "type" varchar(128) NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'processing',
  "claimed_at" timestamp NOT NULL DEFAULT now(),
  "processed_at" timestamp,
  "organization_id" integer,
  "attempts" integer NOT NULL DEFAULT 1,
  "failed_at" timestamp,
  "last_error_code" varchar(64),
  "received_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "stripe_webhook_events"
  ADD COLUMN IF NOT EXISTS "organization_id" integer;
ALTER TABLE "stripe_webhook_events"
  ADD COLUMN IF NOT EXISTS "attempts" integer NOT NULL DEFAULT 1;
ALTER TABLE "stripe_webhook_events"
  ADD COLUMN IF NOT EXISTS "failed_at" timestamp;
ALTER TABLE "stripe_webhook_events"
  ADD COLUMN IF NOT EXISTS "last_error_code" varchar(64);
ALTER TABLE "stripe_webhook_events"
  ADD COLUMN IF NOT EXISTS "received_at" timestamp NOT NULL DEFAULT now();

UPDATE "stripe_webhook_events"
  SET "claimed_at" = COALESCE("claimed_at", now()),
      "status" = COALESCE("status", 'processing');

CREATE INDEX IF NOT EXISTS "stripe_webhook_events_status_claimed_idx"
  ON "stripe_webhook_events" ("status", "claimed_at");
CREATE INDEX IF NOT EXISTS "stripe_webhook_events_processed_idx"
  ON "stripe_webhook_events" ("processed_at");

CREATE INDEX IF NOT EXISTS "visitors_visited_at_idx"
  ON "visitors" ("visited_at");
CREATE INDEX IF NOT EXISTS "event_tracking_created_at_idx"
  ON "event_tracking" ("created_at");