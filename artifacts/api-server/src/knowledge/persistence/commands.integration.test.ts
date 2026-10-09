import { it, expect } from "vitest";
import { databaseSuite, databaseFixture } from "./testing.test";
import { executeCommand } from "./commands";
import { randomUUID } from "node:crypto";
import { seedKnowledge } from "../../../../../lib/db/scripts/knowledge-synthetic";
import { acquire, CommandDeadline } from "./deadline";
import { preliminaryAuth } from "../control/auth";
import { projectCommand } from "./projection";
import { transitionKnowledge } from "../foundation/lifecycle";
import { persistDelta } from "./writes";
import type { Pool, PoolClient } from "pg";
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
  it("round-trips all fifteen human operations, source revisions, duplicate registration and publication history", async () => {
    const owner = await db.owner.connect();
    let f: Awaited<ReturnType<typeof seedKnowledge>>;
    try {
      f = await seedKnowledge(owner, 7300);
    } finally {
      owner.release();
    }
    const original = f.state.versions[0],
      source = {
        ...f.state.sources[0],
        metadataRevision: 2,
        title: "Synthetic metadata revision two",
      };
    delete (source as Partial<typeof source>).scope;
    const call = async (
      command: Record<string, unknown>,
      subject = 0,
      touched?: string[],
    ) => {
      const ids =
        touched ?? ("versionId" in command ? [String(command.versionId)] : []);
      const revisions = (
        await db.owner.query(
          "SELECT version_id,revision FROM knowledge_versions WHERE scope_id=$1 AND version_id=ANY($2::text[])",
          [f.scopeId, ids],
        )
      ).rows;
      const expectedScopeRevision = Number(
        (
          await db.owner.query(
            "SELECT revision FROM knowledge_scopes WHERE scope_id=$1",
            [f.scopeId],
          )
        ).rows[0].revision,
      );
      return executeCommand(
        db.pool,
        f.tokens.get(f.subjects[subject])!,
        "tenant",
        {
          ...command,
          expectedScopeRevision,
          expectedVersionRevisions: Object.fromEntries(
            revisions.map((r) => [r.version_id, Number(r.revision)]),
          ),
        },
        `synthetic-command-${randomUUID()}`,
        { synthetic: true },
      );
    };
    const register = (
      id: string,
      documentId: string,
      artifactRevision: number,
    ) => ({
      operation: "REGISTER",
      source,
      version: Object.fromEntries(
        Object.entries({
          ...original,
          id,
          documentId,
          artifactRevision,
          sourceMetadataRevision: 2,
          rightsRevisionId: f.rightsId,
        }).filter(([key]) =>
          [
            "id",
            "sourceId",
            "sourceMetadataRevision",
            "documentId",
            "upstreamEdition",
            "artifactRevision",
            "rawHash",
            "normalizedHash",
            "parserId",
            "parserVersion",
            "sourceUrl",
            "publishedAt",
            "retrievedAt",
            "effectiveFrom",
            "effectiveTo",
            "applicability",
            "legacyCoverageSnapshotId",
            "rightsRevisionId",
          ].includes(key),
        ),
      ),
    });
    const stage = async (id: string) => {
      for (const name of [
        "FETCHED",
        "QUARANTINED",
        "PARSED",
        "DIFFED",
        "VALIDATED",
      ] as const) {
        const c = await acquire(db.owner, new CommandDeadline());
        try {
          const identity = await preliminaryAuth(
            c,
            f.tokens.get(f.subjects[0])!,
          );
          await c.begin();
          const revisions = (
            await c.query(
              "SELECT revision FROM knowledge_versions WHERE scope_id=$1 AND version_id=$2",
              [f.scopeId, id],
            )
          ).rows[0];
          const scope = (
            await c.query(
              "SELECT revision FROM knowledge_scopes WHERE scope_id=$1",
              [f.scopeId],
            )
          ).rows[0];
          const command = {
            operation: "RECORD_STAGE" as const,
            versionId: id,
            stage: name,
            evidenceRef: "synthetic-stage-evidence",
            expectedScopeRevision: Number(scope.revision),
            expectedVersionRevisions: { [id]: Number(revisions.revision) },
          };
          const p = await projectCommand(c, identity, f.scopeId, command, true);
          const now = new Date().toISOString(),
            eventId = `synthetic-stage:${randomUUID()}`;
          const result = transitionKnowledge(p.state, null, command, {
            kind: "PIPELINE",
            synthetic: true,
            now,
            eventId,
            requestId: eventId,
            receiptRef: null,
          });
          await persistDelta(
            c,
            p.state,
            result.state,
            result.eventIntents[0],
            now,
          );
          await c.commit();
        } finally {
          await c.close();
        }
      }
    };
    const second = "synthetic-version-2",
      third = "synthetic-version-3";
    const registered = await call(register(second, original.documentId, 2));
    const duplicate = await call(register(second, original.documentId, 2));
    expect(duplicate.scopeRevision).toBe(registered.scopeRevision);
    expect(duplicate.eventIds).toEqual([]);
    expect(duplicate.versionIds).toEqual([second]);
    for (const id of [second, third]) {
      if (id === third)
        await call(register(third, "synthetic-independent-document", 1));
      await stage(id);
      await call({ operation: "SUBMIT", versionId: id });
      if (id === second) {
        await call(
          { operation: "REJECT_REVIEW", versionId: id, reviewDueAt: null },
          1,
        );
        await call({ operation: "SUBMIT", versionId: id });
      }
      await call(
        {
          operation: "APPROVE",
          versionId: id,
          reviewDueAt: "2099-01-01T00:00:00.000Z",
        },
        1,
      );
      await call(
        {
          operation: "REAPPROVE",
          versionId: id,
          reviewDueAt: "2099-01-01T00:00:00.000Z",
        },
        1,
      );
      await call({
        operation: "RECORD_HEALTH",
        versionId: id,
        health: {
          ...original.health,
          lkg: null,
          checkedAt: new Date().toISOString(),
          lastValidatedAt: new Date().toISOString(),
        },
      });
      await call(
        {
          operation: "APPROVE_LKG",
          versionId: id,
          until: "2089-01-01T00:00:00.000Z",
        },
        3,
      );
    }
    const approval = async (id: string) =>
      (
        await db.owner.query(
          "SELECT approval_id FROM knowledge_approvals WHERE scope_id=$1 AND version_id=$2 ORDER BY reviewed_at DESC,approval_id DESC LIMIT 1",
          [f.scopeId, id],
        )
      ).rows[0].approval_id;
    await call(
      {
        operation: "ACTIVATE",
        versionId: third,
        approvalId: await approval(third),
        serviceFrom: original.effectiveFrom,
        serviceTo: original.effectiveTo,
        applicability: original.applicability,
        enabledUses: f.state.assignments[0].enabledUses,
      },
      2,
    );
    const superseded = await call(
      {
        operation: "SUPERSEDE",
        versionId: second,
        assignmentId: f.state.assignments[0].id,
        approvalId: await approval(second),
        cutover: "2026-10-01",
      },
      2,
      [second, original.id],
    );
    const live = (
      await db.owner.query(
        "SELECT assignment_id FROM knowledge_publication_assignments WHERE scope_id=$1 AND version_id=$2 AND retired_at IS NULL ORDER BY service_from DESC LIMIT 1",
        [f.scopeId, second],
      )
    ).rows[0].assignment_id;
    const rolled = await call(
      {
        operation: "ROLLBACK",
        versionId: original.id,
        assignmentId: live,
        approvalId: await approval(original.id),
        cutover: "2026-11-01",
      },
      2,
      [original.id, second],
    );
    expect(superseded.assignmentIds.length).toBe(3);
    expect(rolled.assignmentIds.length).toBe(3);
    const rollbackPin = (
      await db.owner.query(
        "SELECT assignment_id,approval_id FROM knowledge_publication_assignments WHERE scope_id=$1 AND version_id=$2 AND retired_at IS NULL ORDER BY service_from DESC LIMIT 1",
        [f.scopeId, original.id],
      )
    ).rows[0];
    await call(
      {
        operation: "REAPPROVE",
        versionId: original.id,
        reviewDueAt: "2099-01-01T00:00:00.000Z",
      },
      1,
    );
    await call(
      {
        operation: "REFRESH_APPROVAL",
        versionId: original.id,
        assignmentId: rollbackPin.assignment_id,
        approvalId: await approval(original.id),
      },
      2,
    );
    await call({ operation: "REVOKE", versionId: second });
    await call(
      {
        operation: "REVOKE_RIGHTS",
        versionId: third,
        expectedRightsRevision: 1,
      },
      3,
      [original.id, second, third],
    );
    await call(
      {
        operation: "REVOKE_GRANT",
        credentialId: "synthetic-delegated-grant",
        expectedCredentialRevision: 1,
      },
      1,
    );
    await call(
      {
        operation: "REVOKE_QUALIFICATION",
        credentialId: `synthetic-qualification-${f.subjects[3]}`,
        expectedCredentialRevision: 1,
      },
      1,
    );
    const operations = (
      await db.owner.query(
        "SELECT DISTINCT operation FROM knowledge_command_receipts WHERE scope_id=$1",
        [f.scopeId],
      )
    ).rows
      .map((r) => r.operation)
      .sort();
    expect(operations).toEqual(
      [
        "REGISTER",
        "SUBMIT",
        "APPROVE",
        "REAPPROVE",
        "REJECT_REVIEW",
        "ACTIVATE",
        "SUPERSEDE",
        "ROLLBACK",
        "REFRESH_APPROVAL",
        "REVOKE",
        "RECORD_HEALTH",
        "APPROVE_LKG",
        "REVOKE_RIGHTS",
        "REVOKE_GRANT",
        "REVOKE_QUALIFICATION",
      ].sort(),
    );
    expect(
      Number(
        (
          await db.owner.query(
            "SELECT count(*) AS n FROM knowledge_source_revisions WHERE scope_id=$1",
            [f.scopeId],
          )
        ).rows[0].n,
      ),
    ).toBe(2);
  }, 60000);
  for (const kind of ["session", "selected-grant"] as const)
    it(`${kind} expiring after writes rolls back before COMMIT`, async () => {
      const owner = await db.owner.connect();
      let f: Awaited<ReturnType<typeof seedKnowledge>>;
      try {
        f = await seedKnowledge(owner, kind === "session" ? 7410 : 7411);
      } finally {
        owner.release();
      }
      const end = (
        await db.owner.query(
          "SELECT clock_timestamp()+interval '2 seconds' AS deadline",
        )
      ).rows[0].deadline as Date;
      if (kind === "session")
        await db.owner.query(
          "UPDATE client_sessions SET expires_at=$2 WHERE member_id=$1",
          [f.subjects[0], end],
        );
      else
        await db.owner.query(
          "INSERT INTO knowledge_grants SELECT (jsonb_populate_record(NULL::knowledge_grants,to_jsonb(g)||jsonb_build_object('grant_id','aaa-synthetic-expiring','expires_at',$3::timestamptz))).* FROM knowledge_grants g WHERE scope_id=$1 AND subject_member_id=$2",
          [f.scopeId, f.subjects[0], end],
        );
      const delayed = new Proxy(db.pool, {
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
                    if (
                      sql.startsWith("INSERT INTO knowledge_command_receipts")
                    )
                      await new Promise((r) =>
                        setTimeout(
                          r,
                          Math.max(1, end.getTime() - Date.now() + 50),
                        ),
                      );
                    return result;
                  };
                const value = Reflect.get(client, key);
                return typeof value === "function" ? value.bind(client) : value;
              },
            }) as PoolClient;
          };
        },
      }) as Pool;
      const v = f.state.versions[0];
      await expect(
        executeCommand(
          delayed,
          f.tokens.get(f.subjects[0])!,
          "tenant",
          {
            operation: "REVOKE",
            versionId: v.id,
            expectedScopeRevision: f.state.revision,
            expectedVersionRevisions: { [v.id]: v.revision },
          },
          "synthetic-expiry-before-commit",
          { synthetic: true },
        ),
      ).rejects.toThrow(
        kind === "session" ? "UNAUTHENTICATED" : "COMMAND_IN_PROGRESS",
      );
      expect(
        (
          await db.owner.query(
            "SELECT state FROM knowledge_versions WHERE scope_id=$1 AND version_id=$2",
            [f.scopeId, v.id],
          )
        ).rows[0].state,
      ).toBe("ACTIVE");
      expect(
        Number(
          (
            await db.owner.query(
              "SELECT count(*) AS n FROM knowledge_command_receipts WHERE scope_id=$1",
              [f.scopeId],
            )
          ).rows[0].n,
        ),
      ).toBe(0);
    }, 10000);
});
