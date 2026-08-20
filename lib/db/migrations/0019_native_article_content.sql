-- 0019_native_article_content.sql
-- Adds first party article copy for the native iOS reader.
-- Existing web and mobile clients ignore the nullable column.

ALTER TABLE "articles"
  ADD COLUMN IF NOT EXISTS "content" text;
