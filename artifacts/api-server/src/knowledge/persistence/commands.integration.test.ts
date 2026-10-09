import { it, expect } from "vitest";
import { databaseSuite, databaseFixture } from "./testing.test";
import { executeCommand } from "./commands";
databaseSuite("K1B command atomicity and revision semantics", () => {
  const db = databaseFixture();
  it("stale scope and version CAS leave audit, outbox and receipts unchanged", async () => {
    const before = (
      await db.owner.query(
        "SELECT (SELECT count(*) FROM knowledge_audit_events) AS a,(SELECT count(*) FROM knowledge_outbox) AS o,(SELECT count(*) FROM knowledge_command_receipts) AS r",
      )
    ).rows[0];
    for (const revisions of [
      { scope: 0, version: db.fixture.state.versions[0].revision },
      { scope: db.fixture.state.revision, version: 0 },
    ])
      await expect(
        executeCommand(
          db.pool,
          db.fixture.tokens.get(db.fixture.subjects[0])!,
          "tenant",
          {
            operation: "REVOKE",
            versionId: db.fixture.versionId,
            expectedScopeRevision: revisions.scope,
            expectedVersionRevisions: {
              [db.fixture.versionId]: revisions.version,
            },
          },
          "synthetic-stale-command",
          { synthetic: true },
        ),
      ).rejects.toThrow("KNOWLEDGE_REVISION_CONFLICT");
    expect(
      (
        await db.owner.query(
          "SELECT (SELECT count(*) FROM knowledge_audit_events) AS a,(SELECT count(*) FROM knowledge_outbox) AS o,(SELECT count(*) FROM knowledge_command_receipts) AS r",
        )
      ).rows[0],
    ).toEqual(before);
  });
  it("commits one mutation, scope revision, audit, outbox and bounded receipt atomically", async () => {
    const result = await executeCommand(
      db.pool,
      db.fixture.tokens.get(db.fixture.subjects[0])!,
      "tenant",
      {
        operation: "REVOKE",
        versionId: db.fixture.versionId,
        expectedScopeRevision: db.fixture.state.revision,
        expectedVersionRevisions: {
          [db.fixture.versionId]: db.fixture.state.versions[0].revision,
        },
      },
      "synthetic-revoke-command",
      { synthetic: true },
    );
    expect(result.eventIds).toHaveLength(1);
    expect(result.versionIds).toEqual([db.fixture.versionId]);
    const linked = (
      await db.owner.query(
        "SELECT r.event_id,e.event_id AS audit,o.event_id AS outbox FROM knowledge_command_receipts r JOIN knowledge_audit_events e ON e.event_id=r.event_id JOIN knowledge_outbox o ON o.event_id=e.event_id WHERE r.scope_id=$1",
        [db.fixture.scopeId],
      )
    ).rows;
    expect(linked).toHaveLength(1);
    expect(linked[0].event_id).toBe(linked[0].audit);
    expect(linked[0].audit).toBe(linked[0].outbox);
    expect(
      (
        await db.owner.query(
          "SELECT state,revision FROM knowledge_versions WHERE scope_id=$1 AND version_id=$2",
          [db.fixture.scopeId, db.fixture.versionId],
        )
      ).rows[0].state,
    ).toBe("REVOKED");
  });
});
