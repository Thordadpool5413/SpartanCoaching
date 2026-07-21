import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  serial,
  boolean,
  varchar,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

/** Client organizations — personal (1-seat) or company multi-seat */
export const clientOrganizations = pgTable("client_organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 32 }).notNull().default("personal"), // personal | company | platform
  seatLimit: integer("seat_limit").notNull().default(1),
  status: varchar("status", { length: 32 }).notNull().default("trial"), // trial | active | expired | suspended
  /** Sales pipeline (ops), separate from technical access status */
  pipelineStatus: varchar("pipeline_status", { length: 32 }).notNull().default("trial"),
  // prospect | trial | follow_up | won | lost | churned
  trialEndsAt: timestamp("trial_ends_at"),
  activatedAt: timestamp("activated_at"),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  lostReason: text("lost_reason"),
  notes: text("notes"), // rolling summary / sticky notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClientOrganization = typeof clientOrganizations.$inferSelect;
export type InsertClientOrganization = typeof clientOrganizations.$inferInsert;

/** Timeline / CRM activity on an organization */
export const orgTimelineEvents = pgTable(
  "org_timeline_events",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull(),
    type: varchar("type", { length: 64 }).notNull(), // note | pipeline | status | system
    body: text("body").notNull(),
    meta: jsonb("meta"),
    createdBy: varchar("created_by", { length: 128 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("IDX_org_timeline_org").on(table.organizationId)],
);

export type OrgTimelineEvent = typeof orgTimelineEvents.$inferSelect;

/** Field Kit members (distinct from Replit Auth users table) */
export const clientMembers = pgTable(
  "client_members",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    passwordHash: text("password_hash"),
    name: varchar("name", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }),
    role: varchar("role", { length: 32 }).notNull().default("member"), // member | org_admin | platform_admin
    organizationId: integer("organization_id").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("invited"), // invited | active | disabled
    /** Onboarding profile */
    jobRole: varchar("job_role", { length: 64 }), // rep | director | vp | owner | other
    territoryNote: text("territory_note"),
    topObjections: text("top_objections"),
    /** Checklist keys → completed boolean or ISO timestamp string */
    checklistProgress: jsonb("checklist_progress").$type<Record<string, boolean | string>>().default({}),
    onboardingStartedAt: timestamp("onboarding_started_at"),
    termsAcceptedAt: timestamp("terms_accepted_at"),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("IDX_client_members_org").on(table.organizationId)],
);

export type ClientMember = typeof clientMembers.$inferSelect;
export type InsertClientMember = typeof clientMembers.$inferInsert;

/** Browser / mobile sessions for Field Kit auth */
export const clientSessions = pgTable(
  "client_sessions",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id").notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("IDX_client_sessions_member").on(table.memberId),
    index("IDX_client_sessions_expires").on(table.expiresAt),
  ],
);

export type ClientSession = typeof clientSessions.$inferSelect;

/** Evaluation / client access intake requests */
export const accessRequests = pgTable("access_requests", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 32 }).notNull().default("individual"), // individual | company
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  companyName: varchar("company_name", { length: 255 }),
  jobTitle: varchar("job_title", { length: 255 }),
  role: varchar("role", { length: 64 }),
  teamSize: varchar("team_size", { length: 64 }),
  primaryGoal: varchar("primary_goal", { length: 128 }),
  market: varchar("market", { length: 255 }),
  message: text("message"),
  seatsRequested: integer("seats_requested").default(1),
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending | approved | rejected
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by", { length: 128 }),
  resultingMemberId: integer("resulting_member_id"),
  resultingOrgId: integer("resulting_org_id"),
});

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = typeof accessRequests.$inferInsert;

export const insertAccessRequestSchema = createInsertSchema(accessRequests).omit({
  id: true,
  status: true,
  adminNote: true,
  createdAt: true,
  reviewedAt: true,
  reviewedBy: true,
  resultingMemberId: true,
  resultingOrgId: true,
});

