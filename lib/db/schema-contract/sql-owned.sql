-- Expected SQL-owned catalog, version 1. Synthetic target construction ONLY.
-- Independent of migration replay; maintain through reviewed changes, never regenerate from a database.

-- Reviewed lifecycle/cache contract (origin: 0018_member_offboarding_lifecycle.sql).
CREATE TABLE "member_offboarding_lifecycle" (
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

CREATE INDEX "idx_member_offboarding_member_time"
  ON "member_offboarding_lifecycle" ("member_id", "offboarded_at" DESC);
CREATE INDEX "idx_member_offboarding_commitment_expiry"
  ON "member_offboarding_lifecycle" ("commitment_preserve_until")
  WHERE "recovered_to_personal_at" IS NULL;
CREATE INDEX "idx_member_offboarding_summary_expiry"
  ON "member_offboarding_lifecycle" ("shared_summary_retain_until")
  WHERE "retention_hold" = false;

CREATE FUNCTION spartan_member_offboarding_guard()
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

CREATE TRIGGER "trg_member_offboarding_guard"
AFTER UPDATE OF "status", "organization_id" ON "client_members"
FOR EACH ROW
EXECUTE FUNCTION spartan_member_offboarding_guard();

CREATE FUNCTION spartan_run_member_offboarding_retention()
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

CREATE FUNCTION spartan_member_offboarding_retention_tick()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM * FROM spartan_run_member_offboarding_retention();
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_member_offboarding_retention_tick"
AFTER INSERT ON "auth_events"
FOR EACH ROW
WHEN (NEW."type" = 'job_session_cleanup')
EXECUTE FUNCTION spartan_member_offboarding_retention_tick();

-- Reviewed lifecycle/cache contract (origin: 0027_medicare_intelligence_runtime.sql).
-- Durable, tenant-scoped state and cache for the Medicare Intelligence workspace.
CREATE TABLE "medicare_workspace_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "bucket" text NOT NULL,
  "record" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "medicare_workspace_records_bucket_updated_idx"
  ON "medicare_workspace_records" ("bucket", "updated_at" DESC);

CREATE TABLE "medicare_cache_objects" (
  "path" text PRIMARY KEY,
  "content" text NOT NULL,
  "content_type" varchar(100) DEFAULT 'application/json' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "medicare_cache_objects_updated_idx"
  ON "medicare_cache_objects" ("updated_at" DESC);

-- Workflow tenant policies apply to every operation; force RLS is required.
ALTER TABLE sales_workflow_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_entities FORCE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_outbox FORCE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_audit FORCE ROW LEVEL SECURITY;
ALTER TABLE sales_workflow_idempotency FORCE ROW LEVEL SECURITY;
CREATE POLICY sales_workflow_entity_tenant ON sales_workflow_entities USING (organization_id::text = current_setting('app.organization_id', true)) WITH CHECK (organization_id::text = current_setting('app.organization_id', true));
CREATE POLICY sales_workflow_outbox_tenant ON sales_workflow_outbox USING (organization_id::text = current_setting('app.organization_id', true)) WITH CHECK (organization_id::text = current_setting('app.organization_id', true));
CREATE POLICY sales_workflow_audit_tenant ON sales_workflow_audit USING (organization_id::text = current_setting('app.organization_id', true)) WITH CHECK (organization_id::text = current_setting('app.organization_id', true));
CREATE POLICY sales_workflow_idempotency_tenant ON sales_workflow_idempotency USING (organization_id::text = current_setting('app.organization_id', true)) WITH CHECK (organization_id::text = current_setting('app.organization_id', true));


-- Physical FK names: rename only; columns/actions remain supplied by Drizzle.

ALTER TABLE messages RENAME CONSTRAINT "messages_conversation_id_conversations_id_fk" TO messages_conversation_id_fkey;

ALTER TABLE coach_messages RENAME CONSTRAINT "coach_messages_conversation_id_coach_conversations_id_fk" TO coach_messages_conversation_id_fkey;

ALTER TABLE coach_shared_summaries RENAME CONSTRAINT "coach_shared_summaries_conversation_id_coach_conversations_id_f" TO coach_shared_summaries_conversation_id_fkey;

ALTER TABLE clinical_ephemeral_objects RENAME CONSTRAINT "clinical_ephemeral_objects_session_id_clinical_ephemeral_sessio" TO clinical_ephemeral_objects_session_id_fkey;

ALTER TABLE clinical_ephemeral_sessions RENAME CONSTRAINT "clinical_ephemeral_sessions_coverage_snapshot_id_coverage_snaps" TO clinical_ephemeral_sessions_coverage_snapshot_id_fkey;

-- Existing relational constraints omitted by the application declarations.

ALTER TABLE ai_tool_runs ADD CONSTRAINT ai_tool_runs_coverage_snapshot_id_fkey FOREIGN KEY (coverage_snapshot_id) REFERENCES coverage_snapshots(id) ON DELETE NO ACTION;

ALTER TABLE clinical_documents ADD CONSTRAINT clinical_documents_case_id_fkey FOREIGN KEY (case_id) REFERENCES clinical_cases(id) ON DELETE NO ACTION;

ALTER TABLE clinical_reviews ADD CONSTRAINT clinical_reviews_run_id_fkey FOREIGN KEY (run_id) REFERENCES ai_tool_runs(id) ON DELETE NO ACTION;

ALTER TABLE coach_conversations ADD CONSTRAINT coach_conversations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES client_organizations(id) ON DELETE CASCADE;

ALTER TABLE coach_conversations ADD CONSTRAINT coach_conversations_member_id_fkey FOREIGN KEY (member_id) REFERENCES client_members(id) ON DELETE CASCADE;

ALTER TABLE coach_messages ADD CONSTRAINT coach_messages_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES client_organizations(id) ON DELETE CASCADE;

ALTER TABLE coach_messages ADD CONSTRAINT coach_messages_member_id_fkey FOREIGN KEY (member_id) REFERENCES client_members(id) ON DELETE CASCADE;

ALTER TABLE coach_preferences ADD CONSTRAINT coach_preferences_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES client_organizations(id) ON DELETE CASCADE;

ALTER TABLE coach_preferences ADD CONSTRAINT coach_preferences_member_id_fkey FOREIGN KEY (member_id) REFERENCES client_members(id) ON DELETE CASCADE;

ALTER TABLE coach_memory_items ADD CONSTRAINT coach_memory_items_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES client_organizations(id) ON DELETE CASCADE;

ALTER TABLE coach_memory_items ADD CONSTRAINT coach_memory_items_member_id_fkey FOREIGN KEY (member_id) REFERENCES client_members(id) ON DELETE CASCADE;

ALTER TABLE coach_shared_summaries ADD CONSTRAINT coach_shared_summaries_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES client_organizations(id) ON DELETE CASCADE;

ALTER TABLE coach_shared_summaries ADD CONSTRAINT coach_shared_summaries_owner_member_id_fkey FOREIGN KEY (owner_member_id) REFERENCES client_members(id) ON DELETE CASCADE;

ALTER TABLE coach_shared_summaries ADD CONSTRAINT coach_shared_summaries_shared_with_member_id_fkey FOREIGN KEY (shared_with_member_id) REFERENCES client_members(id) ON DELETE CASCADE;

ALTER TABLE coach_conversations ADD CONSTRAINT coach_conversations_status_check CHECK (status IN ('active', 'archived'));

ALTER TABLE coach_messages ADD CONSTRAINT coach_messages_role_check CHECK (role IN ('user', 'assistant'));

ALTER TABLE coach_preferences ADD CONSTRAINT coach_preferences_response_style_check CHECK (response_style IN ('concise', 'balanced', 'detailed'));

ALTER TABLE coach_memory_items ADD CONSTRAINT coach_memory_items_category_check CHECK (category IN ('goal', 'preference', 'commitment', 'context'));

ALTER TABLE coach_shared_summaries ADD CONSTRAINT coach_shared_summaries_commitments_check CHECK (jsonb_typeof(commitments) = 'array');

-- Existing auxiliary indexes missing from application declarations.
CREATE INDEX event_tracking_type_name_idx ON event_tracking(event_type, event_name);
CREATE INDEX event_tracking_member_idx ON event_tracking(member_id);
CREATE INDEX testimonials_public_approval_idx ON testimonials(approval_status, approved_at);
CREATE INDEX case_studies_public_approval_idx ON case_studies(approval_status, approved_at);
