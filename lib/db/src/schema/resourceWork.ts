/**
 * Member-scoped executable resource work (HSP-26).
 * Persists interactive fill-in progress across devices.
 */
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type ResourceWorkStatus = "draft" | "completed";

export type ResourceWorkFormData = Record<string, unknown>;

export const resourceWork = pgTable(
  "resource_work",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    /** Stable key e.g. weekly-plan or catalog:resource:42 */
    resourceKey: varchar("resource_key", { length: 120 }).notNull(),
    /** Optional link to resources.id when work is for a catalog PDF. */
    resourceId: integer("resource_id"),
    title: varchar("title", { length: 300 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("draft"),
    formSchemaVersion: varchar("form_schema_version", { length: 64 })
      .notNull()
      .default("v1"),
    formData: jsonb("form_data").$type<ResourceWorkFormData>().notNull().default({}),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("resource_work_tenant_member_key").on(
      table.organizationId,
      table.memberId,
      table.resourceKey,
    ),
    index("resource_work_member_updated").on(
      table.organizationId,
      table.memberId,
      table.updatedAt,
    ),
  ],
);

export const insertResourceWorkSchema = createInsertSchema(resourceWork)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    completedAt: true,
  })
  .extend({
    formData: z.record(z.string(), z.unknown()).default({}),
    status: z.enum(["draft", "completed"]).default("draft"),
  });

export type InsertResourceWork = z.infer<typeof insertResourceWorkSchema>;
export type SelectResourceWork = typeof resourceWork.$inferSelect;
