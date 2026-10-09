import { it, expect } from "vitest";
import { databaseSuite, databaseFixture } from "./testing.test";
import { acquire, CommandDeadline } from "./deadline";
import { timestamp, date, sqlTimestamp, sqlDate } from "./codec";
databaseSuite(
  "K1B PostgreSQL schema, scope FKs and append-only privileges",
  () => {
    const db = databaseFixture();
    it("creates all 18 tables and retains each approved entity", async () => {
      const rows = (
        await db.owner.query(
          "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'knowledge_%'",
        )
      ).rows;
      expect(rows).toHaveLength(18);
      for (const table of [
        "knowledge_sources",
        "knowledge_source_revisions",
        "knowledge_versions",
        "knowledge_rights_terms",
        "knowledge_rights_state",
        "knowledge_grants",
        "knowledge_qualifications",
        "knowledge_approvals",
        "knowledge_lkg_attestations",
        "knowledge_health_observations",
        "knowledge_publication_assignments",
        "knowledge_audit_events",
        "knowledge_outbox",
      ]) {
        expect(
          Number(
            (await db.owner.query(`SELECT count(*) AS n FROM ${table}`)).rows[0]
              .n,
          ),
        ).toBeGreaterThan(0);
      }
    });
    it("rejects impossible scope, unsorted sets, unsafe revisions and malformed witness", async () => {
      for (const sql of [
        "INSERT INTO knowledge_scopes VALUES('global-other','GLOBAL',NULL,0,ARRAY['TRADITIONAL_MEDICARE'],ARRAY['US-FL'],now())",
        "UPDATE knowledge_scopes SET revision=9007199254740992 WHERE scope_id='global'",
        "UPDATE knowledge_scopes SET supported_jurisdictions=ARRAY['US-FL','US-FL'] WHERE scope_id='global'",
        "UPDATE knowledge_audit_events SET authorization_witnesses='[{\"unexpected\":true}]'::jsonb",
      ]) {
        await expect(db.owner.query(sql)).rejects.toMatchObject({
          code: "23514",
        });
      }
    });
    it("fails same-scope rights FK and immutable artifact edits", async () => {
      await expect(
        db.owner.query(
          "UPDATE knowledge_versions SET rights_revision_id=$1 WHERE scope_id=$2 AND version_id=$3",
          [db.second.rightsId, db.fixture.scopeId, db.fixture.versionId],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      const client = await db.owner.connect();
      try {
        await client.query("BEGIN");
        await expect(
          client.query(
            "INSERT INTO knowledge_rights_state(scope_id,rights_revision_id,revision) VALUES($1,$2,1)",
            [db.fixture.scopeId, db.second.rightsId],
          ),
        ).rejects.toMatchObject({ code: "23503" });
        await client.query("ROLLBACK");
      } finally {
        client.release();
      }
    });
    it("metadata revisions cannot bypass the database artifact identity uniqueness", async () => {
      await db.owner.query(
        "INSERT INTO knowledge_source_revisions SELECT (jsonb_populate_record(NULL::knowledge_source_revisions,to_jsonb(s)||jsonb_build_object('metadata_revision',2,'title','Synthetic alternate metadata'))).* FROM knowledge_source_revisions s WHERE scope_id=$1 AND source_id=$2 AND metadata_revision=1",
        [db.fixture.scopeId, db.fixture.state.sources[0].id],
      );
      await expect(
        db.owner.query(
          "INSERT INTO knowledge_versions SELECT (jsonb_populate_record(NULL::knowledge_versions,to_jsonb(v)||jsonb_build_object('version_id','synthetic-duplicate-artifact','source_metadata_revision',2))).* FROM knowledge_versions v WHERE scope_id=$1 AND version_id=$2",
          [db.fixture.scopeId, db.fixture.versionId],
        ),
      ).rejects.toMatchObject({
        code: "23505",
        constraint: "uq_versions_artifact",
      });
      expect(
        Number(
          (
            await db.owner.query(
              "SELECT count(*) AS n FROM knowledge_versions WHERE scope_id=$1",
              [db.fixture.scopeId],
            )
          ).rows[0].n,
        ),
      ).toBe(1);
    });
    it("rights and publication rows cannot start with inconsistent first-transition revisions", async () => {
      for (const [revision, revokedAt] of [
        [0, null],
        [1, "2026-10-09T00:00:00Z"],
        [2, null],
        [3, "2026-10-09T00:00:00Z"],
      ])
        await expect(
          db.owner.query(
            "INSERT INTO knowledge_rights_state SELECT (jsonb_populate_record(NULL::knowledge_rights_state,to_jsonb(r)||jsonb_build_object('revision',$2::bigint,'revoked_at',$3::timestamptz))).* FROM knowledge_rights_state r WHERE scope_id=$1",
            [db.fixture.scopeId, revision, revokedAt],
          ),
        ).rejects.toMatchObject({
          code: "23514",
          constraint: "ck_rights_state_revision_status",
        });
      for (const [revision, retiredAt, eventId] of [
        [1, "2026-10-09T00:00:00Z", "synthetic-invalid-retirement"],
        [2, null, null],
        [3, null, null],
        [3, "2026-10-09T00:00:00Z", "synthetic-invalid-retirement"],
      ])
        await expect(
          db.owner.query(
            "INSERT INTO knowledge_publication_assignments SELECT (jsonb_populate_record(NULL::knowledge_publication_assignments,to_jsonb(p)||jsonb_build_object('revision',$2::bigint,'retired_at',$3::timestamptz,'retirement_event_id',$4::text))).* FROM knowledge_publication_assignments p WHERE scope_id=$1",
            [db.fixture.scopeId, revision, retiredAt, eventId],
          ),
        ).rejects.toMatchObject({
          code: "23514",
          constraint: "ck_publication_assignments_revision_status",
        });
    });
    it("non-owner cannot delete history, mutate audit or assume ownership", async () => {
      await expect(
        db.pool.query("DELETE FROM knowledge_audit_events"),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        db.pool.query(
          "UPDATE knowledge_audit_events SET reason_code='REGISTERED'",
        ),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        db.pool.query("UPDATE knowledge_versions SET raw_hash=$1", [
          "c".repeat(64),
        ]),
      ).rejects.toMatchObject({ code: "42501" });
      const role = (await db.pool.query("SELECT current_user AS role")).rows[0]
        .role;
      expect(role).toBe(db.role);
    });
    it("closed witness SQL guard rejects malformed values, duplicates and unsafe capabilities", async () => {
      const witnesses = (
        await db.owner.query(
          "SELECT authorization_witnesses FROM knowledge_audit_events WHERE actor_kind='HUMAN' AND jsonb_array_length(authorization_witnesses)>0 LIMIT 1",
        )
      ).rows[0].authorization_witnesses;
      for (const change of [
        { actorMemberId: 1.5 },
        { grantRevision: 0.5 },
        { scopeId: null },
        { domain: "INVALID" },
        { capability: "administrator" },
        { qualificationId: "bad space", qualificationRevision: 1 },
        {
          attestationId: "synthetic",
          attestedAt: "2026-99-99T00:00:00.000Z",
          witnessType: "REVIEW_ATTESTATION",
          capability: "knowledge.review",
          qualificationId: "synthetic",
          qualificationRevision: 1,
        },
      ]) {
        expect(
          (
            await db.owner.query(
              "SELECT knowledge_valid_witnesses($1::jsonb) AS valid",
              [JSON.stringify([{ ...witnesses[0], ...change }])],
            )
          ).rows[0].valid,
        ).toBe(false);
      }
      expect(
        (
          await db.owner.query(
            "SELECT knowledge_valid_witnesses($1::jsonb) AS valid",
            [JSON.stringify([witnesses[0], witnesses[0]])],
          )
        ).rows[0].valid,
      ).toBe(false);
      expect(
        (
          await db.owner.query(
            "SELECT knowledge_valid_witnesses($1::jsonb) AS valid",
            [JSON.stringify(witnesses)],
          )
        ).rows[0].valid,
      ).toBe(true);
    });
    it("PostgreSQL codecs preserve UTC year zero, early years and date-only values", async () => {
      const c = await acquire(db.pool, new CommandDeadline());
      try {
        for (const year of ["0000", "0001", "0099", "9999"]) {
          const value = `${year}-01-02T03:04:05.006Z`,
            day = `${year}-01-02`;
          const row = (
            await c.raw(
              "SELECT $1::timestamptz AS stamp,$2::date AS day,knowledge_iso($1::timestamptz) AS canonical",
              [sqlTimestamp(value), sqlDate(day)],
            )
          ).rows[0];
          expect(timestamp(row.stamp)).toBe(value);
          expect(date(row.day)).toBe(day);
          expect(row.canonical).toBe(value);
        }
      } finally {
        await c.close();
      }
    });
    it("witness helpers remain valid under pg_restore's empty search path", async () => {
      const witnesses = (
        await db.owner.query(
          "SELECT authorization_witnesses FROM knowledge_audit_events WHERE operation='ACTIVATE' LIMIT 1",
        )
      ).rows[0].authorization_witnesses;
      const c = await db.owner.connect();
      try {
        await c.query("BEGIN");
        await c.query("SET LOCAL search_path=''");
        expect(
          (
            await c.query(
              "SELECT public.knowledge_valid_witnesses($1::jsonb) AS valid",
              [JSON.stringify(witnesses)],
            )
          ).rows[0].valid,
        ).toBe(true);
      } finally {
        await c.query("ROLLBACK");
        c.release();
      }
    });
  },
);
