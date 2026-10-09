import { it, expect, vi } from "vitest";
import { databaseSuite, databaseFixture } from "./testing.test";
import { acquire, CommandDeadline, CommandConnection } from "./deadline";
import { executeCommand } from "./commands";
import type { PoolClient } from "pg";
import { seedKnowledge } from "../../../../../lib/db/scripts/knowledge-synthetic";
import { evaluate } from "./evaluation";
databaseSuite(
  "K1B PostgreSQL first-lock contention and deadline cleanup",
  () => {
    const db = databaseFixture();
    it("first scope lock is inside one five-second budget and leaves no receipt", async () => {
      const blocker = await db.owner.connect();
      await blocker.query("BEGIN");
      await blocker.query(
        "SELECT scope_id FROM knowledge_scopes WHERE scope_id=$1 FOR UPDATE",
        [db.fixture.scopeId],
      );
      const start = performance.now();
      try {
        await expect(
          executeCommand(
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
            "synthetic-contended-command",
            { synthetic: true },
          ),
        ).rejects.toThrow("COMMAND_IN_PROGRESS");
        expect(performance.now() - start).toBeLessThan(6500);
      } finally {
        await blocker.query("ROLLBACK");
        blocker.release();
      }
      expect(
        (
          await db.owner.query(
            "SELECT count(*)::int AS n FROM knowledge_command_receipts WHERE scope_id=$1",
            [db.fixture.scopeId],
          )
        ).rows[0].n,
      ).toBe(0);
    }, 10000);
    it("statement deadline drains or destroys the connection; another checkout remains clean", async () => {
      const c = await acquire(db.pool, new CommandDeadline());
      try {
        await c.begin();
        await expect(c.query("SELECT pg_sleep(10)")).rejects.toBeDefined();
      } finally {
        await c.close();
      }
      expect((await db.pool.query("SELECT 1 AS ok")).rows[0].ok).toBe(1);
    }, 10000);
  },
);
it("COMMIT response loss returns unknown and destroys rather than replaying or rolling back", async () => {
  const release = vi.fn(),
    query = vi.fn(async (value: unknown) => {
      const statement =
        typeof value === "string" ? value : (value as { text: string }).text;
      if (statement === "COMMIT") throw new Error("synthetic response lost");
      return { rows: [], rowCount: 0 };
    });
  const client = { query, release } as unknown as PoolClient,
    c = new CommandConnection(client, new CommandDeadline());
  await c.begin();
  await expect(c.commit()).rejects.toThrow("COMMAND_OUTCOME_UNKNOWN");
  await c.close();
  expect(release).toHaveBeenCalledWith(true);
  expect(
    query.mock.calls
      .map(([arg]) =>
        typeof arg === "string" ? arg : (arg as { text: string }).text,
      )
      .filter((s) => s === "COMMIT"),
  ).toHaveLength(1);
  expect(query.mock.calls.some(([arg]) => arg === "ROLLBACK")).toBe(false);
});
it("confirmed COMMIT contention aborts safely instead of claiming an unknown outcome", async () => {
  const release = vi.fn(),
    query = vi.fn(async (value: unknown) => {
      const sql =
        typeof value === "string" ? value : (value as { text: string }).text;
      if (sql === "COMMIT")
        throw Object.assign(new Error("synthetic abort"), { code: "40001" });
      return { rows: [], rowCount: 0 };
    });
  const c = new CommandConnection(
    { query, release } as unknown as PoolClient,
    new CommandDeadline(),
  );
  await c.begin();
  await expect(c.commit()).rejects.toThrow("COMMAND_IN_PROGRESS");
  await c.close();
  expect(query.mock.calls.some(([v]) => v === "ROLLBACK")).toBe(true);
  expect(release).toHaveBeenCalledWith(false);
});
it("real pure workers admit two evaluations, reject queued work, terminate and release capacity", async () => {
  // SQL is deliberately not exercised here; the PostgreSQL suites provide persistence evidence.
  const f = await seedKnowledge({
    query: async () => ({ rows: [], rowCount: 1 }),
  } as unknown as PoolClient);
  const input = {
    task: "expiry",
    state: f.state,
    now: new Date().toISOString(),
  };
  const first = evaluate(input, new CommandDeadline()),
    second = evaluate(input, new CommandDeadline());
  await expect(evaluate(input, new CommandDeadline())).rejects.toThrow(
    "COMMAND_UNAVAILABLE",
  );
  expect(await first).toEqual([]);
  expect(await second).toEqual([]);
  const short = new CommandDeadline();
  Object.defineProperty(short, "expires", { value: performance.now() + 5 });
  await expect(evaluate(input, short)).rejects.toThrow("COMMAND_IN_PROGRESS");
  expect(await evaluate(input, new CommandDeadline())).toEqual([]);
});
