import { it, expect } from "vitest";
import { databaseSuite, databaseFixture } from "./testing.test";
import { acquire, CommandDeadline } from "./deadline";
import { preliminaryAuth } from "../control/auth";
import { projectCommand } from "./projection";
import { canonicalDigest } from "../foundation/canonical";
import { transitionKnowledge } from "../foundation/lifecycle";
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
      expect(canonicalDigest(p.state.versions)).toBe(
        canonicalDigest(db.fixture.state.versions),
      );
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
      const full = transitionKnowledge(
          db.fixture.state,
          p.actor,
          command,
          server,
        ),
        projected = transitionKnowledge(p.state, p.actor, command, server);
      expect(projected.eventIntents).toEqual(full.eventIntents);
      expect(projected.state.versions).toEqual(full.state.versions);
    } finally {
      await c.close();
    }
  });
});