/** One-time tokens: set-password, reset-password, invite accept */
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id").notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
    purpose: varchar("purpose", { length: 32 }).notNull(), // set_password | reset_password | invite
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("IDX_auth_tokens_member").on(table.memberId)],
);

export type AuthToken = typeof authTokens.$inferSelect;

export const orgInvites = pgTable("org_invites", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: varchar("role", { length: 32 }).notNull().default("member"),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending | accepted | revoked
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrgInvite = typeof orgInvites.$inferSelect;

export const authEvents = pgTable("auth_events", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id"),
  type: varchar("type", { length: 64 }).notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuthEvent = typeof authEvents.$inferSelect;

// ── Request / response Zod (API validation) ──────────────────────────

export const requestAccessBodySchema = z.object({
  type: z.enum(["individual", "company"]).default("individual"),
  name: z.string().min(2).max(255),
  email: z.string().email().max(320),
  companyName: z.string().max(255).optional(),
  jobTitle: z.string().max(255).optional(),
  role: z.string().max(64).optional(),
  teamSize: z.string().max(64).optional(),
  primaryGoal: z.string().max(128).optional(),
  market: z.string().max(255).optional(),
  message: z.string().max(5000).optional(),
  seatsRequested: z.number().int().min(1).max(500).optional(),
  acceptTerms: z.literal(true),
  noPhi: z.literal(true),
});

export type RequestAccessBody = z.infer<typeof requestAccessBodySchema>;

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const setPasswordBodySchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
  acceptTerms: z.literal(true),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().email(),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export const approveAccessBodySchema = z.object({
  trialHours: z.number().int().min(1).max(720).optional(),
  seats: z.number().int().min(1).max(500).optional(),
  adminNote: z.string().max(2000).optional(),
});

export const rejectAccessBodySchema = z.object({
  adminNote: z.string().max(2000).optional(),
});

export const orgStatusBodySchema = z.object({
  status: z.enum(["trial", "active", "expired", "suspended"]),
  trialHours: z.number().int().min(1).max(720).optional(),
  notes: z.string().max(2000).optional(),
});

export const inviteMemberBodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(255),
  role: z.enum(["member", "org_admin"]).default("member"),
});

export const magicLinkRequestSchema = z.object({
  email: z.string().email(),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const extendEvaluationBodySchema = z.object({
  message: z.string().max(5000).optional(),
});

export const adminBootstrapBodySchema = z.object({
  adminPassword: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(2).max(255),
  /** Login password for the platform admin account (can match unlock passcode). */
  password: z.string().min(4).max(128),
});

export const adminLegacyLoginBodySchema = z.object({
  password: z.string().min(1),
});

export const orgPipelineBodySchema = z.object({
  pipelineStatus: z.enum(["prospect", "trial", "follow_up", "won", "lost", "churned"]),
  nextFollowUpAt: z.string().datetime().optional().nullable(),
  lostReason: z.string().max(2000).optional().nullable(),
});

export const orgNoteBodySchema = z.object({
  body: z.string().min(1).max(5000),
});

export const orgUpdateBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  seatLimit: z.number().int().min(1).max(500).optional(),
  notes: z.string().max(10000).optional().nullable(),
});

export const CHECKLIST_IDS = [
  "objection",
  "weekly_plan",
  "roleplay",
  "debrief",
  "director_scorecard",
] as const;

export const onboardingUpdateSchema = z.object({
  jobRole: z.enum(["rep", "director", "vp", "owner", "other"]).optional().nullable(),
  territoryNote: z.string().max(2000).optional().nullable(),
  topObjections: z.string().max(2000).optional().nullable(),
  checklist: z
    .record(z.string(), z.union([z.boolean(), z.string()]))
    .optional(),
  /** Mark a single checklist item done/undone */
  checklistItem: z
    .object({
      id: z.enum(CHECKLIST_IDS),
      done: z.boolean(),
    })
    .optional(),
});
