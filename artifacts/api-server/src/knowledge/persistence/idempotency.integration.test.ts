import { it, expect } from "vitest";
import { databaseSuite, databaseFixture } from "./testing.test";
import { executeCommand } from "./commands";
import type { Pool, PoolClient } from "pg";
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
  it("lost PostgreSQL COMMIT response yields unknown and same-payload retry replays the durable receipt", async () => {
    const f = db.second,
      v = f.state.versions[0],
      token = f.tokens.get(f.subjects[0])!,
      wire = {
        operation: "REVOKE",
        versionId: v.id,
        expectedScopeRevision: f.state.revision,
        expectedVersionRevisions: { [v.id]: v.revision },
      };
    const lost = new Proxy(db.pool, {
      get(target, key) {
        if (key !== "connect") {
          const value = Reflect.get(target, key);
          return typeof value === "function" ? value.bind(target) : value;
        }
        return async () => {
          const c = await target.connect();
          return new Proxy(c, {
            get(client, key) {
              if (key === "query")
                return async (...args: unknown[]) => {
                  const result = await (
                    client.query as (...a: unknown[]) => Promise<unknown>
                  ).apply(client, args);
                  const sql =
                    typeof args[0] === "string"
                      ? args[0]
                      : (args[0] as { text: string }).text;
                  if (sql === "COMMIT")
                    throw new Error("synthetic transport response lost");
                  return result;
                };
              const value = Reflect.get(client, key);
              return typeof value === "function" ? value.bind(client) : value;
            },
          }) as PoolClient;
        };
      },
    }) as Pool;
    await expect(
      executeCommand(lost, token, "tenant", wire, "synthetic-unknown-commit", {
        synthetic: true,
      }),
    ).rejects.toThrow("COMMAND_OUTCOME_UNKNOWN");
    const replay = await executeCommand(
      db.pool,
      token,
      "tenant",
      wire,
      "synthetic-unknown-commit",
      { synthetic: true },
    );
    expect(replay.eventIds).toHaveLength(1);
    expect(
      Number(
        (
          await db.owner.query(
            "SELECT count(*) AS n FROM knowledge_command_receipts r JOIN knowledge_audit_events a ON a.event_id=r.event_id JOIN knowledge_outbox o ON o.event_id=a.event_id WHERE r.scope_id=$1",
            [f.scopeId],
          )
        ).rows[0].n,
      ),
    ).toBe(1);
  });
});
