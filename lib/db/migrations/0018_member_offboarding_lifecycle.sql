CREATE TABLE IF NOT EXISTS "member_offboarding_lifecycle" (
  "id" bigserial PRIMARY KEY,
  "member_id" integer NOT NULL REFERENCES "client_members"("id") ON DELETE CASCADE,
  "source_organization_id" integer NOT NULL REFERENCES "client_organizations"("id") ON DELETE CASCADE,
  "offboarded_at" timestamptz NOT NULL DEFAULT now(),
  "commitment_preserve_until" timestamptz NOT NULL,
  "shared_summary_retain_until" timestamptz NOT NULL,
  "recovered_to_personal_at" timestamptz,
  "retention_hold" boolean NOT NULL DEFAULT false,
  "retention_hold_reason" text
);

CREATE INDEX IF NOT EXISTS "idx_member_offboarding_member_time"
  ON "member_offboarding_lifecycle" ("member_id", "offboarded_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_member_offboarding_commitment_expiry"
  ON "member_offboarding_lifecycle" ("commitment_preserve_until")
  WHERE "recovered_to_personal_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_member_offboarding_summary_expiry"
  ON "member_offboarding_lifecycle" ("shared_summary_retain_until")
  WHERE "retention_hold" = false;

CREATE OR REPLACE FUNCTION spartan_member_offboarding_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  lifecycle_id bigint;
  preserve_until timestamptz;
  target_org_type varchar(32);
BEGIN
  IF OLD.status IS DISTINCT FROM 'disabled' AND NEW.status = 'disabled' THEN
    INSERT INTO "member_offboarding_lifecycle" (
      "member_id",
      "source_organization_id",
      "offboarded_at",
      "commitment_preserve_until",
      "shared_summary_retain_until"
    ) VALUES (
      NEW.id,
      OLD.organization_id,
      now(),
      now() + interval '30 days',
      now() + interval '12 months'
    );

    DELETE FROM "coach_conversations"
      WHERE "member_id" = NEW.id
        AND "organization_id" = OLD.organization_id;

    DELETE FROM "coach_preferences"
      WHERE "member_id" = NEW.id
        AND "organization_id" = OLD.organization_id;

    DELETE FROM "coach_memory_items"
      WHERE "member_id" = NEW.id
        AND "organization_id" = OLD.organization_id
        AND "category" <> 'commitment';
  END IF;

  IF OLD.status = 'disabled'
     AND NEW.status IS DISTINCT FROM 'disabled'
     AND OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
    SELECT o.type INTO target_org_type
      FROM "client_organizations" o
      WHERE o.id = NEW.organization_id;

    IF target_org_type = 'personal' THEN
      SELECT l.id, l.commitment_preserve_until
        INTO lifecycle_id, preserve_until
        FROM "member_offboarding_lifecycle" l
        WHERE l.member_id = NEW.id
          AND l.source_organization_id = OLD.organization_id
          AND l.recovered_to_personal_at IS NULL
        ORDER BY l.offboarded_at DESC
        LIMIT 1;

      IF lifecycle_id IS NOT NULL THEN
        IF preserve_until >= now() THEN
          UPDATE "coach_memory_items"
             SET "organization_id" = NEW.organization_id,
                 "updated_at" = now()
           WHERE "member_id" = NEW.id
             AND "organization_id" = OLD.organization_id
             AND "category" = 'commitment';
        ELSE
          DELETE FROM "coach_memory_items"
           WHERE "member_id" = NEW.id
             AND "organization_id" = OLD.organization_id
             AND "category" = 'commitment';
        END IF;

        UPDATE "member_offboarding_lifecycle"
           SET "recovered_to_personal_at" = now()
         WHERE id = lifecycle_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trg_member_offboarding_guard" ON "client_members";
CREATE TRIGGER "trg_member_offboarding_guard"
AFTER UPDATE OF "status", "organization_id" ON "client_members"
FOR EACH ROW
EXECUTE FUNCTION spartan_member_offboarding_guard();

CREATE OR REPLACE FUNCTION spartan_run_member_offboarding_retention()
RETURNS TABLE (
  commitments_deleted bigint,
  shared_summaries_deleted bigint
)
LANGUAGE plpgsql
AS $$
DECLARE
  commitment_count bigint := 0;
  summary_count bigint := 0;
BEGIN
  WITH expired_commitments AS (
    DELETE FROM "coach_memory_items" m
    USING "member_offboarding_lifecycle" l
    WHERE m.member_id = l.member_id
      AND m.organization_id = l.source_organization_id
      AND m.category = 'commitment'
      AND m.created_at <= l.offboarded_at
      AND l.recovered_to_personal_at IS NULL
      AND l.commitment_preserve_until < now()
    RETURNING m.id
  )
  SELECT count(*) INTO commitment_count FROM expired_commitments;

  WITH expired_summaries AS (
    DELETE FROM "coach_shared_summaries" s
    USING "member_offboarding_lifecycle" l
    WHERE s.owner_member_id = l.member_id
      AND s.organization_id = l.source_organization_id
      AND s.shared_at <= l.offboarded_at
      AND l.shared_summary_retain_until < now()
      AND l.retention_hold = false
    RETURNING s.id
  )
  SELECT count(*) INTO summary_count FROM expired_summaries;

  RETURN QUERY SELECT commitment_count, summary_count;
END;
$$;
