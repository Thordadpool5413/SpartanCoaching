import { it, expect } from "vitest";
import type { Pool, PoolClient } from "pg";
import { databaseSuite, databaseFixture } from "./testing.test";
import { seedKnowledge } from "../../../../../lib/db/scripts/knowledge-synthetic";
import { executeCommand } from "./commands";
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
async function blocked(observer: Pool, pid: number) {
  const end = performance.now() + 2500;
  while (performance.now() < end) {
    const row = (
      await observer.query("SELECT cardinality(pg_blocking_pids($1)) AS n", [
        pid,
      ])
    ).rows[0];
    if (row.n > 0) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error("SYNTHETIC_LOCK_BARRIER_NOT_REACHED");
}
function gatePool(actual: Pool) {
  const entered = deferred(),
    resume = deferred();
  let pid = 0;
  const pool = new Proxy(actual, {
    get(target, key) {
      if (key !== "connect") {
        const value = Reflect.get(target, key);
        return typeof value === "function" ? value.bind(target) : value;
      }
      return async () => {
        const client = await target.connect();
        pid = (await client.query("SELECT pg_backend_pid() AS pid")).rows[0]
          .pid;
        return new Proxy(client, {
          get(owner, prop) {
            if (prop === "query")
              return async (...args: unknown[]) => {
                const result = await (
                  owner.query as (...a: unknown[]) => Promise<unknown>
                ).apply(owner, args);
                const sql =
                  typeof args[0] === "string"
                    ? args[0]
                    : (args[0] as { text?: string }).text;
                if (
                  sql?.startsWith("SELECT * FROM knowledge_versions") &&
                  sql.includes("FOR UPDATE")
                ) {
                  entered.resolve();
                  await resume.promise;
                }
                return result;
              };
            const value = Reflect.get(owner, prop);
            return typeof value === "function" ? value.bind(owner) : value;
          },
        }) as PoolClient;
      };
    },
  }) as Pool;
  return {
    pool,
    entered,
    resume,
    get pid() {
      return pid;
    },
  };
}
databaseSuite(
  "K1B distinct PostgreSQL connections serialize authority and publication races",
  () => {
    const db = databaseFixture();
    let serial = 7100;
    for (const kind of [
      "member",
      "session",
      "grant",
      "qualification",
      "rights",
      "health",
      "publication",
    ] as const)
      for (const first of ["revocation", "command"] as const)
        it(`${kind}: ${first} obtains the relevant lock first`, async () => {
          const owner = await db.owner.connect();
          let f: Awaited<ReturnType<typeof seedKnowledge>>;
          try {
            f = await seedKnowledge(owner, ++serial);
          } finally {
            owner.release();
          }
          const v = f.state.versions[0],
            a = f.state.assignments[0],
            actorId = f.subjects[2],
            token = f.tokens.get(actorId)!;
          const command = {
            operation: "REFRESH_APPROVAL",
            versionId: v.id,
            assignmentId: a.id,
            approvalId: a.approvalId,
            expectedScopeRevision: f.state.revision,
            expectedVersionRevisions: { [v.id]: v.revision },
          };
          if (kind === "health" || kind === "publication") {
            const health = {
              operation: "RECORD_HEALTH",
              versionId: v.id,
              expectedScopeRevision: f.state.revision,
              expectedVersionRevisions: { [v.id]: v.revision },
              health: {
                state: "STALE_BLOCKED",
                checkedAt: new Date().toISOString(),
                lastValidatedAt: "2020-01-03T00:00:00.000Z",
                warningAt: "2021-01-01T00:00:00.000Z",
                hardExpiresAt: "2022-01-01T00:00:00.000Z",
                lkg: null,
              },
            };
            const mutator = kind === "health" ? health : command,
              mutatorToken =
                kind === "health" ? f.tokens.get(f.subjects[0])! : token;
            const firstCommand = first === "command" ? command : mutator,
              secondCommand = first === "command" ? mutator : command;
            const firstToken = first === "command" ? token : mutatorToken,
              secondToken = first === "command" ? mutatorToken : token;
            const gate = gatePool(db.pool),
              pending = executeCommand(
                gate.pool,
                firstToken,
                "tenant",
                firstCommand,
                "synthetic-race-first",
                { synthetic: true },
              );
            await Promise.race([
              gate.entered.promise,
              pending.then(() => {
                throw new Error("SYNTHETIC_GATE_NOT_REACHED");
              }),
            ]);
            const following = gatePool(db.pool),
              late = executeCommand(
                following.pool,
                secondToken,
                "tenant",
                secondCommand,
                "synthetic-race-second",
                { synthetic: true },
              );
            late.catch(() => {});
            const stop = performance.now() + 2500;
            while (!following.pid && performance.now() < stop)
              await new Promise((r) => setTimeout(r, 10));
            await blocked(db.owner, following.pid);
            gate.resume.resolve();
            following.resume.resolve();
            expect((await pending).eventIds).toHaveLength(1);
            await expect(late).rejects.toThrow("KNOWLEDGE_REVISION_CONFLICT");
            return;
          }
          const writer = await db.owner.connect(),
            pid = (await writer.query("SELECT pg_backend_pid() AS pid")).rows[0]
              .pid;
          const change = async () => {
            if (kind === "member")
              await writer.query(
                "UPDATE client_members SET status='disabled' WHERE id=$1",
                [actorId],
              );
            else if (kind === "session")
              await writer.query(
                "DELETE FROM client_sessions WHERE member_id=$1",
                [actorId],
              );
            else {
              await writer.query(
                "SELECT scope_id FROM knowledge_scopes WHERE scope_id=$1 FOR UPDATE",
                [f.scopeId],
              );
              if (kind === "grant")
                await writer.query(
                  "UPDATE knowledge_grants SET revision=revision+1,revoked_at=clock_timestamp() WHERE scope_id=$1 AND subject_member_id=$2",
                  [f.scopeId, actorId],
                );
              if (kind === "qualification")
                await writer.query(
                  "UPDATE knowledge_qualifications SET revision=revision+1,revoked_at=clock_timestamp() WHERE scope_id=$1 AND subject_member_id=$2",
                  [f.scopeId, f.subjects[1]],
                );
              if (kind === "rights")
                await writer.query(
                  "UPDATE knowledge_rights_state SET revision=revision+1,revoked_at=clock_timestamp() WHERE scope_id=$1 AND rights_revision_id=$2",
                  [f.scopeId, f.rightsId],
                );
              await writer.query(
                "UPDATE knowledge_scopes SET revision=revision+1 WHERE scope_id=$1",
                [f.scopeId],
              );
            }
          };
          try {
            await writer.query("BEGIN");
            if (first === "revocation") {
              await change();
              const gated = gatePool(db.pool);
              const pending = executeCommand(
                gated.pool,
                token,
                "tenant",
                command,
                "synthetic-race-command",
                { synthetic: true },
              );
              pending.catch(() => {});
              // SQL authentication can see the pre-commit identity snapshot. Its later
              // FOR UPDATE must wait and deny/reject the committed current revision.
              const deadline = performance.now() + 2500;
              while (!gated.pid && performance.now() < deadline)
                await new Promise((r) => setTimeout(r, 10));
              await blocked(db.owner, gated.pid);
              await writer.query("COMMIT");
              gated.resume.resolve();
              await expect(pending).rejects.toBeDefined();
            } else {
              const gated = gatePool(db.pool),
                pending = executeCommand(
                  gated.pool,
                  token,
                  "tenant",
                  command,
                  "synthetic-race-command",
                  { synthetic: true },
                );
              await Promise.race([
                gated.entered.promise,
                pending.then(() => {
                  throw new Error("SYNTHETIC_GATE_NOT_REACHED");
                }),
              ]);
              const changing = change();
              changing.catch(() => {});
              await blocked(db.owner, pid);
              gated.resume.resolve();
              expect((await pending).eventIds).toHaveLength(1);
              await changing;
              await writer.query("COMMIT");
            }
          } finally {
            await writer.query("ROLLBACK");
            writer.release();
          }
        }, 15000);
  },
);
