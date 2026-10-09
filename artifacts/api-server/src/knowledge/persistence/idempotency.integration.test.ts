import { it, expect } from "vitest";
import { databaseSuite, databaseFixture } from "./testing.test";
import { executeCommand } from "./commands";
databaseSuite("K1B durable receipt replay and duplicate races", () => {
  const db = databaseFixture();
  const command = () => ({
    operation: "REVOKE" as const,
    versionId: db.fixture.versionId,
    expectedScopeRevision: db.fixture.state.revision,
    expectedVersionRevisions: {
      [db.fixture.versionId]: db.fixture.state.versions[0].revision,
    },
  });
  it("concurrent identical requests return one committed event; response-loss retry ignores old CAS", async () => {
    const token = db.fixture.tokens.get(db.fixture.subjects[0])!;
    const responses = await Promise.all([
      executeCommand(
        db.pool,
        token,
        "tenant",
        command(),
        "synthetic-duplicate-key",
        { synthetic: true },
      ),
      executeCommand(
        db.pool,
        token,
        "tenant",
        command(),
        "synthetic-duplicate-key",
        { synthetic: true },
      ),
    ]);
    expect(responses[0]).toEqual(responses[1]);
    const replay = await executeCommand(
      db.pool,
      token,
      "tenant",
      command(),
      "synthetic-duplicate-key",
      { synthetic: true },
    );
    expect(replay).toEqual(responses[0]);
    expect(
      (
        await db.owner.query(
          "SELECT count(*)::int AS n FROM knowledge_command_receipts WHERE scope_id=$1",
          [db.fixture.scopeId],
        )
      ).rows[0].n,
    ).toBe(1);
  });
  it("same key with changed payload conflicts only after current authorization", async () => {
    const token = db.fixture.tokens.get(db.fixture.subjects[0])!;
    await expect(
      executeCommand(
        db.pool,
        token,
        "tenant",
        { ...command(), expectedScopeRevision: 999 },
        "synthetic-duplicate-key",
        { synthetic: true },
      ),
    ).rejects.toThrow("IDEMPOTENCY_CONFLICT");
    await db.owner.query(
      "UPDATE knowledge_grants SET revision=revision+1,revoked_at=clock_timestamp() WHERE scope_id=$1 AND subject_member_id=$2",
      [db.fixture.scopeId, db.fixture.subjects[0]],
    );
    await expect(
      executeCommand(
        db.pool,
        token,
        "tenant",
        command(),
        "synthetic-duplicate-key",
        { synthetic: true },
      ),
    ).rejects.toThrow("KNOWLEDGE_PERMISSION_DENIED");
  });
});
