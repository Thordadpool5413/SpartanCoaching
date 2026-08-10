import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Cross-device user workspace records (saved AI results, preferences, etc.).
 * Authoritative server store; clients may cache offline but must sync with version checks.
 */
export const memberWorkspaceItems = pgTable(
  "member_workspace_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    /** e.g. saved_response, preference, next_action */
    kind: varchar("kind", { length: 64 }).notNull(),
    /** Stable client-generated id for offline-first upserts */
    clientKey: varchar("client_key", { length: 128 }).notNull(),
    title: text("title"),
    payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
    version: integer("version").notNull().default(1),
    /** Client clock when last edited (ms epoch); used with version for conflict policy */
    clientUpdatedAtMs: integer("client_updated_at_ms").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("member_workspace_member_kind_key").on(
      table.memberId,
      table.kind,
      table.clientKey,
    ),
    index("member_workspace_member_kind").on(table.memberId, table.kind),
    index("member_workspace_org").on(table.organizationId),
  ],
);

export type MemberWorkspaceItem = typeof memberWorkspaceItems.$inferSelect;
export type InsertMemberWorkspaceItem = typeof memberWorkspaceItems.$inferInsert;
