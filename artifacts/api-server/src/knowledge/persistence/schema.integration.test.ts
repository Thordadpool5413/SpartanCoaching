import { it, expect } from "vitest";
import { databaseSuite, databaseFixture } from "./testing.test";
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
  },
);
