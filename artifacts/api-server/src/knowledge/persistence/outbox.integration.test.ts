import { it, expect } from "vitest";
import { databaseSuite, databaseFixture } from "./testing.test";
import { claimOutbox, completeOutbox, consumeEvent } from "./outbox";
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
  },
);
