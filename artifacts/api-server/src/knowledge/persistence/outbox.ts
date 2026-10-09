import type { Pool } from "pg";
import { eventSchema, id } from "../foundation/contracts";
import {
  canonicalBytes,
  canonicalDigest,
  parseContract,
} from "../foundation/canonical";
import { retryDelaySeconds } from "../foundation/future";
import { acquire, CommandDeadline, type CommandConnection } from "./deadline";
import { assertNonOwner } from "./commands";
import { number, text, type Row } from "./codec";

export interface Delivery {
  eventId: string;
  scopeId: string;
  leaseToken: string;
  bodyHash: string;
  body: string;
  attempt: number;
}
export async function claimOutbox(
  pool: Pool,
  limit = 100,
): Promise<Delivery[]> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
    throw new Error("KNOWLEDGE_CONTRACT_INVALID");
  const c = await acquire(pool, new CommandDeadline());
  try {
    await assertNonOwner(c);
    await c.begin();
    await c.query(
      `WITH exhausted AS (SELECT event_id FROM knowledge_outbox WHERE attempts=10 AND delivered_at IS NULL AND dead_lettered_at IS NULL AND (lease_expires_at IS NULL OR lease_expires_at<=clock_timestamp()) ORDER BY event_id COLLATE "C" LIMIT $1 FOR UPDATE SKIP LOCKED)
      UPDATE knowledge_outbox o SET dead_lettered_at=clock_timestamp(),last_error_code='ATTEMPTS_EXHAUSTED',lease_token=NULL,lease_expires_at=NULL FROM exhausted e WHERE o.event_id=e.event_id`,
      [limit],
    );
    const rows = (
      await c.query<Row>(
        `WITH due AS (SELECT event_id FROM knowledge_outbox WHERE attempts<10 AND available_at<=clock_timestamp() AND delivered_at IS NULL AND dead_lettered_at IS NULL AND (lease_expires_at IS NULL OR lease_expires_at<=clock_timestamp()) ORDER BY available_at,event_id COLLATE "C" LIMIT $1 FOR UPDATE SKIP LOCKED),
      leased AS (UPDATE knowledge_outbox o SET attempts=o.attempts+1,lease_token='lease:'||gen_random_uuid()::text,lease_expires_at=clock_timestamp()+interval '60 seconds' FROM due d WHERE o.event_id=d.event_id RETURNING o.*)
      SELECT l.*,a.canonical_body,a.body_hash FROM leased l JOIN knowledge_audit_events a ON a.scope_id=l.scope_id AND a.event_id=l.event_id`,
        [limit],
      )
    ).rows;
    const delivered: Delivery[] = rows.map((row) => {
      const body = text(row.canonical_body),
        event = parseContract(eventSchema, JSON.parse(body));
      if (
        canonicalBytes(event) !== body ||
        canonicalDigest(event) !== row.body_hash
      )
        throw new Error("KNOWLEDGE_EVENT_INTEGRITY_ERROR");
      return {
        eventId: text(row.event_id),
        scopeId: text(row.scope_id),
        leaseToken: text(row.lease_token),
        bodyHash: text(row.body_hash),
        body,
        attempt: number(row.attempts),
      };
    });
    await c.commit();
    return delivered;
  } finally {
    await c.close();
  }
}
export async function completeOutbox(
  pool: Pool,
  delivery: Delivery,
  success: boolean,
): Promise<boolean> {
  parseContract(id, delivery.leaseToken);
  const c = await acquire(pool, new CommandDeadline());
  try {
    await assertNonOwner(c);
    await c.begin();
    const delay = retryDelaySeconds(delivery.attempt);
    const result = await c.query(
      `UPDATE knowledge_outbox SET
      delivered_at=CASE WHEN $4 THEN clock_timestamp() ELSE NULL END,
      dead_lettered_at=CASE WHEN NOT $4 AND attempts=10 THEN clock_timestamp() ELSE NULL END,
      available_at=CASE WHEN $4 OR attempts=10 THEN available_at ELSE clock_timestamp()+$5*interval '1 second' END,
      last_error_code=CASE WHEN $4 THEN NULL WHEN attempts=10 THEN 'ATTEMPTS_EXHAUSTED' ELSE 'DELIVERY_UNAVAILABLE' END,
      lease_token=NULL,lease_expires_at=NULL WHERE scope_id=$1 AND event_id=$2 AND lease_token=$3
      AND attempts=$6 AND lease_expires_at>clock_timestamp() AND delivered_at IS NULL AND dead_lettered_at IS NULL RETURNING event_id`,
      [
        delivery.scopeId,
        delivery.eventId,
        delivery.leaseToken,
        success,
        delay,
        delivery.attempt,
      ],
    );
    await c.commit();
    return result.rowCount === 1;
  } finally {
    await c.close();
  }
}
/** Destination is optional and unconfigured delivery fails, never silently succeeds. */
export async function deliverOutbox(
  pool: Pool,
  destination?: (delivery: Delivery) => Promise<void>,
) {
  const deliveries = await claimOutbox(pool);
  let succeeded = 0;
  for (const delivery of deliveries) {
    let success = false;
    try {
      if (destination) {
        await destination(delivery);
        success = true;
      }
    } catch {
      /* No provider error/content is logged. */
    }
    if ((await completeOutbox(pool, delivery, success)) && success) succeeded++;
  }
  return { claimed: deliveries.length, delivered: succeeded };
}
export async function consumeEvent(
  pool: Pool,
  consumerId: string,
  body: string,
  reconcile: (
    connection: CommandConnection,
    event: ReturnType<typeof eventSchema.parse>,
  ) => Promise<void>,
) {
  parseContract(id, consumerId);
  const event = parseContract(eventSchema, JSON.parse(body));
  if (canonicalBytes(event) !== body)
    throw new Error("KNOWLEDGE_EVENT_INTEGRITY_ERROR");
  const hash = canonicalDigest(event);
  const c = await acquire(pool, new CommandDeadline());
  try {
    await assertNonOwner(c);
    await c.begin();
    const audit = (
      await c.query<Row>(
        "SELECT body_hash FROM knowledge_audit_events WHERE scope_id=$1 AND event_id=$2",
        [event.scopeId, event.id],
      )
    ).rows[0];
    if (!audit || audit.body_hash !== hash)
      throw new Error("KNOWLEDGE_EVENT_INTEGRITY_ERROR");
    const inserted = await c.query(
      "INSERT INTO knowledge_consumer_receipts(consumer_id,event_id,scope_id,body_hash,processed_at) VALUES($1,$2,$3,$4,clock_timestamp()) ON CONFLICT DO NOTHING RETURNING event_id",
      [consumerId, event.id, event.scopeId, hash],
    );
    if (inserted.rowCount === 0) {
      const existing = (
        await c.query<Row>(
          "SELECT body_hash FROM knowledge_consumer_receipts WHERE consumer_id=$1 AND event_id=$2",
          [consumerId, event.id],
        )
      ).rows[0];
      if (!existing || existing.body_hash !== hash)
        throw new Error("KNOWLEDGE_EVENT_INTEGRITY_ERROR");
      await c.finishRead();
      return { duplicate: true };
    }
    await reconcile(c, event); // Canonical reread handles stale, gaps, and distinct expiry conditions at the same revision.
    await c.commit();
    return { duplicate: false };
  } finally {
    await c.close();
  }
}
