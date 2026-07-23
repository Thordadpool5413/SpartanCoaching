import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const salesWorkflowEntities = pgTable(
  "sales_workflow_entities",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    kind: text("kind").notNull(),
    version: integer("version").notNull().default(1),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("sales_workflow_entities_tenant_kind_id").on(
      table.organizationId,
      table.kind,
      table.id,
    ),
    index("sales_workflow_entities_tenant_kind").on(table.organizationId, table.kind),
    check("sales_workflow_entities_positive_version", sql`${table.version} > 0`),
  ],
);

export const salesWorkflowOutbox = pgTable(
  "sales_workflow_outbox",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    eventType: text("event_type").notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    payload: jsonb("payload").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
    lastErrorCode: text("last_error_code"),
    deadLetteredAt: timestamp("dead_lettered_at", { withTimezone: true }),
  },
  (table) => [index("sales_workflow_outbox_pending").on(table.availableAt)],
);

export const salesWorkflowAudit = pgTable(
  "sales_workflow_audit",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    actorUserId: uuid("actor_user_id").notNull(),
    action: text("action").notNull(),
    aggregateId: uuid("aggregate_id"),
    metadata: jsonb("metadata").notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("sales_workflow_audit_tenant_time").on(table.organizationId, table.occurredAt),
  ],
);

export const salesWorkflowIdempotency = pgTable(
  "sales_workflow_idempotency",
  {
    organizationId: uuid("organization_id").notNull(),
    keyHash: text("key_hash").notNull(),
    fingerprint: text("fingerprint").notNull(),
    state: text("state").notNull(),
    status: integer("status"),
    body: jsonb("body"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.keyHash] }),
    index("sales_workflow_idempotency_expiry").on(table.expiresAt),
    check(
      "sales_workflow_idempotency_state",
      sql`${table.state} in ('processing', 'completed', 'failed')`,
    ),
  ],
);
