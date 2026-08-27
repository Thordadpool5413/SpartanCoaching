/**
 * Device-only member work that should survive a reinstall or second device.
 * Raw files and clinical/vault content are intentionally excluded.
 */
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type ContinuityToolDraft = {
  value: Record<string, string>;
  updatedAt: string;
};

export type ContinuityToolResult = {
  value: string;
  updatedAt: string;
};

export type ContinuityCalculatorReport = {
  id: string;
  kind: "activity" | "roi" | "rep-cost" | "branch";
  title: string;
  summary: string;
  report: string;
  createdAt: string;
  updatedAt: string;
};

export type ContinuityDownload = {
  sourceUrl: string;
  title: string;
  kind: "article" | "audio" | "resource";
  description?: string;
  updatedAt: string;
};

export type MemberContinuityPayload = {
  schemaVersion: 1;
  toolDrafts: Record<string, ContinuityToolDraft>;
  toolResults: Record<string, ContinuityToolResult>;
  calculatorReports: Record<string, ContinuityCalculatorReport>;
  downloads: Record<string, ContinuityDownload>;
};

const isoTime = z.string().datetime({ offset: true });
const safeToolValue = z.record(z.string().max(80), z.string().max(2_000));

export const memberContinuityPayloadSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  toolDrafts: z.record(z.string().max(80), z.object({
    value: safeToolValue,
    updatedAt: isoTime,
  })).superRefine((value, context) => {
    if (Object.keys(value).length > 8) context.addIssue({ code: "custom", message: "Too many tool drafts" });
  }).default({}),
  toolResults: z.record(z.string().max(80), z.object({
    value: z.string().max(12_000),
    updatedAt: isoTime,
  })).superRefine((value, context) => {
    if (Object.keys(value).length > 8) context.addIssue({ code: "custom", message: "Too many tool results" });
  }).default({}),
  calculatorReports: z.record(z.string().max(120), z.object({
    id: z.string().max(120),
    kind: z.enum(["activity", "roi", "rep-cost", "branch"]),
    title: z.string().max(300),
    summary: z.string().max(1_200),
    report: z.string().max(12_000),
    createdAt: isoTime,
    updatedAt: isoTime,
  })).superRefine((value, context) => {
    if (Object.keys(value).length > 24) context.addIssue({ code: "custom", message: "Too many calculator reports" });
  }).default({}),
  downloads: z.record(z.string().max(1_000), z.object({
    sourceUrl: z.string().max(1_000),
    title: z.string().max(300),
    kind: z.enum(["article", "audio", "resource"]),
    description: z.string().max(1_200).optional(),
    updatedAt: isoTime,
  })).superRefine((value, context) => {
    if (Object.keys(value).length > 100) context.addIssue({ code: "custom", message: "Too many library records" });
  }).default({}),
});

export const emptyMemberContinuityPayload = (): MemberContinuityPayload => ({
  schemaVersion: 1,
  toolDrafts: {},
  toolResults: {},
  calculatorReports: {},
  downloads: {},
});

function newer<T extends { updatedAt: string }>(left: T | undefined, right: T | undefined): T | undefined {
  if (!left) return right;
  if (!right) return left;
  return Date.parse(left.updatedAt) >= Date.parse(right.updatedAt) ? left : right;
}

function mergeRecord<T extends { updatedAt: string }>(
  left: Record<string, T>,
  right: Record<string, T>,
): Record<string, T> {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return Object.fromEntries([...keys].map((key) => [key, newer(left[key], right[key])!]));
}

/** Last-write-wins per item, using the client-captured update timestamp. */
export function mergeMemberContinuityPayload(
  left: MemberContinuityPayload,
  right: MemberContinuityPayload,
): MemberContinuityPayload {
  return {
    schemaVersion: 1,
    toolDrafts: mergeRecord(left.toolDrafts, right.toolDrafts),
    toolResults: mergeRecord(left.toolResults, right.toolResults),
    calculatorReports: mergeRecord(left.calculatorReports, right.calculatorReports),
    downloads: mergeRecord(left.downloads, right.downloads),
  };
}

export const memberContinuity = pgTable(
  "member_continuity",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    payload: jsonb("payload")
      .$type<MemberContinuityPayload>()
      .notNull()
      .default({
        schemaVersion: 1,
        toolDrafts: {},
        toolResults: {},
        calculatorReports: {},
        downloads: {},
      }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("member_continuity_owner_uidx").on(table.organizationId, table.memberId),
    index("member_continuity_member_updated_idx").on(table.memberId, table.updatedAt),
  ],
);

export const insertMemberContinuitySchema = createInsertSchema(memberContinuity).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMemberContinuity = z.infer<typeof insertMemberContinuitySchema>;
export type MemberContinuity = typeof memberContinuity.$inferSelect;