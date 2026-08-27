/**
 * Member-owned, non-clinical continuity records.
 *
 * This is intentionally a narrow allowlist. Raw Coach conversations, clinical
 * content, recordings, and offline generate request bodies never enter this
 * table. Clients use stable mutation IDs for safe retries and a deterministic
 * last-write-wins policy per record.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const MEMBER_SYNC_RECORD_TYPES = [
  "commitment",
  "tool_draft",
  "tool_result",
  "calculator_report",
  "library_download",
] as const;

export type MemberSyncRecordType = (typeof MEMBER_SYNC_RECORD_TYPES)[number];

export const memberSyncRecords = pgTable(
  "member_sync_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    recordType: varchar("record_type", { length: 40 }).notNull(),
    recordId: varchar("record_id", { length: 160 }).notNull(),
    /** Client-generated idempotency key for this exact mutation. */
    mutationId: varchar("mutation_id", { length: 96 }).notNull(),
    /** Only validated, non-clinical payloads reach this column. */
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    /** Client clock used only for deterministic conflict resolution. */
    clientUpdatedAt: timestamp("client_updated_at", { withTimezone: true }).notNull(),
    /** Tombstones prevent a removed download/report from returning on another device. */
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("member_sync_record_owner_key").on(
      table.organizationId,
      table.memberId,
      table.recordType,
      table.recordId,
    ),
    uniqueIndex("member_sync_mutation_owner_key").on(
      table.organizationId,
      table.memberId,
      table.mutationId,
    ),
    index("member_sync_owner_updated_idx").on(
      table.organizationId,
      table.memberId,
      table.updatedAt,
    ),
  ],
);

export const memberSyncMutationSchema = z.object({
  mutationId: z.string().trim().min(8).max(96),
  recordType: z.enum(MEMBER_SYNC_RECORD_TYPES),
  /** Route-level schemas enforce the type-specific stable identifier shape. */
  recordId: z.string().trim().min(1).max(160),
  payload: z.record(z.string(), z.unknown()).default({}),
  clientUpdatedAt: z.string().datetime({ offset: true }),
  isDeleted: z.boolean().default(false),
});

export type MemberSyncMutation = z.infer<typeof memberSyncMutationSchema>;
export type MemberSyncRecord = typeof memberSyncRecords.$inferSelect;