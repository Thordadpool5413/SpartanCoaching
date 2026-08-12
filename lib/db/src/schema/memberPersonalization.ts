/**
 * Member workspace personalization (HSP-37).
 * Tenant-scoped preferences + history that follow the user across devices.
 */
import {
  pgTable,
  serial,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type PersonalizationItemKind =
  | "tool"
  | "resource"
  | "page"
  | "saved_work"
  | "workflow";

export type PersonalizationRecentItem = {
  kind: PersonalizationItemKind;
  id: string;
  title: string;
  href: string;
  at: string;
};

export type PersonalizationPayload = {
  schemaVersion: 1;
  favorites: {
    tools: string[];
    resources: string[];
  };
  pinnedTools: string[];
  pinnedResources: string[];
  recent: PersonalizationRecentItem[];
  dismissedRecommendationIds: string[];
};

export const emptyPersonalizationPayload = (): PersonalizationPayload => ({
  schemaVersion: 1,
  favorites: { tools: [], resources: [] },
  pinnedTools: [],
  pinnedResources: [],
  recent: [],
  dismissedRecommendationIds: [],
});

export const personalizationPayloadSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  favorites: z
    .object({
      tools: z.array(z.string().max(120)).max(40).default([]),
      resources: z.array(z.string().max(120)).max(40).default([]),
    })
    .default({ tools: [], resources: [] }),
  pinnedTools: z.array(z.string().max(120)).max(20).default([]),
  pinnedResources: z.array(z.string().max(120)).max(20).default([]),
  recent: z
    .array(
      z.object({
        kind: z.enum(["tool", "resource", "page", "saved_work", "workflow"]),
        id: z.string().max(200),
        title: z.string().max(300),
        href: z.string().max(500),
        at: z.string().max(40),
      }),
    )
    .max(40)
    .default([]),
  dismissedRecommendationIds: z.array(z.string().max(120)).max(50).default([]),
});

export const memberPersonalization = pgTable(
  "member_personalization",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    payload: jsonb("payload")
      .$type<PersonalizationPayload>()
      .notNull()
      .default({
        schemaVersion: 1,
        favorites: { tools: [], resources: [] },
        pinnedTools: [],
        pinnedResources: [],
        recent: [],
        dismissedRecommendationIds: [],
      }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("member_personalization_member_uidx").on(table.memberId),
    index("member_personalization_org_idx").on(table.organizationId),
  ],
);

export type MemberPersonalizationRow = typeof memberPersonalization.$inferSelect;
