-- Idempotency keys must remain tenant-bound if an account is transferred.
DROP INDEX IF EXISTS "member_sync_mutation_owner_key";
CREATE UNIQUE INDEX IF NOT EXISTS "member_sync_mutation_owner_key"
  ON "member_sync_records" ("organization_id", "member_id", "mutation_id");