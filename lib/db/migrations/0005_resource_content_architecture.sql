-- 0005_resource_content_architecture.sql
-- HSP-25: professional resource content architecture (additive, non-breaking).
-- Existing resources remain valid with content_architecture NULL.
-- Primary apply remains: pnpm --filter @workspace/db run push
-- This file is the reviewed SQL baseline / recovery path.

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS content_architecture jsonb;

COMMENT ON COLUMN resources.content_architecture IS
  'HSP-25 structured metadata (audience, use case, premium rules, review dates, etc.). Nullable for legacy rows.';
