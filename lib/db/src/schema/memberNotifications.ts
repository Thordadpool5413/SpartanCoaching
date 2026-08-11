/**
 * In-app notifications + preference center (HSP-38).
 * Tenant-scoped; lock-screen copy must stay free of PHI / facility names.
 */
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export type NotificationType =
  | "follow_up_due"
  | "upcoming_meeting"
  | "weekly_plan_incomplete"
  | "assigned_coaching"
  | "org_content_published"
  | "important_next_action"
  | "subscription_issue"
  | "evaluation_expiration";

export type NotificationChannelPrefs = {
  inApp: boolean;
  push: boolean;
  email: boolean;
};

export type NotificationPreferences = {
  schemaVersion: 1;
  /** Master kill switch */
  enabled: boolean;
  /** Never put account/patient detail on lock screens / banners */
  lockScreenMinimal: boolean;
  channels: NotificationChannelPrefs;
  types: Record<NotificationType, boolean>;
  /** Org admins may suppress certain org-wide types for their seats */
  orgControls?: {
    suppressOrgContentPush?: boolean;
    suppressCoachingPush?: boolean;
  };
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  schemaVersion: 1,
  enabled: true,
  lockScreenMinimal: true,
  channels: { inApp: true, push: true, email: false },
  types: {
    follow_up_due: true,
    upcoming_meeting: true,
    weekly_plan_incomplete: true,
    assigned_coaching: true,
    org_content_published: true,
    important_next_action: true,
    subscription_issue: true,
    evaluation_expiration: true,
  },
  orgControls: {
    suppressOrgContentPush: false,
    suppressCoachingPush: false,
  },
};

export type NotificationDeepLink = {
  /** Stable route key resolved server-side */
  key:
    | "command"
    | "weekly_plan"
    | "portal"
    | "account"
    | "resources"
    | "tools"
    | "login";
  /** Optional opaque id — never PHI */
  ref?: string;
};

export const memberNotificationPrefs = pgTable(
  "member_notification_prefs",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    preferences: jsonb("preferences")
      .$type<NotificationPreferences>()
      .notNull()
      .default(DEFAULT_NOTIFICATION_PREFERENCES),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("member_notification_prefs_member_uidx").on(table.memberId),
    index("member_notification_prefs_org_idx").on(table.organizationId),
  ],
);

export const memberNotifications = pgTable(
  "member_notifications",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull(),
    memberId: integer("member_id").notNull(),
    type: varchar("type", { length: 64 }).notNull(),
    /** Lock-screen / banner safe — no PHI, no facility names */
    titleSafe: varchar("title_safe", { length: 200 }).notNull(),
    bodySafe: text("body_safe").notNull(),
    deepLink: jsonb("deep_link").$type<NotificationDeepLink>().notNull(),
    /** Prevents duplicate delivery for the same logical event */
    dedupeKey: varchar("dedupe_key", { length: 200 }).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("member_notifications_dedupe_uidx").on(
      table.memberId,
      table.dedupeKey,
    ),
    index("member_notifications_member_created_idx").on(
      table.memberId,
      table.createdAt,
    ),
    index("member_notifications_org_idx").on(table.organizationId),
  ],
);

export type MemberNotificationRow = typeof memberNotifications.$inferSelect;
export type MemberNotificationPrefsRow = typeof memberNotificationPrefs.$inferSelect;
