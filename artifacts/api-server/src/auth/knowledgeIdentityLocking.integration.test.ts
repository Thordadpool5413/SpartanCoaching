import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  databaseSuite,
  databaseFixture,
} from "../knowledge/persistence/testing.test";
import { readKnowledge } from "../knowledge/control/reads";
import { executeCommand } from "../knowledge/persistence/commands";
import { hashToken } from "./crypto";
import { acquire, CommandDeadline } from "../knowledge/persistence/deadline";
import { preliminaryAuth } from "../knowledge/control/auth";
import { projectCommand } from "../knowledge/persistence/projection";
import type { Pool, PoolClient } from "pg";
it("account delete and seat transfer lock identities before private children", () => {
  const auth = readFileSync(
      new URL("../routes/authRoutes.ts", import.meta.url),
      "utf8",
    ),
    seat = readFileSync(
      new URL("../routes/companySeatTransitionRoutes.ts", import.meta.url),
      "utf8",
    );
  const deletion = auth.slice(auth.indexOf("const anonymizedEmail"));
  expect(deletion.indexOf("SELECT id FROM client_organizations")).toBeLessThan(
    deletion.indexOf("tx.delete(coachSharedSummaries)"),
  );
  expect(seat.indexOf("SELECT id FROM client_organizations")).toBeLessThan(
    seat.indexOf("tx.update(coachConversations)"),
  );
});
databaseSuite(
  "K1B canonical member projection and tenant read isolation",
  () => {
    const db = databaseFixture();
    it("current-member tenant derives from identity and cannot use a cursor or role as tenant proof", async () => {
      const token = db.fixture.tokens.get(db.fixture.subjects[0])!;
      const read = await readKnowledge(db.pool, token, "tenant", null, {
        synthetic: true,
      });
      expect("scope" in read && read.scope.id).toBe(db.fixture.scopeId);
      await expect(
        readKnowledge(
          db.pool,
          token,
          "tenant",
          {
            kind: "sources",
            domain: "MAC_COVERAGE",
            organizationId: db.second.organizationId,
          },
          { synthetic: true },
        ),
      ).rejects.toThrow("KNOWLEDGE_CONTRACT_INVALID");
      const foreign = Buffer.from(
        JSON.stringify({
          scopeId: db.second.scopeId,
          kind: "sources",
          domain: "MAC_COVERAGE",
          versionId: null,
          last: "synthetic-source",
          revision: 1,
        }),
      ).toString("base64url");
      await expect(
        readKnowledge(
          db.pool,
          token,
          "tenant",
          { kind: "sources", domain: "MAC_COVERAGE", cursor: foreign },
          { synthetic: true },
        ),
      ).rejects.toThrow("KNOWLEDGE_CONTRACT_INVALID");
    });
    it("platform role without a knowledge grant has no knowledge authority", async () => {
      const member = db.fixture.subjects[5],
        token = "synthetic-role-only-session";
      await db.owner.query(
        "UPDATE client_members SET role='platform_admin' WHERE id=$1",
        [member],
      );
      await db.owner.query(
        "INSERT INTO client_sessions(member_id,token_hash,expires_at) VALUES($1,$2,'2099-01-01')",
        [member, hashToken(token)],
      );
      await expect(
        readKnowledge(db.pool, token, "tenant", null, { synthetic: true }),
      ).rejects.toThrow("KNOWLEDGE_PERMISSION_DENIED");
      await expect(
        executeCommand(
          db.pool,
          token,
          "tenant",
          {
            operation: "REVOKE",
            versionId: db.fixture.versionId,
            expectedScopeRevision: db.fixture.state.revision,
            expectedVersionRevisions: {
              [db.fixture.versionId]: db.fixture.state.versions[0].revision,
            },
          },
          "synthetic-role-only-command",
          { synthetic: true },
        ),
      ).rejects.toThrow("KNOWLEDGE_PERMISSION_DENIED");
    });
    it("a foreign version ID cannot authorize mutation in the derived tenant", async () => {
      const f = db.second,
        v = f.state.versions[0],
        s = f.state.sources[0];
      const source = { ...s };
      delete (source as Partial<typeof s>).scope;
      const version = Object.fromEntries(
        Object.entries({
          ...v,
          id: "synthetic-foreign-version",
          artifactRevision: 2,
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
      );
      await executeCommand(
        db.pool,
        f.tokens.get(f.subjects[0])!,
        "tenant",
        {
          operation: "REGISTER",
          source,
          version,
          expectedScopeRevision: f.state.revision,
          expectedVersionRevisions: {},
        },
        "synthetic-foreign-register",
        { synthetic: true },
      );
      await expect(
        executeCommand(
          db.pool,
          db.fixture.tokens.get(db.fixture.subjects[0])!,
          "tenant",
          {
            operation: "REVOKE",
            versionId: "synthetic-foreign-version",
            expectedScopeRevision: db.fixture.state.revision,
            expectedVersionRevisions: { "synthetic-foreign-version": 1 },
          },
          "synthetic-foreign-attempt",
          { synthetic: true },
        ),
      ).rejects.toThrow("KNOWLEDGE_REFERENCE_INVALID");
      expect(
        (
          await db.owner.query(
            "SELECT state FROM knowledge_versions WHERE scope_id=$1 AND version_id='synthetic-foreign-version'",
            [f.scopeId],
          )
        ).rows[0].state,
      ).toBe("DETECTED");
    });
    it("a session expiring during metadata selection cannot return an authorized response", async () => {
      const f = db.second;
      const end = (
        await db.owner.query(
          "SELECT clock_timestamp()+interval '2 seconds' AS deadline",
        )
      ).rows[0].deadline as Date;
      await db.owner.query(
        "UPDATE client_sessions SET expires_at=$2 WHERE member_id=$1",
        [f.subjects[0], end],
      );
      const delayed = new Proxy(db.pool, {
        get(target, key) {
          if (key !== "connect") {
            const value = Reflect.get(target, key);
            return typeof value === "function" ? value.bind(target) : value;
          }
          return async () => {
            const client = await target.connect();
            return new Proxy(client, {
              get(target, key) {
                if (key === "query")
                  return async (...args: unknown[]) => {
                    const result = await (
                      target.query as (...a: unknown[]) => Promise<unknown>
                    ).apply(target, args);
                    const sql =
                      typeof args[0] === "string"
                        ? args[0]
                        : (args[0] as { text: string }).text;
                    if (sql.startsWith("WITH parameter_types"))
                      await new Promise((resolve) =>
                        setTimeout(
                          resolve,
                          Math.max(1, end.getTime() - Date.now() + 50),
                        ),
                      );
                    return result;
                  };
                const value = Reflect.get(target, key);
                return typeof value === "function" ? value.bind(target) : value;
              },
            }) as PoolClient;
          };
        },
      }) as Pool;
      await expect(
        readKnowledge(
          delayed,
          f.tokens.get(f.subjects[0])!,
          "tenant",
          { kind: "sources", domain: "MAC_COVERAGE" },
          { synthetic: true },
        ),
      ).rejects.toThrow("UNAUTHENTICATED");
    }, 10000);
    it("a transferred reviewer retains historical scope identity with inactive membership", async () => {
      const reviewer = db.fixture.subjects[1];
      await db.owner.query(
        "UPDATE client_members SET organization_id=$2 WHERE id=$1",
        [reviewer, db.second.organizationId],
      );
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
            operation: "REVOKE",
            versionId: db.fixture.versionId,
            expectedScopeRevision: db.fixture.state.revision,
            expectedVersionRevisions: {
              [db.fixture.versionId]: db.fixture.state.versions[0].revision,
            },
          },
          true,
        );
        expect(
          p.state.members.find((m) => m.memberId === reviewer),
        ).toMatchObject({
          organizationId: db.fixture.organizationId,
          membershipActive: false,
        });
      } finally {
        await c.close();
      }
      await expect(
        readKnowledge(
          db.pool,
          db.fixture.tokens.get(reviewer)!,
          "tenant",
          null,
          { synthetic: true },
        ),
      ).rejects.toThrow("KNOWLEDGE_PERMISSION_DENIED");
    });
  },
);
