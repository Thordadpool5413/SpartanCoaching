ALTER TABLE "client_members"
  ADD COLUMN IF NOT EXISTS "apple_account_token" uuid DEFAULT gen_random_uuid();

UPDATE "client_members"
SET "apple_account_token" = gen_random_uuid()
WHERE "apple_account_token" IS NULL;

ALTER TABLE "client_members"
  ALTER COLUMN "apple_account_token" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "apple_account_token" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_client_members_apple_account"
  ON "client_members" ("apple_account_token");

ALTER TABLE "client_organizations"
  ADD COLUMN IF NOT EXISTS "billing_provider" varchar(32),
  ADD COLUMN IF NOT EXISTS "apple_original_transaction_id" varchar(255),
  ADD COLUMN IF NOT EXISTS "apple_last_transaction_id" varchar(255),
  ADD COLUMN IF NOT EXISTS "apple_last_signed_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "apple_product_id" varchar(255),
  ADD COLUMN IF NOT EXISTS "apple_environment" varchar(32);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_client_org_apple_original_transaction"
  ON "client_organizations" ("apple_original_transaction_id")
  WHERE "apple_original_transaction_id" IS NOT NULL;
