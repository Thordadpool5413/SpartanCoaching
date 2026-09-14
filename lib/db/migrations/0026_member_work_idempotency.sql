ALTER TABLE "member_work_items"
  ADD COLUMN IF NOT EXISTS "idempotency_key" text;

CREATE UNIQUE INDEX IF NOT EXISTS "member_work_idempotency_uidx"
  ON "member_work_items" ("organization_id", "member_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;