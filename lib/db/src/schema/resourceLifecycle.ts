/**
 * Resource lifecycle audit events (HSP-27).
 * Append-only history for draft → review → publish → archive/retire / supersede.
 */
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export type ResourceLifecycleAction =
  | "create_draft"
  | "submit_review"
  | "publish"
  | "archive"
  | "retire"
  | "supersede"
  | "publish_new_version"
  | "update_metadata"
  | "restore_draft";

export const resourceLifecycleEvents = pgTable(
  "resource_lifecycle_events",
  {
    id: serial("id").primaryKey(),
    resourceId: integer("resource_id").notNull(),
    seriesKey: varchar("series_key", { length: 120 }),
    action: varchar("action", { length: 64 }).notNull(),
    fromStatus: varchar("from_status", { length: 32 }),
    toStatus: varchar("to_status", { length: 32 }),
    actorLabel: varchar("actor_label", { length: 200 }),
    note: text("note"),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("resource_lifecycle_events_resource").on(table.resourceId),
    index("resource_lifecycle_events_series").on(table.seriesKey),
  ],
);

export type SelectResourceLifecycleEvent =
  typeof resourceLifecycleEvents.$inferSelect;
