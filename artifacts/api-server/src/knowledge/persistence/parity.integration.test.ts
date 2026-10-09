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
});
