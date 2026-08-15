import {
  boolean,
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

export const coachConversations = pgTable(
  "coach_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    title: varchar("title", { length: 160 }).notNull().default("New conversation"),
    status: varchar("status", { length: 24 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_coach_conversations_owner").on(table.organizationId, table.memberId, table.updatedAt)],
);

export const coachMessages = pgTable(
  "coach_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id").notNull().references(() => coachConversations.id, { onDelete: "cascade" }),
    clientRequestId: uuid("client_request_id").notNull(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    role: varchar("role", { length: 16 }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_coach_messages_owner_time").on(table.organizationId, table.memberId, table.conversationId, table.createdAt),
    uniqueIndex("uq_coach_messages_request_role").on(table.conversationId, table.clientRequestId, table.role),
  ],
);

export const coachPreferences = pgTable(
  "coach_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    memoryEnabled: boolean("memory_enabled").notNull().default(false),
    responseStyle: varchar("response_style", { length: 24 }).notNull().default("balanced"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("uq_coach_preferences_owner").on(table.organizationId, table.memberId)],
);

export const coachMemoryItems = pgTable(
  "coach_memory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    category: varchar("category", { length: 24 }).notNull(),
    content: text("content").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_coach_memory_owner").on(table.organizationId, table.memberId, table.updatedAt)],
);

export const coachSharedSummaries = pgTable(
  "coach_shared_summaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: integer("organization_id").notNull(),
    ownerMemberId: integer("owner_member_id").notNull(),
    sharedWithMemberId: integer("shared_with_member_id").notNull(),
    conversationId: uuid("conversation_id").references(() => coachConversations.id, { onDelete: "set null" }),
    summary: text("summary").notNull(),
    commitments: jsonb("commitments").$type<string[]>().notNull().default([]),
    sharedAt: timestamp("shared_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_coach_shared_recipient").on(table.organizationId, table.sharedWithMemberId, table.sharedAt),
    index("idx_coach_shared_owner").on(table.organizationId, table.ownerMemberId, table.sharedAt),
  ],
);

export type CoachConversation = typeof coachConversations.$inferSelect;
export type CoachMessage = typeof coachMessages.$inferSelect;
export type CoachPreference = typeof coachPreferences.$inferSelect;
export type CoachMemoryItem = typeof coachMemoryItems.$inferSelect;
export type CoachSharedSummary = typeof coachSharedSummaries.$inferSelect;
