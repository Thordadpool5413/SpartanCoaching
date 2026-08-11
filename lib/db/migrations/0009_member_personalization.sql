-- HSP-37: member workspace personalization (favorites, pins, recents)
CREATE TABLE IF NOT EXISTS "member_personalization" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" integer NOT NULL,
  "member_id" integer NOT NULL,
  "payload" jsonb DEFAULT '{"schemaVersion":1,"favorites":{"tools":[],"resources":[]},"pinnedTools":[],"pinnedResources":[],"recent":[],"dismissedRecommendationIds":[]}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "member_personalization_member_uidx"
  ON "member_personalization" ("member_id");

CREATE INDEX IF NOT EXISTS "member_personalization_org_idx"
  ON "member_personalization" ("organization_id");
