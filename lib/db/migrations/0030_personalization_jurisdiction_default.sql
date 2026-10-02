-- Align future inserts with the existing application schema; preserve stored preferences.
-- Metadata-only change: no backfill and no historical migration rewrite.
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.member_personalization
  ALTER COLUMN payload SET DEFAULT '{"schemaVersion":1,"favorites":{"tools":[],"resources":[]},"pinnedTools":[],"pinnedResources":[],"recent":[],"dismissedRecommendationIds":[],"jurisdiction":{"state":null,"macRegion":null}}'::jsonb;
