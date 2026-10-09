import { it, expect } from "vitest";
import { databaseSuite, databaseFixture } from "./testing.test";
import { acquire, CommandDeadline } from "./deadline";
import { preliminaryAuth } from "../control/auth";
import { projectCommand } from "./projection";
import { canonicalDigest } from "../foundation/canonical";
import { transitionKnowledge } from "../foundation/lifecycle";
import { resolvePersistedKnowledge } from "./resolution";
import { createKnowledgeRegistry } from "../foundation/resolver";
databaseSuite("K1B SQL projection and K1A parity", () => {
  const db = databaseFixture();
  it("round-trips source, artifact, rights, credentials, review, health/LKG and publication", async () => {
    const c = await acquire(db.pool, new CommandDeadline());
    try {
      const identity = await preliminaryAuth(
        c,
        db.fixture.tokens.get(db.fixture.subjects[0])!,
      );
      await c.begin();
      const p = await projectCommand(
        c,
        identity,
        db.fixture.scopeId,
        {
          operation: "RECORD_HEALTH",
          versionId: db.fixture.versionId,
          expectedScopeRevision: db.fixture.state.revision,
          expectedVersionRevisions: {
            [db.fixture.versionId]: db.fixture.state.versions[0].revision,
          },
          health: db.fixture.state.versions[0].health,
        },
        true,
      );
      // Approval history is an ID-addressed set. SQL deliberately materializes
      // it in ordinal ID order; K1A appends newly issued approvals. Compare every
      // field in the same order, without dropping unused historical approvals.
      const fullState = structuredClone(db.fixture.state);
      for (const version of fullState.versions)
        version.approvals.sort((a, b) =>
          a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
        );
      expect(p.state.versions).toEqual(fullState.versions);
      expect(canonicalDigest(p.state.sources)).toBe(
        canonicalDigest(db.fixture.state.sources),
      );
      expect(canonicalDigest(p.state.assignments)).toBe(
        canonicalDigest(db.fixture.state.assignments),
      );
      const command = {
          operation: "REVOKE" as const,
          versionId: db.fixture.versionId,
          expectedScopeRevision: p.state.revision,
          expectedVersionRevisions: {
            [db.fixture.versionId]: p.state.versions[0].revision,
          },
        },
        server = {
          kind: "HUMAN_SERVER",
          synthetic: true,
          now: p.now,
          eventId: "synthetic-parity-event",
          requestId: "synthetic-parity-request",
          receiptRef: null,
        };
      const full = transitionKnowledge(fullState, p.actor, command, server),
        projected = transitionKnowledge(p.state, p.actor, command, server);
      expect(projected.eventIntents).toEqual(full.eventIntents);
      expect(projected.state.versions).toEqual(full.state.versions);
    } finally {
      await c.close();
    }
  });
  it("internal resolver matches the canonical GLOBAL and exact TENANT decision", async () => {
    const context = {
      claimType: "MEDICARE_COVERAGE_REQUIREMENT",
      payer: "TRADITIONAL_MEDICARE",
      jurisdiction: "US-FL",
      mac: "SYNTHETIC-MAC",
      serviceDate: "2026-10-09",
      purpose: "INTERNAL_STORAGE",
    };
    const actor = {
      kind: "HUMAN",
      memberId: db.fixture.subjects[0],
      organizationId: db.fixture.organizationId,
      membershipActive: true,
      organizationActive: true,
      sessionVerified: true,
      synthetic: true,
    };
    const persisted = await resolvePersistedKnowledge(
      db.pool,
      db.fixture.tokens.get(actor.memberId)!,
      context,
      true,
    );
    const canonical = createKnowledgeRegistry({
      contractVersion: "knowledge-foundation-v3",
      partitions: [db.global.state, db.fixture.state],
    }).resolve(context, actor, new Date().toISOString());
    expect(persisted).toEqual(canonical);
  });
  const context = {
    claimType: "MEDICARE_COVERAGE_REQUIREMENT",
    payer: "TRADITIONAL_MEDICARE",
    jurisdiction: "US-FL",
    mac: "SYNTHETIC-MAC",
    serviceDate: "2026-10-09",
    purpose: "INTERNAL_STORAGE",
  };
  const compareResolution = async (subject: number) => {
    const actor = {
      kind: "HUMAN",
      memberId: subject,
      organizationId: db.fixture.organizationId,
      membershipActive: true,
      organizationActive: true,
      sessionVerified: true,
      synthetic: true,
    };
    const canonical = createKnowledgeRegistry({
      contractVersion: "knowledge-foundation-v3",
      partitions: [db.global.state, db.fixture.state],
    }).resolve(context, actor, new Date().toISOString());
    expect(
      await resolvePersistedKnowledge(
        db.pool,
        db.fixture.tokens.get(subject)!,
        context,
        true,
      ),
    ).toEqual(canonical);
    return canonical;
  };
  it.each([
    ["tenant-only", 0, ["global"]],
    ["global-only", 1, ["tenant"]],
    ["no authorized scope", 2, ["global", "tenant"]],
  ] as const)(
    "%s reader resolves the canonical authorized subset",
    async (_label, subjectIndex, denied) => {
      const subject = db.fixture.subjects[subjectIndex];
      const now = new Date().toISOString();
      for (const kind of denied) {
        const f = kind === "global" ? db.global : db.fixture;
        const grant = f.state.grants.find(
          (g) => g.subjectMemberId === subject,
        )!;
        await db.owner.query(
          "UPDATE knowledge_grants SET revision=revision+1,revoked_at=$3 WHERE scope_id=$1 AND grant_id=$2",
          [f.scopeId, grant.id, now],
        );
        grant.revision++;
        grant.revokedAt = now;
      }
      const result = await compareResolution(subject);
      expect(result.manifest.authorizedScopeIds).toEqual(
        _label === "tenant-only"
          ? [db.fixture.scopeId]
          : _label === "global-only"
            ? ["global"]
            : [],
      );
    },
  );
  it("ignores an unreadable domain and malformed sibling artifact pinned to another metadata revision", async () => {
    const f = db.fixture;
    const owner = await db.owner.connect();
    try {
      await owner.query("BEGIN");
      // SQL-valid synthetic drift deliberately violates K1A's version/health
      // consistency in a domain the reader cannot inspect. It shares the stable
      // source/document identity to catch accidental mutation-style sibling loads.
      await owner.query(
        `INSERT INTO knowledge_source_revisions
        SELECT (jsonb_populate_record(NULL::knowledge_source_revisions,to_jsonb(s)||jsonb_build_object('metadata_revision',2,'domain','CMS_MANUAL'))).* FROM knowledge_source_revisions s WHERE scope_id=$1 AND source_id=$2 AND metadata_revision=1`,
        [f.scopeId, f.state.sources[0].id],
      );
      await owner.query(
        `INSERT INTO knowledge_versions
        SELECT (jsonb_populate_record(NULL::knowledge_versions,to_jsonb(v)||jsonb_build_object('version_id','synthetic-unreadable-version','source_metadata_revision',2,'artifact_revision',2,'state','DETECTED','revision',1,'current_health_revision',1,'activated_at',NULL,'submitted_by_member_id',NULL))).* FROM knowledge_versions v WHERE scope_id=$1 AND version_id=$2`,
        [f.scopeId, f.versionId],
      );
      await owner.query(
        `INSERT INTO knowledge_health_observations
        SELECT (jsonb_populate_record(NULL::knowledge_health_observations,to_jsonb(h)||jsonb_build_object('version_id','synthetic-unreadable-version','version_revision',1,'state','REVOKED','lkg_id',NULL))).* FROM knowledge_health_observations h WHERE scope_id=$1 AND version_id=$2 AND version_revision=(SELECT current_health_revision FROM knowledge_versions WHERE scope_id=$1 AND version_id=$2)`,
        [f.scopeId, f.versionId],
      );
      await owner.query("COMMIT");
    } catch (e) {
      await owner.query("ROLLBACK");
      throw e;
    } finally {
      owner.release();
    }
    f.state.sources.push({
      ...f.state.sources[0],
      metadataRevision: 2,
      domain: "CMS_MANUAL",
    });
    f.state.versions.push({
      ...f.state.versions[0],
      id: "synthetic-unreadable-version",
      sourceMetadataRevision: 2,
      artifactRevision: 2,
      state: "DETECTED",
      revision: 1,
      activatedAt: null,
      submittedByMemberId: null,
      approvals: [],
      health: { ...f.state.versions[0].health, state: "REVOKED", lkg: null },
    });
    await compareResolution(f.subjects[3]);
  });
});
