import { it, expect } from "vitest";
import { databaseSuite, databaseFixture } from "./testing.test";
import { claimOutbox, completeOutbox, consumeEvent } from "./outbox";
import { persistDueExpiry } from "./expiry";
import { executeCommand } from "./commands";
databaseSuite(
  "K1B PostgreSQL outbox lease CAS, retries and consumer atomicity",
  () => {
    const db = databaseFixture();
    it("claims once, rejects stale token, retries without eleven attempts, and deduplicates consumers", async () => {
      const first = await claimOutbox(db.pool, 1);
      expect(first).toHaveLength(1);
      const d = first[0];
      expect(
        await completeOutbox(
          db.pool,
          { ...d, leaseToken: "synthetic-stale-token" },
          true,
        ),
      ).toBe(false);
      expect(await completeOutbox(db.pool, d, false)).toBe(true);
      const row = (
        await db.owner.query(
          "SELECT attempts,lease_token,last_error_code,available_at>clock_timestamp() AS delayed FROM knowledge_outbox WHERE event_id=$1",
          [d.eventId],
        )
      ).rows[0];
      expect(row.attempts).toBe(1);
      expect(row.lease_token).toBeNull();
      expect(row.delayed).toBe(true);
      expect(row.last_error_code).toBe("DELIVERY_UNAVAILABLE");
      let calls = 0;
      const reconcile = async () => {
        calls++;
      };
      expect(
        await consumeEvent(db.pool, "synthetic-consumer", d.body, reconcile),
      ).toEqual({ duplicate: false });
      expect(
        await consumeEvent(db.pool, "synthetic-consumer", d.body, reconcile),
      ).toEqual({ duplicate: true });
      expect(calls).toBe(1);
      await expect(
        consumeEvent(
          db.pool,
          "synthetic-rollback-consumer",
          d.body,
          async () => {
            throw new Error("synthetic-reconcile-failure");
          },
        ),
      ).rejects.toThrow("synthetic-reconcile-failure");
      expect(
        (
          await db.owner.query(
            "SELECT count(*)::int AS n FROM knowledge_consumer_receipts WHERE consumer_id='synthetic-rollback-consumer'",
          )
        ).rows[0].n,
      ).toBe(0);
    });
    it("two workers cannot complete the same live lease", async () => {
      const [d] = await claimOutbox(db.pool, 1);
      const results = await Promise.all([
        completeOutbox(db.pool, d, true),
        completeOutbox(db.pool, d, true),
      ]);
      expect(results.sort()).toEqual([false, true]);
    });
    it("expired attempt ten becomes dead-lettered without an eleventh claim", async () => {
      const [d] = await claimOutbox(db.pool, 1);
      for (let n = 2; n <= 10; n++)
        await db.owner.query(
          "UPDATE knowledge_outbox SET attempts=$2 WHERE event_id=$1",
          [d.eventId, n],
        );
      await db.owner.query(
        "UPDATE knowledge_outbox SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE event_id=$1",
        [d.eventId],
      );
      await claimOutbox(db.pool, 100);
      const row = (
        await db.owner.query(
          "SELECT attempts,dead_lettered_at,last_error_code FROM knowledge_outbox WHERE event_id=$1",
          [d.eventId],
        )
      ).rows[0];
      expect(row.attempts).toBe(10);
      expect(row.dead_lettered_at).not.toBeNull();
      expect(row.last_error_code).toBe("ATTEMPTS_EXHAUSTED");
    });
    it("persists each already-due expiry condition once, without human receipts or revision mutation", async () => {
      const v = db.fixture.state.versions[0];
      await executeCommand(
        db.pool,
        db.fixture.tokens.get(db.fixture.subjects[0])!,
        "tenant",
        {
          operation: "RECORD_HEALTH",
          versionId: v.id,
          expectedScopeRevision: db.fixture.state.revision,
          expectedVersionRevisions: { [v.id]: v.revision },
          health: {
            state: "STALE_BLOCKED",
            checkedAt: new Date().toISOString(),
            lastValidatedAt: "2020-01-03T00:00:00.000Z",
            warningAt: "2021-01-01T00:00:00.000Z",
            hardExpiresAt: "2022-01-01T00:00:00.000Z",
            lkg: null,
          },
        },
        "synthetic-expiry-health",
        { synthetic: true },
      );
      const before = (
        await db.owner.query(
          "SELECT revision,(SELECT count(*) FROM knowledge_command_receipts WHERE scope_id=$1) AS receipts FROM knowledge_scopes WHERE scope_id=$1",
          [db.fixture.scopeId],
        )
      ).rows[0];
      const target = {
        scopeId: db.fixture.scopeId,
        aggregateKind: "VERSION",
        aggregateId: v.id,
      };
      const a = await persistDueExpiry(db.pool, target),
        b = await persistDueExpiry(db.pool, target);
      expect(a.eventId).not.toBeNull();
      expect(b.eventId).not.toBe(a.eventId);
      await persistDueExpiry(db.pool, target);
      expect(
        (
          await db.owner.query(
            "SELECT revision,(SELECT count(*) FROM knowledge_command_receipts WHERE scope_id=$1) AS receipts FROM knowledge_scopes WHERE scope_id=$1",
            [db.fixture.scopeId],
          )
        ).rows[0],
      ).toEqual(before);
      const rows = (
        await db.owner.query(
          "SELECT e.expiry_kind,o.event_id FROM knowledge_audit_events e JOIN knowledge_outbox o USING(event_id) WHERE e.scope_id=$1 AND e.operation='EVALUATE_EXPIRY'",
          [db.fixture.scopeId],
        )
      ).rows;
      expect(rows.map((r) => r.expiry_kind).sort()).toEqual([
        "HEALTH_HARD_END",
        "HEALTH_WARNING",
      ]);
    });
  },
);
