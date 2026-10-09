-- Approved K1B durable authority. Additive; no legacy backfill or production activation.
CREATE TABLE IF NOT EXISTS "knowledge_scopes" (
  "scope_id" text COLLATE "C" NOT NULL,
  "scope_kind" text NOT NULL,
  "organization_id" integer,
  "revision" bigint NOT NULL DEFAULT 0,
  "supported_payers" text[] NOT NULL,
  "supported_jurisdictions" text[] NOT NULL,
  "created_at" timestamptz(3) NOT NULL,
  CONSTRAINT "pk_scopes" PRIMARY KEY ("scope_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_scope_members" (
  "scope_id" text COLLATE "C" NOT NULL,
  "member_id" integer NOT NULL,
  "recorded_at" timestamptz(3) NOT NULL,
  CONSTRAINT "pk_scope_members" PRIMARY KEY ("scope_id","member_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_sources" (
  "scope_id" text COLLATE "C" NOT NULL,
  "source_id" text COLLATE "C" NOT NULL,
  "created_at" timestamptz(3) NOT NULL,
  CONSTRAINT "pk_sources" PRIMARY KEY ("scope_id","source_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_source_revisions" (
  "scope_id" text COLLATE "C" NOT NULL,
  "source_id" text COLLATE "C" NOT NULL,
  "metadata_revision" bigint NOT NULL,
  "publisher" text NOT NULL,
  "title" text NOT NULL,
  "domain" text NOT NULL,
  "claim_types" text[] NOT NULL,
  "official_url" text NOT NULL,
  "educational_only" boolean NOT NULL,
  "recorded_at" timestamptz(3) NOT NULL,
  CONSTRAINT "pk_source_revisions" PRIMARY KEY ("scope_id","source_id","metadata_revision")
);

CREATE TABLE IF NOT EXISTS "knowledge_documents" (
  "scope_id" text COLLATE "C" NOT NULL,
  "source_id" text COLLATE "C" NOT NULL,
  "document_id" text COLLATE "C" NOT NULL,
  "created_at" timestamptz(3) NOT NULL,
  CONSTRAINT "pk_documents" PRIMARY KEY ("scope_id","source_id","document_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_rights_terms" (
  "scope_id" text COLLATE "C" NOT NULL,
  "rights_revision_id" text COLLATE "C" NOT NULL,
  "logical_rights_id" text COLLATE "C" NOT NULL,
  "terms_revision" bigint NOT NULL,
  "owner_ref" text COLLATE "C" NOT NULL,
  "reference_ref" text COLLATE "C" NOT NULL,
  "status" text NOT NULL,
  "effective_from" timestamptz(3),
  "expires_at" timestamptz(3),
  "commercial_use" boolean NOT NULL,
  "permitted_uses" text[] NOT NULL,
  "verified_by_member_id" integer,
  "verification_grant_id" text COLLATE "C",
  "verification_qualification_id" text COLLATE "C",
  "verification_ref" text COLLATE "C",
  "verified_at" timestamptz(3),
  "recorded_at" timestamptz(3) NOT NULL,
  CONSTRAINT "pk_rights_terms" PRIMARY KEY ("scope_id","rights_revision_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_rights_state" (
  "scope_id" text COLLATE "C" NOT NULL,
  "rights_revision_id" text COLLATE "C" NOT NULL,
  "revision" bigint NOT NULL DEFAULT 1,
  "revoked_at" timestamptz(3),
  CONSTRAINT "pk_rights_state" PRIMARY KEY ("scope_id","rights_revision_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_versions" (
  "scope_id" text COLLATE "C" NOT NULL,
  "version_id" text COLLATE "C" NOT NULL,
  "source_id" text COLLATE "C" NOT NULL,
  "source_metadata_revision" bigint NOT NULL,
  "document_id" text COLLATE "C" NOT NULL,
  "upstream_edition" text COLLATE "C" NOT NULL,
  "artifact_revision" bigint NOT NULL,
  "raw_hash" text COLLATE "C" NOT NULL,
  "normalized_hash" text COLLATE "C" NOT NULL,
  "parser_id" text COLLATE "C" NOT NULL,
  "parser_version" text COLLATE "C" NOT NULL,
  "source_url" text NOT NULL,
  "published_at" timestamptz(3) NOT NULL,
  "retrieved_at" timestamptz(3) NOT NULL,
  "effective_from" date NOT NULL,
  "effective_to" date,
  "payers" text[] NOT NULL,
  "jurisdictions" text[] NOT NULL,
  "macs" text[],
  "provider_types" text[],
  "settings" text[],
  "benefit_periods" text[],
  "code_editions" text[],
  "products" text[],
  "populations" text[],
  "rights_revision_id" text COLLATE "C" NOT NULL,
  "legacy_coverage_snapshot_id" uuid,
  "registered_by_member_id" integer NOT NULL,
  "submitted_by_member_id" integer,
  "conflicts_with" text[] NOT NULL DEFAULT '{}'::text[],
  "state" text NOT NULL,
  "revision" bigint NOT NULL DEFAULT 1,
  "activated_at" timestamptz(3),
  "revoked_at" timestamptz(3),
  "revocation_reason" text,
  "current_health_revision" bigint NOT NULL,
  "recorded_at" timestamptz(3) NOT NULL,
  CONSTRAINT "pk_versions" PRIMARY KEY ("scope_id","version_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_grants" (
  "scope_id" text COLLATE "C" NOT NULL,
  "grant_id" text COLLATE "C" NOT NULL,
  "subject_member_id" integer NOT NULL,
  "created_at" timestamptz(3) NOT NULL,
  "issuance_kind" text NOT NULL,
  "parent_grant_id" text COLLATE "C",
  "parent_grant_revision" bigint,
  "issuance_request_id" text COLLATE "C",
  "issuance_reference" text COLLATE "C",
  "domains" text[] NOT NULL,
  "capabilities" text[] NOT NULL,
  "effective_from" timestamptz(3) NOT NULL,
  "expires_at" timestamptz(3) NOT NULL,
  "granted_by_member_id" integer NOT NULL,
  "verified_by_member_id" integer NOT NULL,
  "verification_ref" text COLLATE "C" NOT NULL,
  "verified_at" timestamptz(3) NOT NULL,
  "revision" bigint NOT NULL DEFAULT 1,
  "revoked_at" timestamptz(3),
  CONSTRAINT "pk_grants" PRIMARY KEY ("scope_id","grant_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_qualifications" (
  "scope_id" text COLLATE "C" NOT NULL,
  "qualification_id" text COLLATE "C" NOT NULL,
  "subject_member_id" integer NOT NULL,
  "qualification_class" text NOT NULL,
  "domains" text[] NOT NULL,
  "jurisdictions" text[] NOT NULL,
  "verified_by_member_id" integer NOT NULL,
  "verification_method" text NOT NULL,
  "verification_ref" text COLLATE "C" NOT NULL,
  "verified_at" timestamptz(3) NOT NULL,
  "effective_from" timestamptz(3) NOT NULL,
  "expires_at" timestamptz(3) NOT NULL,
  "review_due_at" timestamptz(3) NOT NULL,
  "revision" bigint NOT NULL DEFAULT 1,
  "revoked_at" timestamptz(3),
  CONSTRAINT "pk_qualifications" PRIMARY KEY ("scope_id","qualification_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_approvals" (
  "scope_id" text COLLATE "C" NOT NULL,
  "version_id" text COLLATE "C" NOT NULL,
  "approval_id" text COLLATE "C" NOT NULL,
  "review_manifest_digest" text COLLATE "C" NOT NULL,
  "reviewer_member_id" integer NOT NULL,
  "review_grant_id" text COLLATE "C" NOT NULL,
  "qualification_id" text COLLATE "C" NOT NULL,
  "reviewed_at" timestamptz(3) NOT NULL,
  "review_due_at" timestamptz(3) NOT NULL,
  "event_id" text COLLATE "C" NOT NULL,
  CONSTRAINT "pk_approvals" PRIMARY KEY ("scope_id","version_id","approval_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_lkg_attestations" (
  "scope_id" text COLLATE "C" NOT NULL,
  "version_id" text COLLATE "C" NOT NULL,
  "lkg_id" text COLLATE "C" NOT NULL,
  "review_manifest_digest" text COLLATE "C" NOT NULL,
  "reviewer_member_id" integer NOT NULL,
  "health_grant_id" text COLLATE "C" NOT NULL,
  "review_grant_id" text COLLATE "C" NOT NULL,
  "qualification_id" text COLLATE "C" NOT NULL,
  "supporting_approval_id" text COLLATE "C" NOT NULL,
  "approved_at" timestamptz(3) NOT NULL,
  "until_at" timestamptz(3) NOT NULL,
  "event_id" text COLLATE "C" NOT NULL,
  CONSTRAINT "pk_lkg_attestations" PRIMARY KEY ("scope_id","version_id","lkg_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_health_observations" (
  "scope_id" text COLLATE "C" NOT NULL,
  "version_id" text COLLATE "C" NOT NULL,
  "version_revision" bigint NOT NULL,
  "state" text NOT NULL,
  "checked_at" timestamptz(3),
  "last_validated_at" timestamptz(3),
  "warning_at" timestamptz(3),
  "hard_expires_at" timestamptz(3),
  "lkg_id" text COLLATE "C",
  "recorded_at" timestamptz(3) NOT NULL,
  "event_id" text COLLATE "C" NOT NULL,
  CONSTRAINT "pk_health_observations" PRIMARY KEY ("scope_id","version_id","version_revision")
);

CREATE TABLE IF NOT EXISTS "knowledge_publication_assignments" (
  "scope_id" text COLLATE "C" NOT NULL,
  "assignment_id" text COLLATE "C" NOT NULL,
  "source_id" text COLLATE "C" NOT NULL,
  "document_id" text COLLATE "C" NOT NULL,
  "version_id" text COLLATE "C" NOT NULL,
  "review_manifest_digest" text COLLATE "C" NOT NULL,
  "approval_id" text COLLATE "C" NOT NULL,
  "service_from" date NOT NULL,
  "service_to" date,
  "payers" text[] NOT NULL,
  "jurisdictions" text[] NOT NULL,
  "macs" text[],
  "provider_types" text[],
  "settings" text[],
  "benefit_periods" text[],
  "code_editions" text[],
  "products" text[],
  "populations" text[],
  "enabled_uses" text[] NOT NULL,
  "created_at" timestamptz(3) NOT NULL,
  "created_by_member_id" integer NOT NULL,
  "event_id" text COLLATE "C" NOT NULL,
  "predecessor_assignment_id" text COLLATE "C",
  "revision" bigint NOT NULL DEFAULT 1,
  "retired_at" timestamptz(3),
  "retirement_event_id" text COLLATE "C",
  CONSTRAINT "pk_publication_assignments" PRIMARY KEY ("scope_id","assignment_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_command_receipts" (
  "scope_id" text COLLATE "C" NOT NULL,
  "actor_member_id" integer NOT NULL,
  "operation" text NOT NULL,
  "key_hash" text COLLATE "C" NOT NULL,
  "receipt_ref" text COLLATE "C" NOT NULL,
  "fingerprint" text COLLATE "C" NOT NULL,
  "committed_at" timestamptz(3) NOT NULL,
  "scope_revision" bigint NOT NULL,
  "version_ids" text[] NOT NULL,
  "assignment_ids" text[] NOT NULL,
  "event_id" text COLLATE "C",
  CONSTRAINT "pk_command_receipts" PRIMARY KEY ("scope_id","actor_member_id","operation","key_hash")
);

CREATE TABLE IF NOT EXISTS "knowledge_audit_events" (
  "event_id" text COLLATE "C" NOT NULL,
  "scope_id" text COLLATE "C" NOT NULL,
  "schema_version" text NOT NULL DEFAULT 'knowledge-event-v3',
  "request_id" text COLLATE "C" NOT NULL,
  "operation" text NOT NULL,
  "actor_kind" text NOT NULL,
  "actor_member_id" integer,
  "system_actor_id" text COLLATE "C",
  "evidence_ref" text COLLATE "C",
  "aggregate_kind" text NOT NULL,
  "aggregate_id" text COLLATE "C" NOT NULL,
  "source_id" text COLLATE "C",
  "version_id" text COLLATE "C",
  "assignment_id" text COLLATE "C",
  "previous_assignment_id" text COLLATE "C",
  "approval_id" text COLLATE "C",
  "previous_approval_id" text COLLATE "C",
  "logical_rights_id" text COLLATE "C",
  "rights_terms_revision" bigint,
  "previous_revision" bigint NOT NULL,
  "new_revision" bigint NOT NULL,
  "occurred_at" timestamptz(3) NOT NULL,
  "receipt_ref" text COLLATE "C",
  "review_manifest_digest" text COLLATE "C",
  "reason_code" text NOT NULL,
  "invalidation" text NOT NULL,
  "content_removal" boolean NOT NULL,
  "authorization_witnesses" jsonb NOT NULL,
  "expiry_kind" text,
  "expiry_reference_id" text COLLATE "C",
  "expiry_deadline" timestamptz(3),
  "canonical_body" text NOT NULL,
  "body_hash" text COLLATE "C" NOT NULL,
  "recorded_at" timestamptz(3) NOT NULL,
  CONSTRAINT "pk_audit_events" PRIMARY KEY ("event_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_outbox" (
  "event_id" text COLLATE "C" NOT NULL,
  "scope_id" text COLLATE "C" NOT NULL,
  "aggregate_kind" text NOT NULL,
  "aggregate_id" text COLLATE "C" NOT NULL,
  "aggregate_revision" bigint NOT NULL,
  "available_at" timestamptz(3) NOT NULL,
  "attempts" integer NOT NULL DEFAULT 0,
  "lease_token" text COLLATE "C",
  "lease_expires_at" timestamptz(3),
  "delivered_at" timestamptz(3),
  "dead_lettered_at" timestamptz(3),
  "last_error_code" text,
  CONSTRAINT "pk_outbox" PRIMARY KEY ("event_id")
);

CREATE TABLE IF NOT EXISTS "knowledge_consumer_receipts" (
  "consumer_id" text COLLATE "C" NOT NULL,
  "event_id" text COLLATE "C" NOT NULL,
  "scope_id" text COLLATE "C" NOT NULL,
  "body_hash" text COLLATE "C" NOT NULL,
  "processed_at" timestamptz(3) NOT NULL,
  CONSTRAINT "pk_consumer_receipts" PRIMARY KEY ("consumer_id","event_id")
);
-- Independent expected declaration for approved K1B SQL-owned invariants.
CREATE FUNCTION knowledge_valid_set(v text[], minimum integer, maximum integer)
RETURNS boolean LANGUAGE sql IMMUTABLE STRICT SET search_path=pg_catalog,public,pg_temp AS $$
  SELECT cardinality(v) BETWEEN minimum AND maximum
    AND array_ndims(v) IS NOT DISTINCT FROM CASE WHEN cardinality(v)=0 THEN NULL ELSE 1 END
    AND NOT EXISTS (SELECT 1 FROM unnest(v) x WHERE x IS NULL OR x !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$')
    AND v = ARRAY(SELECT DISTINCT x COLLATE "C" FROM unnest(v) x ORDER BY x COLLATE "C");
$$;

CREATE FUNCTION knowledge_valid_witnesses(v jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE STRICT SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE w jsonb; previous_key text[]; current_key text[];
BEGIN
  IF jsonb_typeof(v)<>'array' OR jsonb_array_length(v)>256 THEN RETURN false; END IF;
  FOR w IN SELECT value FROM jsonb_array_elements(v) LOOP
    IF jsonb_typeof(w)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(w))<>11
      OR NOT w ?& ARRAY['witnessType','actorMemberId','scopeId','domain','capability','grantId','grantRevision','qualificationId','qualificationRevision','attestationId','attestedAt']
      OR jsonb_typeof(w->'witnessType')<>'string' OR w->>'witnessType' NOT IN ('ACTOR_CAPABILITY','REVIEW_ATTESTATION','RIGHTS_ATTESTATION','LKG_HEALTH_ATTESTATION','LKG_REVIEW_ATTESTATION')
      OR jsonb_typeof(w->'actorMemberId')<>'number' OR (w->>'actorMemberId')::numeric NOT BETWEEN 1 AND 2147483647
      OR (w->>'actorMemberId')::numeric<>trunc((w->>'actorMemberId')::numeric)
      OR jsonb_typeof(w->'grantRevision')<>'number' OR (w->>'grantRevision')::numeric NOT BETWEEN 0 AND 9007199254740991
      OR (w->>'grantRevision')::numeric<>trunc((w->>'grantRevision')::numeric)
      OR w->>'domain' IS NULL OR w->>'domain' NOT IN ('STATUTE','REGULATION','STATE_LAW','MEDICARE_NATIONAL','MAC_COVERAGE','CMS_MANUAL','CMS_PAYMENT','OFFICIAL_CODING','DRUG_TERMINOLOGY','DRUG_LABEL','PHARMACOLOGY','CLINICAL_EVIDENCE','CLINICAL_PROTOCOL','PATIENT_EVIDENCE','DETERMINISTIC_DERIVATION','MODEL_INFERENCE','SPARTAN_WORKFLOW','QUALITY_REPORTING','COMPLIANCE')
      OR w->>'capability' IS NULL OR w->>'capability' NOT IN ('knowledge.read','knowledge.register','knowledge.submit','knowledge.review','knowledge.activate','knowledge.revoke','knowledge.rollback','knowledge.license','knowledge.health','knowledge.grants')
      OR jsonb_typeof(w->'scopeId')<>'string' OR w->>'scopeId' !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
      OR jsonb_typeof(w->'grantId')<>'string' OR w->>'grantId' !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
      OR (w->'qualificationId'<>'null'::jsonb AND (jsonb_typeof(w->'qualificationId')<>'string' OR w->>'qualificationId' !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$' OR jsonb_typeof(w->'qualificationRevision')<>'number' OR (w->>'qualificationRevision')::numeric NOT BETWEEN 0 AND 9007199254740991 OR (w->>'qualificationRevision')::numeric<>trunc((w->>'qualificationRevision')::numeric)))
      OR (w->'attestationId'<>'null'::jsonb AND (jsonb_typeof(w->'attestationId')<>'string' OR w->>'attestationId' !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$' OR jsonb_typeof(w->'attestedAt')<>'string' OR w->>'attestedAt' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$'))
      OR (w->>'witnessType' IN ('REVIEW_ATTESTATION','LKG_REVIEW_ATTESTATION') AND w->>'capability'<>'knowledge.review')
      OR (w->>'witnessType'='RIGHTS_ATTESTATION' AND w->>'capability'<>'knowledge.license')
      OR (w->>'witnessType'='LKG_HEALTH_ATTESTATION' AND w->>'capability'<>'knowledge.health')
      OR (w->'qualificationId'='null'::jsonb)<>(w->'qualificationRevision'='null'::jsonb)
      OR (w->'attestationId'='null'::jsonb)<>(w->'attestedAt'='null'::jsonb)
      OR ((w->>'witnessType'='ACTOR_CAPABILITY')<>(w->'attestationId'='null'::jsonb))
      OR (w->>'witnessType' IN ('REVIEW_ATTESTATION','RIGHTS_ATTESTATION','LKG_REVIEW_ATTESTATION') AND w->'qualificationId'='null'::jsonb)
      OR (w->>'witnessType'='LKG_HEALTH_ATTESTATION' AND w->'qualificationId'<>'null'::jsonb)
    THEN RETURN false; END IF;
    IF w->'attestedAt'<>'null'::jsonb AND NOT knowledge_valid_stamp(w->>'attestedAt') THEN RETURN false; END IF;
    current_key:=ARRAY[w->>'witnessType',w->>'scopeId',lpad(w->>'actorMemberId',16,'0'),w->>'domain',w->>'capability',w->>'grantId',lpad(w->>'grantRevision',16,'0'),coalesce(w->>'qualificationId',''),coalesce(lpad(w->>'qualificationRevision',16,'0'),''),coalesce(w->>'attestationId',''),coalesce(w->>'attestedAt','')];
    IF previous_key IS NOT NULL AND previous_key COLLATE "C">=current_key COLLATE "C" THEN RETURN false; END IF;
    previous_key:=current_key;
  END LOOP;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END;
$$;

CREATE FUNCTION knowledge_iso(v timestamptz)
RETURNS text LANGUAGE sql IMMUTABLE STRICT SET search_path=pg_catalog,public,pg_temp AS $$
  SELECT CASE WHEN extract(year FROM v AT TIME ZONE 'UTC')=-1 THEN '0000' ELSE to_char(v AT TIME ZONE 'UTC','YYYY') END || to_char(v AT TIME ZONE 'UTC','-MM-DD"T"HH24:MI:SS.MS"Z"');
$$;

CREATE FUNCTION knowledge_valid_stamp(v text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE STRICT SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE parsed timestamptz;
BEGIN
  IF v !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$' THEN RETURN false; END IF;
  parsed:=(CASE WHEN left(v,4)='0000' THEN '0001'||substring(v FROM 5)||' BC' ELSE v END)::timestamptz;
  RETURN isfinite(parsed) AND knowledge_iso(parsed)=v;
EXCEPTION WHEN OTHERS THEN RETURN false;
END;
$$;

CREATE FUNCTION knowledge_history_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE old_body jsonb; new_body jsonb; mutable text[];
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'KNOWLEDGE_HISTORY_IMMUTABLE' USING ERRCODE='23514'; END IF;
  mutable := CASE TG_TABLE_NAME
    WHEN 'knowledge_scopes' THEN ARRAY['revision']
    WHEN 'knowledge_versions' THEN ARRAY['state','revision','activated_at','revoked_at','revocation_reason','submitted_by_member_id','current_health_revision']
    WHEN 'knowledge_rights_state' THEN ARRAY['revision','revoked_at']
    WHEN 'knowledge_grants' THEN ARRAY['revision','revoked_at']
    WHEN 'knowledge_qualifications' THEN ARRAY['revision','revoked_at']
    WHEN 'knowledge_publication_assignments' THEN ARRAY['revision','retired_at','retirement_event_id']
    WHEN 'knowledge_outbox' THEN ARRAY['available_at','attempts','lease_token','lease_expires_at','delivered_at','dead_lettered_at','last_error_code']
    ELSE ARRAY[]::text[] END;
  old_body:=to_jsonb(OLD); new_body:=to_jsonb(NEW);
  IF cardinality(mutable)=0 OR (old_body-mutable) IS DISTINCT FROM (new_body-mutable) THEN
    RAISE EXCEPTION 'KNOWLEDGE_HISTORY_IMMUTABLE' USING ERRCODE='23514';
  END IF;
  IF TG_TABLE_NAME<>'knowledge_outbox' AND (new_body->>'revision')::bigint<>(old_body->>'revision')::bigint+1 THEN
    RAISE EXCEPTION 'KNOWLEDGE_REVISION_CONFLICT' USING ERRCODE='23514';
  END IF;
  IF TG_TABLE_NAME IN ('knowledge_rights_state','knowledge_grants','knowledge_qualifications')
    AND (old_body->>'revoked_at' IS NOT NULL OR new_body->>'revoked_at' IS NULL) THEN
    RAISE EXCEPTION 'KNOWLEDGE_REVOCATION_IMMUTABLE' USING ERRCODE='23514';
  END IF;
  IF TG_TABLE_NAME='knowledge_publication_assignments'
    AND (old_body->>'retired_at' IS NOT NULL OR new_body->>'retired_at' IS NULL OR new_body->>'retirement_event_id' IS NULL OR (old_body->>'revision')::bigint<>1 OR (new_body->>'revision')::bigint<>2) THEN
    RAISE EXCEPTION 'KNOWLEDGE_RETIREMENT_IMMUTABLE' USING ERRCODE='23514';
  END IF;
  IF TG_TABLE_NAME='knowledge_versions' THEN
    IF OLD.submitted_by_member_id IS NOT NULL AND NEW.submitted_by_member_id IS DISTINCT FROM OLD.submitted_by_member_id
      OR OLD.activated_at IS NOT NULL AND NEW.activated_at IS DISTINCT FROM OLD.activated_at
      OR OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS DISTINCT FROM OLD.revoked_at
      OR NEW.current_health_revision<>OLD.current_health_revision AND NEW.current_health_revision<>NEW.revision THEN
      RAISE EXCEPTION 'KNOWLEDGE_VERSION_HISTORY_IMMUTABLE' USING ERRCODE='23514';
    END IF;
  END IF;
  IF TG_TABLE_NAME='knowledge_outbox' AND
    (old_body->>'delivered_at' IS NOT NULL OR old_body->>'dead_lettered_at' IS NOT NULL OR (new_body->>'attempts')::integer<(old_body->>'attempts')::integer OR (new_body->>'attempts')::integer>(old_body->>'attempts')::integer+1) THEN
    RAISE EXCEPTION 'KNOWLEDGE_OUTBOX_STATE_INVALID' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION knowledge_audit_consistency() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE e knowledge_audit_events; body jsonb; projected jsonb; exists_aggregate boolean;
BEGIN
  SELECT * INTO e FROM knowledge_audit_events WHERE event_id=NEW.event_id;
  body:=e.canonical_body::jsonb;
  projected:=jsonb_build_object(
    'id',e.event_id,'schemaVersion',e.schema_version,'scopeId',e.scope_id,
    'aggregateKind',e.aggregate_kind,'aggregateId',e.aggregate_id,'sourceId',e.source_id,'versionId',e.version_id,
    'assignmentId',e.assignment_id,'previousAssignmentId',e.previous_assignment_id,
    'approvalId',e.approval_id,'previousApprovalId',e.previous_approval_id,
    'operation',e.operation,'authorizationWitnesses',e.authorization_witnesses,
    'logicalRightsId',e.logical_rights_id,'rightsTermsRevision',e.rights_terms_revision,
    'expiryCondition',CASE WHEN e.expiry_kind IS NULL THEN NULL ELSE jsonb_build_object('kind',e.expiry_kind,'referenceId',e.expiry_reference_id,'deadline',knowledge_iso(e.expiry_deadline)) END,
    'previousRevision',e.previous_revision,'newRevision',e.new_revision,
    'occurredAt',knowledge_iso(e.occurred_at),
    'requestId',e.request_id,'receiptRef',e.receipt_ref,'reviewManifestDigest',e.review_manifest_digest,
    'reasonCode',e.reason_code,'invalidation',e.invalidation,'contentRemoval',e.content_removal,
    'actorKind',e.actor_kind,'actorMemberId',e.actor_member_id,'systemActorId',e.system_actor_id,'evidenceRef',e.evidence_ref);
  IF body IS DISTINCT FROM projected THEN RAISE EXCEPTION 'KNOWLEDGE_AUDIT_BODY_MISMATCH' USING ERRCODE='23514'; END IF;
  SELECT CASE e.aggregate_kind
    WHEN 'VERSION' THEN EXISTS(SELECT 1 FROM knowledge_versions WHERE scope_id=e.scope_id AND version_id=e.aggregate_id AND source_id=e.source_id)
    WHEN 'PUBLICATION' THEN e.aggregate_id=e.scope_id
    WHEN 'GRANT' THEN EXISTS(SELECT 1 FROM knowledge_grants WHERE scope_id=e.scope_id AND grant_id=e.aggregate_id)
    WHEN 'QUALIFICATION' THEN EXISTS(SELECT 1 FROM knowledge_qualifications WHERE scope_id=e.scope_id AND qualification_id=e.aggregate_id)
    WHEN 'RIGHTS_REVISION' THEN EXISTS(SELECT 1 FROM knowledge_rights_terms WHERE scope_id=e.scope_id AND rights_revision_id=e.aggregate_id AND logical_rights_id=e.logical_rights_id AND terms_revision=e.rights_terms_revision)
    ELSE false END INTO exists_aggregate;
  IF NOT exists_aggregate THEN RAISE EXCEPTION 'KNOWLEDGE_AUDIT_AGGREGATE_INVALID' USING ERRCODE='23514'; END IF;
  IF e.operation IN ('ACTIVATE','SUPERSEDE','ROLLBACK','REFRESH_APPROVAL') THEN
    IF e.assignment_id IS NULL OR e.approval_id IS NULL OR e.version_id IS NULL
      OR NOT EXISTS(SELECT 1 FROM knowledge_publication_assignments p WHERE p.scope_id=e.scope_id AND p.assignment_id=e.assignment_id AND p.approval_id=e.approval_id AND p.version_id=e.version_id AND p.review_manifest_digest=e.review_manifest_digest AND p.event_id=e.event_id)
      OR e.operation IN ('SUPERSEDE','ROLLBACK','REFRESH_APPROVAL') AND (e.previous_assignment_id IS NULL OR e.previous_approval_id IS NULL
        OR NOT EXISTS(SELECT 1 FROM knowledge_publication_assignments p WHERE p.scope_id=e.scope_id AND p.assignment_id=e.previous_assignment_id AND p.approval_id=e.previous_approval_id AND p.retirement_event_id=e.event_id))
    THEN RAISE EXCEPTION 'KNOWLEDGE_AUDIT_PUBLICATION_INVALID' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE FUNCTION knowledge_outbox_consistency() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM knowledge_audit_events e WHERE e.scope_id=NEW.scope_id AND e.event_id=NEW.event_id
    AND e.aggregate_kind=NEW.aggregate_kind AND e.aggregate_id=NEW.aggregate_id AND e.new_revision=NEW.aggregate_revision) THEN
    RAISE EXCEPTION 'KNOWLEDGE_OUTBOX_IDENTITY_INVALID' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION knowledge_health_consistency() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
  IF NEW.lkg_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM knowledge_lkg_attestations l
    WHERE l.scope_id=NEW.scope_id AND l.version_id=NEW.version_id AND l.lkg_id=NEW.lkg_id AND l.until_at<=NEW.hard_expires_at) THEN
    RAISE EXCEPTION 'KNOWLEDGE_LKG_DEADLINE_INVALID' USING ERRCODE='23514';
  END IF;
  RETURN NULL;
END;
$$;

ALTER TABLE "knowledge_scope_members" ADD CONSTRAINT "fk_scope_members_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "fk_sources_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_source_revisions" ADD CONSTRAINT "fk_source_revisions_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "fk_documents_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "fk_rights_terms_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_rights_state" ADD CONSTRAINT "fk_rights_state_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "fk_versions_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "fk_grants_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "fk_qualifications_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "fk_approvals_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "fk_lkg_attestations_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "fk_health_observations_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "fk_publication_assignments_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "fk_command_receipts_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "fk_audit_events_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "fk_outbox_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_consumer_receipts" ADD CONSTRAINT "fk_consumer_receipts_scope" FOREIGN KEY ("scope_id") REFERENCES "knowledge_scopes" ("scope_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_scopes" ADD CONSTRAINT "fk_scopes_organization" FOREIGN KEY ("organization_id") REFERENCES "client_organizations" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_scopes" ADD CONSTRAINT "uq_scopes_organization" UNIQUE ("organization_id");
ALTER TABLE "knowledge_scope_members" ADD CONSTRAINT "fk_scope_members_member" FOREIGN KEY ("member_id") REFERENCES "client_members" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_source_revisions" ADD CONSTRAINT "fk_source_revisions_source" FOREIGN KEY ("scope_id","source_id") REFERENCES "knowledge_sources" ("scope_id","source_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "fk_documents_source" FOREIGN KEY ("scope_id","source_id") REFERENCES "knowledge_sources" ("scope_id","source_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "fk_versions_source" FOREIGN KEY ("scope_id","source_id","source_metadata_revision") REFERENCES "knowledge_source_revisions" ("scope_id","source_id","metadata_revision") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "fk_versions_document" FOREIGN KEY ("scope_id","source_id","document_id") REFERENCES "knowledge_documents" ("scope_id","source_id","document_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "fk_versions_rights" FOREIGN KEY ("scope_id","rights_revision_id") REFERENCES "knowledge_rights_terms" ("scope_id","rights_revision_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "fk_versions_health" FOREIGN KEY ("scope_id","version_id","current_health_revision") REFERENCES "knowledge_health_observations" ("scope_id","version_id","version_revision") ON UPDATE NO ACTION ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "uq_versions_artifact" UNIQUE ("scope_id","source_id","document_id","upstream_edition","artifact_revision");
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "uq_versions_document_target" UNIQUE ("scope_id","version_id","source_id","document_id");
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "uq_rights_terms_terms" UNIQUE ("scope_id","logical_rights_id","terms_revision");
ALTER TABLE "knowledge_rights_state" ADD CONSTRAINT "fk_rights_state_terms" FOREIGN KEY ("scope_id","rights_revision_id") REFERENCES "knowledge_rights_terms" ("scope_id","rights_revision_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "fk_rights_terms_overlay" FOREIGN KEY ("scope_id","rights_revision_id") REFERENCES "knowledge_rights_state" ("scope_id","rights_revision_id") ON UPDATE NO ACTION ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "fk_grants_parent" FOREIGN KEY ("scope_id","parent_grant_id") REFERENCES "knowledge_grants" ("scope_id","grant_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "fk_versions_registered_by_member_id" FOREIGN KEY ("scope_id","registered_by_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "fk_versions_submitted_by_member_id" FOREIGN KEY ("scope_id","submitted_by_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "fk_rights_terms_verified_by_member_id" FOREIGN KEY ("scope_id","verified_by_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "fk_grants_subject_member_id" FOREIGN KEY ("scope_id","subject_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "fk_grants_granted_by_member_id" FOREIGN KEY ("scope_id","granted_by_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "fk_grants_verified_by_member_id" FOREIGN KEY ("scope_id","verified_by_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "fk_qualifications_subject_member_id" FOREIGN KEY ("scope_id","subject_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "fk_qualifications_verified_by_member_id" FOREIGN KEY ("scope_id","verified_by_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "fk_approvals_reviewer_member_id" FOREIGN KEY ("scope_id","reviewer_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "fk_lkg_attestations_reviewer_member_id" FOREIGN KEY ("scope_id","reviewer_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "fk_publication_assignments_created_by_member_id" FOREIGN KEY ("scope_id","created_by_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "fk_command_receipts_actor_member_id" FOREIGN KEY ("scope_id","actor_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "fk_audit_events_actor_member_id" FOREIGN KEY ("scope_id","actor_member_id") REFERENCES "knowledge_scope_members" ("scope_id","member_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "fk_rights_terms_verification_grant_id" FOREIGN KEY ("scope_id","verification_grant_id") REFERENCES "knowledge_grants" ("scope_id","grant_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "fk_approvals_review_grant_id" FOREIGN KEY ("scope_id","review_grant_id") REFERENCES "knowledge_grants" ("scope_id","grant_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "fk_lkg_attestations_health_grant_id" FOREIGN KEY ("scope_id","health_grant_id") REFERENCES "knowledge_grants" ("scope_id","grant_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "fk_lkg_attestations_review_grant_id" FOREIGN KEY ("scope_id","review_grant_id") REFERENCES "knowledge_grants" ("scope_id","grant_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "fk_rights_terms_verification_qualification_id" FOREIGN KEY ("scope_id","verification_qualification_id") REFERENCES "knowledge_qualifications" ("scope_id","qualification_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "fk_approvals_qualification_id" FOREIGN KEY ("scope_id","qualification_id") REFERENCES "knowledge_qualifications" ("scope_id","qualification_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "fk_lkg_attestations_qualification_id" FOREIGN KEY ("scope_id","qualification_id") REFERENCES "knowledge_qualifications" ("scope_id","qualification_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "fk_approvals_version" FOREIGN KEY ("scope_id","version_id") REFERENCES "knowledge_versions" ("scope_id","version_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "fk_lkg_attestations_version" FOREIGN KEY ("scope_id","version_id") REFERENCES "knowledge_versions" ("scope_id","version_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "fk_health_observations_version" FOREIGN KEY ("scope_id","version_id") REFERENCES "knowledge_versions" ("scope_id","version_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "uq_approvals_digest_target" UNIQUE ("scope_id","version_id","approval_id","review_manifest_digest");
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "fk_lkg_attestations_supporting_approval" FOREIGN KEY ("scope_id","version_id","supporting_approval_id","review_manifest_digest") REFERENCES "knowledge_approvals" ("scope_id","version_id","approval_id","review_manifest_digest") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "fk_health_observations_lkg" FOREIGN KEY ("scope_id","version_id","lkg_id") REFERENCES "knowledge_lkg_attestations" ("scope_id","version_id","lkg_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "fk_publication_assignments_version" FOREIGN KEY ("scope_id","version_id","source_id","document_id") REFERENCES "knowledge_versions" ("scope_id","version_id","source_id","document_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "fk_publication_assignments_approval" FOREIGN KEY ("scope_id","version_id","approval_id","review_manifest_digest") REFERENCES "knowledge_approvals" ("scope_id","version_id","approval_id","review_manifest_digest") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "fk_publication_assignments_predecessor" FOREIGN KEY ("scope_id","predecessor_assignment_id") REFERENCES "knowledge_publication_assignments" ("scope_id","assignment_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "uq_audit_events_scope_event" UNIQUE ("scope_id","event_id");
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "uq_command_receipts_reference" UNIQUE ("scope_id","receipt_ref");
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "fk_approvals_event" FOREIGN KEY ("scope_id","event_id") REFERENCES "knowledge_audit_events" ("scope_id","event_id") ON UPDATE NO ACTION ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "fk_lkg_attestations_event" FOREIGN KEY ("scope_id","event_id") REFERENCES "knowledge_audit_events" ("scope_id","event_id") ON UPDATE NO ACTION ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "fk_health_observations_event" FOREIGN KEY ("scope_id","event_id") REFERENCES "knowledge_audit_events" ("scope_id","event_id") ON UPDATE NO ACTION ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "fk_publication_assignments_event" FOREIGN KEY ("scope_id","event_id") REFERENCES "knowledge_audit_events" ("scope_id","event_id") ON UPDATE NO ACTION ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "fk_command_receipts_event" FOREIGN KEY ("scope_id","event_id") REFERENCES "knowledge_audit_events" ("scope_id","event_id") ON UPDATE NO ACTION ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "fk_publication_assignments_retirement_event" FOREIGN KEY ("scope_id","retirement_event_id") REFERENCES "knowledge_audit_events" ("scope_id","event_id") ON UPDATE NO ACTION ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "fk_audit_events_receipt" FOREIGN KEY ("scope_id","receipt_ref") REFERENCES "knowledge_command_receipts" ("scope_id","receipt_ref") ON UPDATE NO ACTION ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "fk_audit_events_source" FOREIGN KEY ("scope_id","source_id") REFERENCES "knowledge_sources" ("scope_id","source_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "fk_audit_events_version" FOREIGN KEY ("scope_id","version_id") REFERENCES "knowledge_versions" ("scope_id","version_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "fk_audit_events_assignment" FOREIGN KEY ("scope_id","assignment_id") REFERENCES "knowledge_publication_assignments" ("scope_id","assignment_id") ON UPDATE NO ACTION ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "fk_audit_events_previous_assignment" FOREIGN KEY ("scope_id","previous_assignment_id") REFERENCES "knowledge_publication_assignments" ("scope_id","assignment_id") ON UPDATE NO ACTION ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "fk_audit_events_approval" FOREIGN KEY ("scope_id","version_id","approval_id") REFERENCES "knowledge_approvals" ("scope_id","version_id","approval_id") ON UPDATE NO ACTION ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "fk_audit_events_rights" FOREIGN KEY ("scope_id","logical_rights_id","rights_terms_revision") REFERENCES "knowledge_rights_terms" ("scope_id","logical_rights_id","terms_revision") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "fk_outbox_event" FOREIGN KEY ("scope_id","event_id") REFERENCES "knowledge_audit_events" ("scope_id","event_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_consumer_receipts" ADD CONSTRAINT "fk_consumer_receipts_event" FOREIGN KEY ("scope_id","event_id") REFERENCES "knowledge_audit_events" ("scope_id","event_id") ON UPDATE NO ACTION ON DELETE RESTRICT;
ALTER TABLE "knowledge_scopes" ADD CONSTRAINT "ck_scopes_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_scopes" ADD CONSTRAINT "ck_scopes_organization_id" CHECK ("organization_id" > 0);
ALTER TABLE "knowledge_scopes" ADD CONSTRAINT "ck_scopes_revision" CHECK ("revision" BETWEEN 0 AND 9007199254740991);
ALTER TABLE "knowledge_scopes" ADD CONSTRAINT "ck_scopes_supported_payers" CHECK (knowledge_valid_set("supported_payers", 1, 100));
ALTER TABLE "knowledge_scopes" ADD CONSTRAINT "ck_scopes_supported_jurisdictions" CHECK (knowledge_valid_set("supported_jurisdictions", 1, 100));
ALTER TABLE "knowledge_scopes" ADD CONSTRAINT "ck_scopes_created_at" CHECK (isfinite("created_at") AND "created_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "created_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_scope_members" ADD CONSTRAINT "ck_scope_members_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_scope_members" ADD CONSTRAINT "ck_scope_members_member_id" CHECK ("member_id" > 0);
ALTER TABLE "knowledge_scope_members" ADD CONSTRAINT "ck_scope_members_recorded_at" CHECK (isfinite("recorded_at") AND "recorded_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "recorded_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "ck_sources_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "ck_sources_source_id" CHECK ("source_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "ck_sources_created_at" CHECK (isfinite("created_at") AND "created_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "created_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_source_revisions" ADD CONSTRAINT "ck_source_revisions_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_source_revisions" ADD CONSTRAINT "ck_source_revisions_source_id" CHECK ("source_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_source_revisions" ADD CONSTRAINT "ck_source_revisions_metadata_revision" CHECK ("metadata_revision" BETWEEN 1 AND 9007199254740991);
ALTER TABLE "knowledge_source_revisions" ADD CONSTRAINT "ck_source_revisions_claim_types" CHECK (knowledge_valid_set("claim_types", 1, 100));
ALTER TABLE "knowledge_source_revisions" ADD CONSTRAINT "ck_source_revisions_recorded_at" CHECK (isfinite("recorded_at") AND "recorded_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "recorded_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "ck_documents_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "ck_documents_source_id" CHECK ("source_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "ck_documents_document_id" CHECK ("document_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "ck_documents_created_at" CHECK (isfinite("created_at") AND "created_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "created_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_rights_revision_id" CHECK ("rights_revision_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_logical_rights_id" CHECK ("logical_rights_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_terms_revision" CHECK ("terms_revision" BETWEEN 1 AND 9007199254740991);
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_owner_ref" CHECK ("owner_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_reference_ref" CHECK ("reference_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_effective_from" CHECK (isfinite("effective_from") AND "effective_from">=timestamptz '0001-01-01 00:00:00+00 BC' AND "effective_from"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_expires_at" CHECK (isfinite("expires_at") AND "expires_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "expires_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_permitted_uses" CHECK (knowledge_valid_set("permitted_uses", 0, 100));
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_verified_by_member_id" CHECK ("verified_by_member_id" > 0);
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_verification_grant_id" CHECK ("verification_grant_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_verification_qualification_id" CHECK ("verification_qualification_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_verification_ref" CHECK ("verification_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_verified_at" CHECK (isfinite("verified_at") AND "verified_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "verified_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_recorded_at" CHECK (isfinite("recorded_at") AND "recorded_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "recorded_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_rights_state" ADD CONSTRAINT "ck_rights_state_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_rights_state" ADD CONSTRAINT "ck_rights_state_rights_revision_id" CHECK ("rights_revision_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_rights_state" ADD CONSTRAINT "ck_rights_state_revision" CHECK ("revision" BETWEEN 0 AND 9007199254740991);
ALTER TABLE "knowledge_rights_state" ADD CONSTRAINT "ck_rights_state_revoked_at" CHECK (isfinite("revoked_at") AND "revoked_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "revoked_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_version_id" CHECK ("version_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_source_id" CHECK ("source_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_source_metadata_revision" CHECK ("source_metadata_revision" BETWEEN 1 AND 9007199254740991);
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_document_id" CHECK ("document_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_upstream_edition" CHECK ("upstream_edition" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_artifact_revision" CHECK ("artifact_revision" BETWEEN 1 AND 9007199254740991);
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_raw_hash" CHECK ("raw_hash" ~ '^[a-f0-9]{64}$');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_normalized_hash" CHECK ("normalized_hash" ~ '^[a-f0-9]{64}$');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_parser_id" CHECK ("parser_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_parser_version" CHECK ("parser_version" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_published_at" CHECK (isfinite("published_at") AND "published_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "published_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_retrieved_at" CHECK (isfinite("retrieved_at") AND "retrieved_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "retrieved_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_effective_from" CHECK (isfinite("effective_from") AND "effective_from">=date '0001-01-01 BC' AND "effective_from"<date '10000-01-01');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_effective_to" CHECK (isfinite("effective_to") AND "effective_to">=date '0001-01-01 BC' AND "effective_to"<date '10000-01-01');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_payers" CHECK (knowledge_valid_set("payers", 1, 100));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_jurisdictions" CHECK (knowledge_valid_set("jurisdictions", 1, 100));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_macs" CHECK (knowledge_valid_set("macs", 1, 100));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_provider_types" CHECK (knowledge_valid_set("provider_types", 1, 100));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_settings" CHECK (knowledge_valid_set("settings", 1, 100));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_benefit_periods" CHECK (knowledge_valid_set("benefit_periods", 1, 100));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_code_editions" CHECK (knowledge_valid_set("code_editions", 1, 100));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_products" CHECK (knowledge_valid_set("products", 1, 100));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_populations" CHECK (knowledge_valid_set("populations", 1, 100));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_rights_revision_id" CHECK ("rights_revision_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_registered_by_member_id" CHECK ("registered_by_member_id" > 0);
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_submitted_by_member_id" CHECK ("submitted_by_member_id" > 0);
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_conflicts_with" CHECK (knowledge_valid_set("conflicts_with", 0, 100));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_revision" CHECK ("revision" BETWEEN 0 AND 9007199254740991);
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_activated_at" CHECK (isfinite("activated_at") AND "activated_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "activated_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_revoked_at" CHECK (isfinite("revoked_at") AND "revoked_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "revoked_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_current_health_revision" CHECK ("current_health_revision" BETWEEN 0 AND 9007199254740991);
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_recorded_at" CHECK (isfinite("recorded_at") AND "recorded_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "recorded_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_grant_id" CHECK ("grant_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_subject_member_id" CHECK ("subject_member_id" > 0);
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_created_at" CHECK (isfinite("created_at") AND "created_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "created_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_parent_grant_id" CHECK ("parent_grant_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_parent_grant_revision" CHECK ("parent_grant_revision" BETWEEN 0 AND 9007199254740991);
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_issuance_request_id" CHECK ("issuance_request_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_issuance_reference" CHECK ("issuance_reference" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_domains" CHECK (knowledge_valid_set("domains", 1, 100));
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_capabilities" CHECK (knowledge_valid_set("capabilities", 1, 100));
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_effective_from" CHECK (isfinite("effective_from") AND "effective_from">=timestamptz '0001-01-01 00:00:00+00 BC' AND "effective_from"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_expires_at" CHECK (isfinite("expires_at") AND "expires_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "expires_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_granted_by_member_id" CHECK ("granted_by_member_id" > 0);
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_verified_by_member_id" CHECK ("verified_by_member_id" > 0);
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_verification_ref" CHECK ("verification_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_verified_at" CHECK (isfinite("verified_at") AND "verified_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "verified_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_revision" CHECK ("revision" BETWEEN 0 AND 9007199254740991);
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_revoked_at" CHECK (isfinite("revoked_at") AND "revoked_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "revoked_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_qualification_id" CHECK ("qualification_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_subject_member_id" CHECK ("subject_member_id" > 0);
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_domains" CHECK (knowledge_valid_set("domains", 1, 100));
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_jurisdictions" CHECK (knowledge_valid_set("jurisdictions", 1, 100));
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_verified_by_member_id" CHECK ("verified_by_member_id" > 0);
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_verification_ref" CHECK ("verification_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_verified_at" CHECK (isfinite("verified_at") AND "verified_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "verified_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_effective_from" CHECK (isfinite("effective_from") AND "effective_from">=timestamptz '0001-01-01 00:00:00+00 BC' AND "effective_from"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_expires_at" CHECK (isfinite("expires_at") AND "expires_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "expires_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_review_due_at" CHECK (isfinite("review_due_at") AND "review_due_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "review_due_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_revision" CHECK ("revision" BETWEEN 0 AND 9007199254740991);
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_revoked_at" CHECK (isfinite("revoked_at") AND "revoked_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "revoked_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "ck_approvals_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "ck_approvals_version_id" CHECK ("version_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "ck_approvals_approval_id" CHECK ("approval_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "ck_approvals_review_manifest_digest" CHECK ("review_manifest_digest" ~ '^[a-f0-9]{64}$');
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "ck_approvals_reviewer_member_id" CHECK ("reviewer_member_id" > 0);
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "ck_approvals_review_grant_id" CHECK ("review_grant_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "ck_approvals_qualification_id" CHECK ("qualification_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "ck_approvals_reviewed_at" CHECK (isfinite("reviewed_at") AND "reviewed_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "reviewed_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "ck_approvals_review_due_at" CHECK (isfinite("review_due_at") AND "review_due_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "review_due_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "ck_approvals_event_id" CHECK ("event_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_version_id" CHECK ("version_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_lkg_id" CHECK ("lkg_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_review_manifest_digest" CHECK ("review_manifest_digest" ~ '^[a-f0-9]{64}$');
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_reviewer_member_id" CHECK ("reviewer_member_id" > 0);
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_health_grant_id" CHECK ("health_grant_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_review_grant_id" CHECK ("review_grant_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_qualification_id" CHECK ("qualification_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_supporting_approval_id" CHECK ("supporting_approval_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_approved_at" CHECK (isfinite("approved_at") AND "approved_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "approved_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_until_at" CHECK (isfinite("until_at") AND "until_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "until_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_event_id" CHECK ("event_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "ck_health_observations_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "ck_health_observations_version_id" CHECK ("version_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "ck_health_observations_version_revision" CHECK ("version_revision" BETWEEN 0 AND 9007199254740991);
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "ck_health_observations_checked_at" CHECK (isfinite("checked_at") AND "checked_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "checked_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "ck_health_observations_last_validated_at" CHECK (isfinite("last_validated_at") AND "last_validated_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "last_validated_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "ck_health_observations_warning_at" CHECK (isfinite("warning_at") AND "warning_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "warning_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "ck_health_observations_hard_expires_at" CHECK (isfinite("hard_expires_at") AND "hard_expires_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "hard_expires_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "ck_health_observations_lkg_id" CHECK ("lkg_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "ck_health_observations_recorded_at" CHECK (isfinite("recorded_at") AND "recorded_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "recorded_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "ck_health_observations_event_id" CHECK ("event_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_assignment_id" CHECK ("assignment_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_source_id" CHECK ("source_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_document_id" CHECK ("document_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_version_id" CHECK ("version_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_review_manifest_digest" CHECK ("review_manifest_digest" ~ '^[a-f0-9]{64}$');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_approval_id" CHECK ("approval_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_service_from" CHECK (isfinite("service_from") AND "service_from">=date '0001-01-01 BC' AND "service_from"<date '10000-01-01');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_service_to" CHECK (isfinite("service_to") AND "service_to">=date '0001-01-01 BC' AND "service_to"<date '10000-01-01');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_payers" CHECK (knowledge_valid_set("payers", 1, 100));
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_jurisdictions" CHECK (knowledge_valid_set("jurisdictions", 1, 100));
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_macs" CHECK (knowledge_valid_set("macs", 1, 100));
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_provider_types" CHECK (knowledge_valid_set("provider_types", 1, 100));
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_settings" CHECK (knowledge_valid_set("settings", 1, 100));
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_benefit_periods" CHECK (knowledge_valid_set("benefit_periods", 1, 100));
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_code_editions" CHECK (knowledge_valid_set("code_editions", 1, 100));
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_products" CHECK (knowledge_valid_set("products", 1, 100));
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_populations" CHECK (knowledge_valid_set("populations", 1, 100));
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_enabled_uses" CHECK (knowledge_valid_set("enabled_uses", 1, 100));
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_created_at" CHECK (isfinite("created_at") AND "created_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "created_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_created_by_member_id" CHECK ("created_by_member_id" > 0);
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_event_id" CHECK ("event_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_predecessor_assignment_id" CHECK ("predecessor_assignment_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_revision" CHECK ("revision" BETWEEN 1 AND 9007199254740991);
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_retired_at" CHECK (isfinite("retired_at") AND "retired_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "retired_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_retirement_event_id" CHECK ("retirement_event_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "ck_command_receipts_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "ck_command_receipts_actor_member_id" CHECK ("actor_member_id" > 0);
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "ck_command_receipts_key_hash" CHECK ("key_hash" ~ '^[a-f0-9]{64}$');
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "ck_command_receipts_receipt_ref" CHECK ("receipt_ref" ~ '^[a-f0-9]{64}$');
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "ck_command_receipts_fingerprint" CHECK ("fingerprint" ~ '^[a-f0-9]{64}$');
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "ck_command_receipts_committed_at" CHECK (isfinite("committed_at") AND "committed_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "committed_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "ck_command_receipts_scope_revision" CHECK ("scope_revision" BETWEEN 0 AND 9007199254740991);
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "ck_command_receipts_version_ids" CHECK (knowledge_valid_set("version_ids", 0, 2000));
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "ck_command_receipts_assignment_ids" CHECK (knowledge_valid_set("assignment_ids", 0, 4000));
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "ck_command_receipts_event_id" CHECK ("event_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_event_id" CHECK ("event_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_request_id" CHECK ("request_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_actor_member_id" CHECK ("actor_member_id" > 0);
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_system_actor_id" CHECK ("system_actor_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_evidence_ref" CHECK ("evidence_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_aggregate_id" CHECK ("aggregate_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_source_id" CHECK ("source_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_version_id" CHECK ("version_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_assignment_id" CHECK ("assignment_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_previous_assignment_id" CHECK ("previous_assignment_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_approval_id" CHECK ("approval_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_previous_approval_id" CHECK ("previous_approval_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_logical_rights_id" CHECK ("logical_rights_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_rights_terms_revision" CHECK ("rights_terms_revision" BETWEEN 1 AND 9007199254740991);
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_previous_revision" CHECK ("previous_revision" BETWEEN 0 AND 9007199254740991);
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_new_revision" CHECK ("new_revision" BETWEEN 0 AND 9007199254740991);
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_occurred_at" CHECK (isfinite("occurred_at") AND "occurred_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "occurred_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_receipt_ref" CHECK ("receipt_ref" ~ '^[a-f0-9]{64}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_review_manifest_digest" CHECK ("review_manifest_digest" ~ '^[a-f0-9]{64}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_expiry_reference_id" CHECK ("expiry_reference_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_expiry_deadline" CHECK (isfinite("expiry_deadline") AND "expiry_deadline">=timestamptz '0001-01-01 00:00:00+00 BC' AND "expiry_deadline"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_body_hash" CHECK ("body_hash" ~ '^[a-f0-9]{64}$');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_recorded_at" CHECK (isfinite("recorded_at") AND "recorded_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "recorded_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_event_id" CHECK ("event_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_aggregate_id" CHECK ("aggregate_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_aggregate_revision" CHECK ("aggregate_revision" BETWEEN 0 AND 9007199254740991);
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_available_at" CHECK (isfinite("available_at") AND "available_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "available_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_lease_token" CHECK ("lease_token" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_lease_expires_at" CHECK (isfinite("lease_expires_at") AND "lease_expires_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "lease_expires_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_delivered_at" CHECK (isfinite("delivered_at") AND "delivered_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "delivered_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_dead_lettered_at" CHECK (isfinite("dead_lettered_at") AND "dead_lettered_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "dead_lettered_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_consumer_receipts" ADD CONSTRAINT "ck_consumer_receipts_consumer_id" CHECK ("consumer_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_consumer_receipts" ADD CONSTRAINT "ck_consumer_receipts_event_id" CHECK ("event_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_consumer_receipts" ADD CONSTRAINT "ck_consumer_receipts_scope_id" CHECK ("scope_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$');
ALTER TABLE "knowledge_consumer_receipts" ADD CONSTRAINT "ck_consumer_receipts_body_hash" CHECK ("body_hash" ~ '^[a-f0-9]{64}$');
ALTER TABLE "knowledge_consumer_receipts" ADD CONSTRAINT "ck_consumer_receipts_processed_at" CHECK (isfinite("processed_at") AND "processed_at">=timestamptz '0001-01-01 00:00:00+00 BC' AND "processed_at"<timestamptz '10000-01-01 00:00:00+00');
ALTER TABLE "knowledge_scopes" ADD CONSTRAINT "ck_scopes_shape" CHECK ((scope_kind='GLOBAL' AND scope_id='global' AND organization_id IS NULL) OR (scope_kind='TENANT' AND organization_id IS NOT NULL AND scope_id='tenant:'||organization_id::text));
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_parent_not_self" CHECK (parent_grant_id IS NULL OR parent_grant_id<>grant_id);
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_issuance" CHECK ((issuance_kind='DELEGATED' AND parent_grant_id IS NOT NULL AND parent_grant_revision IS NOT NULL AND issuance_request_id IS NOT NULL AND issuance_reference IS NULL) OR (issuance_kind IN ('OWNER_BOOTSTRAP','SYNTHETIC_SEED') AND issuance_reference IS NOT NULL AND parent_grant_id IS NULL AND parent_grant_revision IS NULL AND issuance_request_id IS NULL));
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_duties" CHECK (subject_member_id<>granted_by_member_id AND subject_member_id<>verified_by_member_id);
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_window" CHECK (created_at<=verified_at AND verified_at<=effective_from AND effective_from<expires_at);
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_duties" CHECK (subject_member_id<>verified_by_member_id);
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_window" CHECK (effective_from<expires_at AND verified_at<expires_at AND effective_from<review_due_at AND review_due_at<=expires_at);
ALTER TABLE "knowledge_source_revisions" ADD CONSTRAINT "ck_source_revisions_domain" CHECK ("domain" IN ('STATUTE','REGULATION','STATE_LAW','MEDICARE_NATIONAL','MAC_COVERAGE','CMS_MANUAL','CMS_PAYMENT','OFFICIAL_CODING','DRUG_TERMINOLOGY','DRUG_LABEL','PHARMACOLOGY','CLINICAL_EVIDENCE','CLINICAL_PROTOCOL','SPARTAN_WORKFLOW','QUALITY_REPORTING','COMPLIANCE'));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_state" CHECK ("state" IN ('DETECTED','FETCHED','QUARANTINED','PARSED','DIFFED','VALIDATED','REVIEW_PENDING','APPROVED','ACTIVE','SUPERSEDED','REVOKED'));
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "ck_health_observations_state" CHECK ("state" IN ('NOT_CHECKED','CURRENT','STALE_ALLOWED_WITH_WARNING','STALE_BLOCKED','UPSTREAM_UNAVAILABLE','REVOKED'));
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_qualification_class" CHECK ("qualification_class" IN ('HOSPICE_PHYSICIAN','CLINICAL_LEADER','PHARMACIST','CODER','COMPLIANCE_REVIEWER','WORKFLOW_REVIEWER'));
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_verification_method" CHECK ("verification_method" IN ('OWNER_ATTESTATION','CREDENTIAL_CHECK','SYNTHETIC_TEST'));
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_status" CHECK ("status" IN ('PENDING','DENIED','APPROVED'));
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_operation" CHECK ("operation" IN ('REGISTER','RECORD_STAGE','SUBMIT','APPROVE','REAPPROVE','REJECT_REVIEW','ACTIVATE','SUPERSEDE','ROLLBACK','REFRESH_APPROVAL','REVOKE','RECORD_HEALTH','APPROVE_LKG','REVOKE_RIGHTS','REVOKE_GRANT','REVOKE_QUALIFICATION','EVALUATE_EXPIRY'));
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_reason_code" CHECK ("reason_code" IN ('REGISTERED','VALIDATION_RECORDED','SUBMITTED','REVIEW_APPROVED','REVIEW_REJECTED','PUBLISHED','SUPERSEDED','ROLLBACK_APPROVED','SECURITY_REVOCATION','RIGHTS_REVOKED','RIGHTS_EXPIRED','HEALTH_BLOCKED','HEALTH_EXPIRED','GRANT_REVOKED','QUALIFICATION_REVOKED','GRANT_EXPIRED','QUALIFICATION_EXPIRED','APPROVAL_EXPIRED'));
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_aggregate_kind" CHECK ("aggregate_kind" IN ('VERSION','RIGHTS_REVISION','GRANT','QUALIFICATION','PUBLICATION'));
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_aggregate_kind" CHECK ("aggregate_kind" IN ('VERSION','RIGHTS_REVISION','GRANT','QUALIFICATION','PUBLICATION'));
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_invalidation" CHECK ("invalidation" IN ('NONE','PUBLICATION','ELIGIBILITY'));
ALTER TABLE "knowledge_command_receipts" ADD CONSTRAINT "ck_command_receipts_operation" CHECK ("operation" IN ('REGISTER','SUBMIT','APPROVE','REAPPROVE','REJECT_REVIEW','ACTIVATE','SUPERSEDE','ROLLBACK','REFRESH_APPROVAL','REVOKE','RECORD_HEALTH','APPROVE_LKG','REVOKE_RIGHTS','REVOKE_GRANT','REVOKE_QUALIFICATION'));
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_expiry_kind" CHECK ("expiry_kind" IN ('RIGHTS_END','GRANT_END','QUALIFICATION_END','QUALIFICATION_REVIEW_DUE','APPROVAL_REVIEW_DUE','HEALTH_WARNING','HEALTH_HARD_END','LKG_END'));
ALTER TABLE "knowledge_scopes" ADD CONSTRAINT "ck_scopes_supported_payers_values" CHECK ("supported_payers" <@ ARRAY['TRADITIONAL_MEDICARE','MEDICAID','COMMERCIAL','OTHER']::text[]);
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_payers_values" CHECK ("payers" <@ ARRAY['TRADITIONAL_MEDICARE','MEDICAID','COMMERCIAL','OTHER']::text[]);
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_payers_values" CHECK ("payers" <@ ARRAY['TRADITIONAL_MEDICARE','MEDICAID','COMMERCIAL','OTHER']::text[]);
ALTER TABLE "knowledge_source_revisions" ADD CONSTRAINT "ck_source_revisions_claim_types_values" CHECK ("claim_types" <@ ARRAY['LEGAL_REQUIREMENT','MEDICARE_COVERAGE_REQUIREMENT','MEDICARE_PAYMENT_RULE','MEDICARE_CLAIMS_RULE','CODING_RULE','CODE_DEFINITION','DRUG_IDENTITY','DRUG_LABEL_FACT','DRUG_INTERACTION_FACT','CLINICAL_RESEARCH_EVIDENCE','CLINICAL_PROTOCOL_GUIDANCE','PATIENT_SOURCE_FACT','DERIVED_PATIENT_FACT','CLINICAL_INFERENCE','WORKFLOW_GUIDANCE','QUALITY_REPORTING_RULE','COMPLIANCE_GUIDANCE']::text[]);
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_domains_values" CHECK ("domains" <@ ARRAY['STATUTE','REGULATION','STATE_LAW','MEDICARE_NATIONAL','MAC_COVERAGE','CMS_MANUAL','CMS_PAYMENT','OFFICIAL_CODING','DRUG_TERMINOLOGY','DRUG_LABEL','PHARMACOLOGY','CLINICAL_EVIDENCE','CLINICAL_PROTOCOL','PATIENT_EVIDENCE','DETERMINISTIC_DERIVATION','MODEL_INFERENCE','SPARTAN_WORKFLOW','QUALITY_REPORTING','COMPLIANCE']::text[]);
ALTER TABLE "knowledge_qualifications" ADD CONSTRAINT "ck_qualifications_domains_values" CHECK ("domains" <@ ARRAY['STATUTE','REGULATION','STATE_LAW','MEDICARE_NATIONAL','MAC_COVERAGE','CMS_MANUAL','CMS_PAYMENT','OFFICIAL_CODING','DRUG_TERMINOLOGY','DRUG_LABEL','PHARMACOLOGY','CLINICAL_EVIDENCE','CLINICAL_PROTOCOL','PATIENT_EVIDENCE','DETERMINISTIC_DERIVATION','MODEL_INFERENCE','SPARTAN_WORKFLOW','QUALITY_REPORTING','COMPLIANCE']::text[]);
ALTER TABLE "knowledge_grants" ADD CONSTRAINT "ck_grants_capabilities_values" CHECK ("capabilities" <@ ARRAY['knowledge.read','knowledge.register','knowledge.submit','knowledge.review','knowledge.activate','knowledge.revoke','knowledge.rollback','knowledge.license','knowledge.health','knowledge.grants']::text[]);
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_permitted_uses_values" CHECK ("permitted_uses" <@ ARRAY['INTERNAL_STORAGE','MODEL_INPUT','PROMPT_USE','CUSTOMER_DISPLAY','DERIVED_OUTPUT','REDISTRIBUTION']::text[]);
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_enabled_uses_values" CHECK ("enabled_uses" <@ ARRAY['INTERNAL_STORAGE','MODEL_INPUT','PROMPT_USE','CUSTOMER_DISPLAY','DERIVED_OUTPUT','REDISTRIBUTION']::text[]);
ALTER TABLE "knowledge_source_revisions" ADD CONSTRAINT "ck_source_revisions_publisher_length" CHECK (length(publisher) BETWEEN 1 AND 200);
ALTER TABLE "knowledge_source_revisions" ADD CONSTRAINT "ck_source_revisions_title_length" CHECK (length(title) BETWEEN 1 AND 300);
ALTER TABLE "knowledge_source_revisions" ADD CONSTRAINT "ck_source_revisions_official_url_https" CHECK (length(official_url)<=2000 AND official_url ~ '^https://[^/@]+(/|$)' AND official_url !~ '^https://[^/]*@');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_source_url_https" CHECK (length(source_url)<=2000 AND source_url ~ '^https://[^/@]+(/|$)' AND source_url !~ '^https://[^/]*@');
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_chronology" CHECK (published_at<=retrieved_at AND (effective_to IS NULL OR effective_from<effective_to));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_activation" CHECK (state<>'ACTIVE' OR activated_at IS NOT NULL);
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_revocation" CHECK ((state='REVOKED' AND revoked_at IS NOT NULL AND revocation_reason='SECURITY_REVOCATION') OR (state<>'REVOKED' AND revoked_at IS NULL AND revocation_reason IS NULL));
ALTER TABLE "knowledge_versions" ADD CONSTRAINT "ck_versions_health_revision" CHECK (current_health_revision<=revision);
ALTER TABLE "knowledge_rights_terms" ADD CONSTRAINT "ck_rights_terms_approved_shape" CHECK ((status='APPROVED' AND effective_from IS NOT NULL AND verified_by_member_id IS NOT NULL AND verification_grant_id IS NOT NULL AND verification_qualification_id IS NOT NULL AND verification_ref IS NOT NULL AND verified_at IS NOT NULL AND (expires_at IS NULL OR effective_from<expires_at)) OR (status<>'APPROVED' AND cardinality(permitted_uses)=0));
ALTER TABLE "knowledge_approvals" ADD CONSTRAINT "ck_approvals_window" CHECK (reviewed_at<review_due_at);
ALTER TABLE "knowledge_lkg_attestations" ADD CONSTRAINT "ck_lkg_attestations_window" CHECK (approved_at<until_at);
ALTER TABLE "knowledge_health_observations" ADD CONSTRAINT "ck_health_observations_shape" CHECK ((state='NOT_CHECKED' AND checked_at IS NULL AND last_validated_at IS NULL AND warning_at IS NULL AND hard_expires_at IS NULL AND lkg_id IS NULL) OR state='REVOKED' OR (state NOT IN ('NOT_CHECKED','REVOKED') AND checked_at IS NOT NULL AND (state<>'CURRENT' OR (last_validated_at IS NOT NULL AND warning_at IS NOT NULL AND hard_expires_at IS NOT NULL)) AND (last_validated_at IS NULL OR last_validated_at<=checked_at) AND ((warning_at IS NULL AND hard_expires_at IS NULL) OR (warning_at IS NOT NULL AND hard_expires_at IS NOT NULL AND warning_at<hard_expires_at)) AND (last_validated_at IS NULL OR warning_at IS NULL OR last_validated_at<warning_at) AND (lkg_id IS NULL OR (last_validated_at IS NOT NULL AND hard_expires_at IS NOT NULL))));
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_window" CHECK (service_to IS NULL OR service_from<service_to);
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_retirement" CHECK ((retired_at IS NULL)=(retirement_event_id IS NULL) AND (retired_at IS NULL OR retired_at>=created_at));
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_predecessor_not_self" CHECK (predecessor_assignment_id IS NULL OR predecessor_assignment_id<>assignment_id);
ALTER TABLE "knowledge_publication_assignments" ADD CONSTRAINT "ck_publication_assignments_storage" CHECK ('INTERNAL_STORAGE'=ANY(enabled_uses));
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_attempts" CHECK (attempts BETWEEN 0 AND 10);
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_lease" CHECK ((lease_token IS NULL)=(lease_expires_at IS NULL));
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_terminal" CHECK (NOT(delivered_at IS NOT NULL AND dead_lettered_at IS NOT NULL) AND ((delivered_at IS NULL AND dead_lettered_at IS NULL) OR lease_token IS NULL));
ALTER TABLE "knowledge_outbox" ADD CONSTRAINT "ck_outbox_last_error_code" CHECK ("last_error_code" IN ('DELIVERY_UNAVAILABLE','LEASE_LOST','ATTEMPTS_EXHAUSTED'));
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_actor" CHECK ((actor_kind='HUMAN' AND actor_member_id IS NOT NULL AND system_actor_id IS NULL AND evidence_ref IS NULL) OR (actor_kind='SYSTEM' AND actor_member_id IS NULL AND system_actor_id='expiry-evaluator' AND evidence_ref IS NULL) OR (actor_kind='PIPELINE' AND actor_member_id IS NULL AND system_actor_id='synthetic-pipeline' AND evidence_ref IS NOT NULL));
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_expiry" CHECK ((expiry_kind IS NULL AND expiry_reference_id IS NULL AND expiry_deadline IS NULL) OR (expiry_kind IS NOT NULL AND expiry_reference_id IS NOT NULL AND expiry_deadline IS NOT NULL));
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_schema" CHECK (schema_version='knowledge-event-v3');
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_witnesses" CHECK (knowledge_valid_witnesses(authorization_witnesses));
ALTER TABLE "knowledge_audit_events" ADD CONSTRAINT "ck_audit_events_body" CHECK (octet_length(canonical_body)<=524288 AND encode(digest(canonical_body,'sha256'),'hex')=body_hash);
CREATE INDEX "ix_audit_events_scope_fk" ON "knowledge_audit_events" ("scope_id");
CREATE INDEX "ix_outbox_scope_fk" ON "knowledge_outbox" ("scope_id");
CREATE INDEX "ix_consumer_receipts_scope_fk" ON "knowledge_consumer_receipts" ("scope_id");
CREATE INDEX "ix_scopes_organization_fk" ON "knowledge_scopes" ("organization_id");
CREATE INDEX "ix_scope_members_member_fk" ON "knowledge_scope_members" ("member_id");
CREATE INDEX "ix_versions_source_fk" ON "knowledge_versions" ("scope_id","source_id","source_metadata_revision");
CREATE INDEX "ix_versions_document_fk" ON "knowledge_versions" ("scope_id","source_id","document_id");
CREATE INDEX "ix_versions_rights_fk" ON "knowledge_versions" ("scope_id","rights_revision_id");
CREATE INDEX "ix_versions_health_fk" ON "knowledge_versions" ("scope_id","version_id","current_health_revision");
CREATE INDEX "ix_grants_parent_fk" ON "knowledge_grants" ("scope_id","parent_grant_id") WHERE parent_grant_id IS NOT NULL;
CREATE INDEX "ix_versions_registered_by_member_id_fk" ON "knowledge_versions" ("scope_id","registered_by_member_id");
CREATE INDEX "ix_versions_submitted_by_member_id_fk" ON "knowledge_versions" ("scope_id","submitted_by_member_id");
CREATE INDEX "ix_rights_terms_verified_by_member_id_fk" ON "knowledge_rights_terms" ("scope_id","verified_by_member_id");
CREATE INDEX "ix_grants_subject_member_id_fk" ON "knowledge_grants" ("scope_id","subject_member_id");
CREATE INDEX "ix_grants_granted_by_member_id_fk" ON "knowledge_grants" ("scope_id","granted_by_member_id");
CREATE INDEX "ix_grants_verified_by_member_id_fk" ON "knowledge_grants" ("scope_id","verified_by_member_id");
CREATE INDEX "ix_qualifications_subject_member_id_fk" ON "knowledge_qualifications" ("scope_id","subject_member_id");
CREATE INDEX "ix_qualifications_verified_by_member_id_fk" ON "knowledge_qualifications" ("scope_id","verified_by_member_id");
CREATE INDEX "ix_approvals_reviewer_member_id_fk" ON "knowledge_approvals" ("scope_id","reviewer_member_id");
CREATE INDEX "ix_lkg_attestations_reviewer_member_id_fk" ON "knowledge_lkg_attestations" ("scope_id","reviewer_member_id");
CREATE INDEX "ix_publication_assignments_created_by_member_id_fk" ON "knowledge_publication_assignments" ("scope_id","created_by_member_id");
CREATE INDEX "ix_audit_events_actor_member_id_fk" ON "knowledge_audit_events" ("scope_id","actor_member_id");
CREATE INDEX "ix_rights_terms_verification_grant_id_fk" ON "knowledge_rights_terms" ("scope_id","verification_grant_id");
CREATE INDEX "ix_approvals_review_grant_id_fk" ON "knowledge_approvals" ("scope_id","review_grant_id");
CREATE INDEX "ix_lkg_attestations_health_grant_id_fk" ON "knowledge_lkg_attestations" ("scope_id","health_grant_id");
CREATE INDEX "ix_lkg_attestations_review_grant_id_fk" ON "knowledge_lkg_attestations" ("scope_id","review_grant_id");
CREATE INDEX "ix_rights_terms_verification_qualification_id_fk" ON "knowledge_rights_terms" ("scope_id","verification_qualification_id");
CREATE INDEX "ix_approvals_qualification_id_fk" ON "knowledge_approvals" ("scope_id","qualification_id");
CREATE INDEX "ix_lkg_attestations_qualification_id_fk" ON "knowledge_lkg_attestations" ("scope_id","qualification_id");
CREATE INDEX "ix_lkg_attestations_supporting_approval_fk" ON "knowledge_lkg_attestations" ("scope_id","version_id","supporting_approval_id","review_manifest_digest");
CREATE INDEX "ix_health_observations_lkg_fk" ON "knowledge_health_observations" ("scope_id","version_id","lkg_id");
CREATE INDEX "ix_publication_assignments_version_fk" ON "knowledge_publication_assignments" ("scope_id","version_id","source_id","document_id");
CREATE INDEX "ix_publication_assignments_approval_fk" ON "knowledge_publication_assignments" ("scope_id","version_id","approval_id","review_manifest_digest");
CREATE INDEX "ix_publication_assignments_predecessor_fk" ON "knowledge_publication_assignments" ("scope_id","predecessor_assignment_id") WHERE predecessor_assignment_id IS NOT NULL;
CREATE INDEX "ix_approvals_event_fk" ON "knowledge_approvals" ("scope_id","event_id");
CREATE INDEX "ix_lkg_attestations_event_fk" ON "knowledge_lkg_attestations" ("scope_id","event_id");
CREATE INDEX "ix_health_observations_event_fk" ON "knowledge_health_observations" ("scope_id","event_id");
CREATE INDEX "ix_publication_assignments_event_fk" ON "knowledge_publication_assignments" ("scope_id","event_id");
CREATE INDEX "ix_command_receipts_event_fk" ON "knowledge_command_receipts" ("scope_id","event_id");
CREATE INDEX "ix_publication_assignments_retirement_event_fk" ON "knowledge_publication_assignments" ("scope_id","retirement_event_id");
CREATE INDEX "ix_audit_events_receipt_fk" ON "knowledge_audit_events" ("scope_id","receipt_ref");
CREATE INDEX "ix_audit_events_source_fk" ON "knowledge_audit_events" ("scope_id","source_id");
CREATE INDEX "ix_audit_events_version_fk" ON "knowledge_audit_events" ("scope_id","version_id");
CREATE INDEX "ix_audit_events_assignment_fk" ON "knowledge_audit_events" ("scope_id","assignment_id");
CREATE INDEX "ix_audit_events_previous_assignment_fk" ON "knowledge_audit_events" ("scope_id","previous_assignment_id");
CREATE INDEX "ix_audit_events_approval_fk" ON "knowledge_audit_events" ("scope_id","version_id","approval_id");
CREATE INDEX "ix_audit_events_rights_fk" ON "knowledge_audit_events" ("scope_id","logical_rights_id","rights_terms_revision");
CREATE INDEX "ix_outbox_event_fk" ON "knowledge_outbox" ("scope_id","event_id");
CREATE INDEX "ix_consumer_receipts_event_fk" ON "knowledge_consumer_receipts" ("scope_id","event_id");
CREATE INDEX "ix_scope_members_member" ON "knowledge_scope_members" ("member_id","scope_id");
CREATE INDEX "ix_source_revisions_domain" ON "knowledge_source_revisions" ("scope_id","domain","source_id","metadata_revision");
CREATE INDEX "ix_versions_document" ON "knowledge_versions" ("scope_id","source_id","document_id","version_id");
CREATE INDEX "ix_versions_rights" ON "knowledge_versions" ("scope_id","rights_revision_id","version_id");
CREATE INDEX "ix_versions_state" ON "knowledge_versions" ("scope_id","state","version_id");
CREATE INDEX "ix_grants_subject" ON "knowledge_grants" ("scope_id","subject_member_id","grant_id");
CREATE INDEX "ix_grants_unrevoked_expiry" ON "knowledge_grants" ("scope_id","expires_at","grant_id") WHERE revoked_at IS NULL;
CREATE INDEX "ix_qualifications_subject" ON "knowledge_qualifications" ("scope_id","subject_member_id","qualification_id");
CREATE INDEX "ix_qualifications_unrevoked_expiry" ON "knowledge_qualifications" ("scope_id","expires_at","qualification_id") WHERE revoked_at IS NULL;
CREATE INDEX "ix_qualifications_unrevoked_review" ON "knowledge_qualifications" ("scope_id","review_due_at","qualification_id") WHERE revoked_at IS NULL;
CREATE INDEX "ix_approvals_review_due" ON "knowledge_approvals" ("scope_id","review_due_at","version_id","approval_id");
CREATE INDEX "ix_publication_assignments_active_document" ON "knowledge_publication_assignments" ("scope_id","source_id","document_id","service_from","assignment_id") WHERE retired_at IS NULL;
CREATE INDEX "ix_publication_assignments_version" ON "knowledge_publication_assignments" ("scope_id","version_id","assignment_id");
CREATE INDEX "ix_audit_events_scope_time" ON "knowledge_audit_events" ("scope_id","occurred_at","event_id");
CREATE INDEX "ix_audit_events_aggregate" ON "knowledge_audit_events" ("scope_id","aggregate_kind","aggregate_id","new_revision","event_id");
CREATE INDEX "ix_outbox_pending" ON "knowledge_outbox" ("available_at","event_id") WHERE delivered_at IS NULL AND dead_lettered_at IS NULL;
CREATE INDEX "ix_outbox_leased" ON "knowledge_outbox" ("lease_expires_at","event_id") WHERE lease_token IS NOT NULL AND delivered_at IS NULL AND dead_lettered_at IS NULL;
CREATE INDEX "ix_consumer_receipts_scope" ON "knowledge_consumer_receipts" ("consumer_id","scope_id","processed_at","event_id");

ALTER TABLE knowledge_source_revisions ADD CONSTRAINT ck_source_revisions_claim_domain CHECK (claim_types <@ CASE domain WHEN 'STATUTE' THEN ARRAY['LEGAL_REQUIREMENT']::text[] WHEN 'REGULATION' THEN ARRAY['LEGAL_REQUIREMENT','MEDICARE_COVERAGE_REQUIREMENT','MEDICARE_PAYMENT_RULE','MEDICARE_CLAIMS_RULE','QUALITY_REPORTING_RULE','COMPLIANCE_GUIDANCE']::text[] WHEN 'STATE_LAW' THEN ARRAY['LEGAL_REQUIREMENT']::text[] WHEN 'MEDICARE_NATIONAL' THEN ARRAY['MEDICARE_COVERAGE_REQUIREMENT']::text[] WHEN 'MAC_COVERAGE' THEN ARRAY['MEDICARE_COVERAGE_REQUIREMENT']::text[] WHEN 'CMS_MANUAL' THEN ARRAY['MEDICARE_COVERAGE_REQUIREMENT','MEDICARE_PAYMENT_RULE','MEDICARE_CLAIMS_RULE']::text[] WHEN 'CMS_PAYMENT' THEN ARRAY['MEDICARE_PAYMENT_RULE']::text[] WHEN 'OFFICIAL_CODING' THEN ARRAY['MEDICARE_CLAIMS_RULE','CODING_RULE','CODE_DEFINITION']::text[] WHEN 'DRUG_TERMINOLOGY' THEN ARRAY['DRUG_IDENTITY']::text[] WHEN 'DRUG_LABEL' THEN ARRAY['DRUG_LABEL_FACT']::text[] WHEN 'PHARMACOLOGY' THEN ARRAY['DRUG_INTERACTION_FACT']::text[] WHEN 'CLINICAL_EVIDENCE' THEN ARRAY['CLINICAL_RESEARCH_EVIDENCE']::text[] WHEN 'CLINICAL_PROTOCOL' THEN ARRAY['CLINICAL_PROTOCOL_GUIDANCE']::text[] WHEN 'SPARTAN_WORKFLOW' THEN ARRAY['WORKFLOW_GUIDANCE']::text[] WHEN 'QUALITY_REPORTING' THEN ARRAY['QUALITY_REPORTING_RULE']::text[] WHEN 'COMPLIANCE' THEN ARRAY['COMPLIANCE_GUIDANCE']::text[] ELSE ARRAY[]::text[] END);

CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_scopes FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_scope_members FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_sources FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_source_revisions FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_documents FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_rights_terms FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_rights_state FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_versions FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_grants FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_qualifications FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_approvals FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_lkg_attestations FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_health_observations FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_publication_assignments FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_command_receipts FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_audit_events FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_outbox FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE TRIGGER knowledge_history_guard BEFORE UPDATE OR DELETE ON knowledge_consumer_receipts FOR EACH ROW EXECUTE FUNCTION knowledge_history_guard();
CREATE CONSTRAINT TRIGGER knowledge_audit_consistency AFTER INSERT ON knowledge_audit_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION knowledge_audit_consistency();
CREATE TRIGGER knowledge_outbox_consistency BEFORE INSERT ON knowledge_outbox FOR EACH ROW EXECUTE FUNCTION knowledge_outbox_consistency();
CREATE CONSTRAINT TRIGGER knowledge_health_consistency AFTER INSERT ON knowledge_health_observations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION knowledge_health_consistency();
REVOKE ALL ON TABLE knowledge_scopes FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_scope_members FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_sources FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_source_revisions FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_documents FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_rights_terms FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_rights_state FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_versions FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_grants FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_qualifications FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_approvals FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_lkg_attestations FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_health_observations FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_publication_assignments FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_command_receipts FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_audit_events FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_outbox FROM PUBLIC;
REVOKE ALL ON TABLE knowledge_consumer_receipts FROM PUBLIC;
