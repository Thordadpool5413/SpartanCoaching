import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const memberWorkItems = pgTable("member_work_items", {
  id: uuid("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  memberId: integer("member_id").notNull(),
  accountId: uuid("account_id"),
  kind: text("kind").notNull(),
  toolId: text("tool_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("completed"),
  input: jsonb("input").$type<Record<string, unknown>>().notNull().default({}),
  output: jsonb("output").$type<Record<string, unknown>>().notNull(),
  nextAction: jsonb("next_action").$type<{ title: string; href?: string; dueAt?: string } | null>(),
  sourcePlatform: text("source_platform").notNull().default("web"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
}, (table) => ({
  ownerUpdatedIdx: index("member_work_owner_updated_idx").on(table.organizationId, table.memberId, table.updatedAt),
  accountIdx: index("member_work_account_idx").on(table.organizationId, table.accountId),
  toolIdx: index("member_work_tool_idx").on(table.organizationId, table.memberId, table.toolId),
}));
