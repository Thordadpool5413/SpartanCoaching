/**
 * Provider-owned resource library (HSP-28).
 * Tenant-scoped private content — never mixed with global Hospice Sales Pro Core resources.
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
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type ProviderResourceKind =
  | "script"
  | "coverage_map"
  | "referral_process"
  | "escalation_guide"
  | "service_reference"
  | "onboarding"
  | "sales_process"
  | "form"
  | "scorecard"
  | "brand_material"
  | "policy"
  | "other";

export type ProviderResourceStatus =
  | "draft"
  | "in_review"
  | "published"
  | "archived"
  | "deleted";

export type ProviderResourceWorkflowMeta = {
  /** Organization-authored description of the field job this resource supports. */
  job?: string;
  /** Organization-authored description of the usable result. */
  expectedOutput?: string;
  /** Organization-authored human review checkpoint. */
  reviewCheckpoint?: string;
  /** Must reference an ID in the shared Field Kit catalog. */
  nextToolId?: string;
};

export type ProviderResourceMeta = {
  tags?: string[];
  audience?: string[];
  whenToUse?: string;
  reviewDueAt?: string | null;
  reviewer?: string | null;
  versionLabel?: string;
  workflow?: ProviderResourceWorkflowMeta | null;
};

export const providerResources = pgTable(
  "provider_resources",
  {
    id: serial("id").primaryKey(),
    /** Product organization id — isolation boundary. */
    organizationId: integer("organization_id").notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    description: text("description"),
    /** Secure object URL or HTTPS path; never cross-tenant. */
    fileUrl: varchar("file_url", { length: 1000 }).notNull(),
    kind: varchar("kind", { length: 64 }).notNull().default("other"),
    status: varchar("status", { length: 32 }).notNull().default("draft"),
    /** Always "provider" for this table; Core uses public resources table. */
    ownership: varchar("ownership", { length: 32 }).notNull().default("provider"),
    meta: jsonb("meta").$type<ProviderResourceMeta | null>(),
    createdByMemberId: integer("created_by_member_id").notNull(),
    updatedByMemberId: integer("updated_by_member_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("provider_resources_org_status").on(
      table.organizationId,
      table.status,
    ),
    index("provider_resources_org_updated").on(
      table.organizationId,
      table.updatedAt,
    ),
  ],
);

export const insertProviderResourceSchema = createInsertSchema(providerResources)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    archivedAt: true,
    deletedAt: true,
  })
  .extend({
    meta: z.custom<ProviderResourceMeta>().nullish(),
    kind: z.string().max(64),
    status: z.string().max(32),
  });

export type InsertProviderResource = z.infer<typeof insertProviderResourceSchema>;
export type SelectProviderResource = typeof providerResources.$inferSelect;
