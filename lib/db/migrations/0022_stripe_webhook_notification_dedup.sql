-- At-most-once billing notification bundles for Stripe webhook retries.
-- Only provider event IDs and internal notification categories are retained.

CREATE TABLE IF NOT EXISTS "stripe_webhook_notifications" (
  "id" serial PRIMARY KEY,
  "stripe_event_id" varchar(255) NOT NULL,
  "notification_type" varchar(64) NOT NULL,
  "organization_id" integer,
  "status" varchar(24) NOT NULL DEFAULT 'claimed',
  "claimed_at" timestamp NOT NULL DEFAULT now(),
  "completed_at" timestamp,
  "failure_code" varchar(64)
);

CREATE UNIQUE INDEX IF NOT EXISTS "stripe_webhook_notifications_event_type_unique"
  ON "stripe_webhook_notifications" ("stripe_event_id", "notification_type");