/**
 * Notifications + preference center API (HSP-38 Slice A).
 *
 * Endpoints (3):
 *   GET  /api/v1/notifications
 *   PUT  /api/v1/notifications/preferences
 *   POST /api/v1/notifications/actions
 */
import type { Express } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  memberNotifications,
  memberNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationDeepLink,
  type NotificationType,
} from "@workspace/db";
import { db } from "../db";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { lightAiLimit } from "../rateLimits";
import {
  isTypeEnabled,
  materializeEvaluationNotification,
  normalizePreferences,
  resolveNotificationDeepLink,
  safeCopyForType,
  NOTIFICATION_TYPES,
} from "../notifications/notificationEngine";

function memberContext(req: AuthedRequest): {
  organizationId: number;
  memberId: number;
  canUseFieldKit: boolean;
  role?: string;
  trialEndsAt?: Date | string | null;
  orgStatus?: string | null;
} | null {
  const member = req.fieldKit?.member;
  const org = req.fieldKit?.org as
    | { trialEndsAt?: Date | string | null; status?: string | null }
    | undefined;
  const memberId = req.clientMemberId ?? member?.id;
  const organizationId = member?.organizationId;
  if (
    typeof memberId !== "number" ||
    memberId < 1 ||
    typeof organizationId !== "number" ||
    organizationId < 1
  ) {
    return null;
  }
  return {
    memberId,
    organizationId,
    canUseFieldKit: Boolean(req.fieldKit?.allowed),
    role: member?.role,
    trialEndsAt: org?.trialEndsAt ?? req.fieldKit?.trialEndsAt,
    orgStatus: org?.status,
  };
}

async function loadPrefs(ctx: { organizationId: number; memberId: number }) {
  const [row] = await db
    .select()
    .from(memberNotificationPrefs)
    .where(eq(memberNotificationPrefs.memberId, ctx.memberId))
    .limit(1);
  if (row) {
    return {
      rowId: row.id,
      preferences: normalizePreferences(row.preferences),
    };
  }
  return {
    rowId: null as number | null,
    preferences: normalizePreferences(DEFAULT_NOTIFICATION_PREFERENCES),
  };
}

async function savePrefs(
  ctx: { organizationId: number; memberId: number },
  preferences: ReturnType<typeof normalizePreferences>,
  rowId: number | null,
) {
  if (rowId) {
    await db
      .update(memberNotificationPrefs)
      .set({ preferences, updatedAt: new Date() })
      .where(
        and(
          eq(memberNotificationPrefs.id, rowId),
          eq(memberNotificationPrefs.memberId, ctx.memberId),
        ),
      );
  } else {
    await db.insert(memberNotificationPrefs).values({
      organizationId: ctx.organizationId,
      memberId: ctx.memberId,
      preferences,
    });
  }
}

async function ensureSystemNotifications(ctx: {
  organizationId: number;
  memberId: number;
  trialEndsAt?: Date | string | null;
  orgStatus?: string | null;
  preferences: ReturnType<typeof normalizePreferences>;
}) {
  // Evaluation expiring — idempotent via dedupeKey
  if (
    ctx.orgStatus === "trial" &&
    isTypeEnabled(ctx.preferences, "evaluation_expiration")
  ) {
    const material = materializeEvaluationNotification({
      organizationId: ctx.organizationId,
      trialEndsAt: ctx.trialEndsAt,
    });
    if (material) {
      try {
        await db
          .insert(memberNotifications)
          .values({
            organizationId: ctx.organizationId,
            memberId: ctx.memberId,
            type: material.type,
            titleSafe: material.titleSafe,
            bodySafe: material.bodySafe,
            deepLink: material.deepLink,
            dedupeKey: material.dedupeKey,
            expiresAt: material.expiresAt,
          })
          .onConflictDoNothing();
      } catch {
        // unique violation / driver without onConflict — ignore duplicates
      }
    }
  }
}

function publicNotification(row: typeof memberNotifications.$inferSelect) {
  return {
    id: row.id,
    type: row.type,
    title: row.titleSafe,
    body: row.bodySafe,
    deepLink: row.deepLink,
    readAt: row.readAt,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

const prefsBodySchema = z
  .object({
    enabled: z.boolean().optional(),
    lockScreenMinimal: z.boolean().optional(),
    channels: z
      .object({
        inApp: z.boolean().optional(),
        push: z.boolean().optional(),
        email: z.boolean().optional(),
      })
      .optional(),
    types: z.record(z.string(), z.boolean()).optional(),
    orgControls: z
      .object({
        suppressOrgContentPush: z.boolean().optional(),
        suppressCoachingPush: z.boolean().optional(),
      })
      .optional(),
  })
  .strict();

const actionsBodySchema = z
  .object({
    action: z.enum([
      "mark_read",
      "mark_all_read",
      "resolve_deep_link",
      "seed_demo",
    ]),
    id: z.number().int().positive().optional(),
    deepLink: z
      .object({
        key: z.enum([
          "command",
          "weekly_plan",
          "portal",
          "account",
          "resources",
          "tools",
          "login",
        ]),
        ref: z.string().max(120).optional(),
      })
      .optional(),
    /** For seed_demo only — which workflow type to enqueue (safe copy) */
    type: z
      .enum([
        "follow_up_due",
        "upcoming_meeting",
        "weekly_plan_incomplete",
        "assigned_coaching",
        "org_content_published",
        "important_next_action",
        "subscription_issue",
        "evaluation_expiration",
      ])
      .optional(),
  })
  .strict();

export function registerNotificationRoutes(app: Express): void {
  app.get(
    "/api/v1/notifications",
    requireAuth,
    lightAiLimit,
    async (req: AuthedRequest, res) => {
      try {
        const ctx = memberContext(req);
        if (!ctx) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const prefsState = await loadPrefs(ctx);
        await ensureSystemNotifications({
          ...ctx,
          preferences: prefsState.preferences,
        });

        const rows = await db
          .select()
          .from(memberNotifications)
          .where(
            and(
              eq(memberNotifications.memberId, ctx.memberId),
              eq(memberNotifications.organizationId, ctx.organizationId),
            ),
          )
          .orderBy(desc(memberNotifications.createdAt))
          .limit(50);

        const filtered = rows.filter((r) =>
          isTypeEnabled(prefsState.preferences, r.type as NotificationType),
        );
        const unreadCount = filtered.filter((r) => !r.readAt).length;

        res.json({
          version: "notifications-v1",
          preferences: prefsState.preferences,
          types: NOTIFICATION_TYPES,
          unreadCount,
          items: filtered.map(publicNotification),
        });
      } catch (error) {
        console.error("notifications GET failed:", error);
        res.status(500).json({ error: "Failed to load notifications" });
      }
    },
  );

  app.put(
    "/api/v1/notifications/preferences",
    requireAuth,
    lightAiLimit,
    async (req: AuthedRequest, res) => {
      try {
        const ctx = memberContext(req);
        if (!ctx) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const body = prefsBodySchema.parse(req.body ?? {});
        const loaded = await loadPrefs(ctx);
        let next = { ...loaded.preferences };

        if (typeof body.enabled === "boolean") next.enabled = body.enabled;
        if (typeof body.lockScreenMinimal === "boolean") {
          next.lockScreenMinimal = body.lockScreenMinimal;
        }
        if (body.channels) {
          next.channels = {
            inApp:
              typeof body.channels.inApp === "boolean"
                ? body.channels.inApp
                : next.channels.inApp,
            push:
              typeof body.channels.push === "boolean"
                ? body.channels.push
                : next.channels.push,
            email:
              typeof body.channels.email === "boolean"
                ? body.channels.email
                : next.channels.email,
          };
        }
        if (body.types) {
          for (const t of NOTIFICATION_TYPES) {
            if (typeof body.types[t] === "boolean") {
              next.types[t] = body.types[t]!;
            }
          }
        }
        // Org controls only for org_admin / platform_admin
        if (body.orgControls) {
          const role = ctx.role;
          if (role === "org_admin" || role === "platform_admin") {
            next.orgControls = {
              suppressOrgContentPush:
                typeof body.orgControls.suppressOrgContentPush === "boolean"
                  ? body.orgControls.suppressOrgContentPush
                  : next.orgControls?.suppressOrgContentPush,
              suppressCoachingPush:
                typeof body.orgControls.suppressCoachingPush === "boolean"
                  ? body.orgControls.suppressCoachingPush
                  : next.orgControls?.suppressCoachingPush,
            };
          }
        }

        next = normalizePreferences(next);
        await savePrefs(ctx, next, loaded.rowId);
        res.json({ preferences: next });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: "Invalid body", details: error.flatten() });
        }
        console.error("notifications preferences PUT failed:", error);
        res.status(500).json({ error: "Failed to save preferences" });
      }
    },
  );

  app.post(
    "/api/v1/notifications/actions",
    requireAuth,
    lightAiLimit,
    async (req: AuthedRequest, res) => {
      try {
        const ctx = memberContext(req);
        if (!ctx) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const body = actionsBodySchema.parse(req.body ?? {});

        if (body.action === "mark_read") {
          if (!body.id) {
            return res.status(400).json({ error: "id required" });
          }
          await db
            .update(memberNotifications)
            .set({ readAt: new Date() })
            .where(
              and(
                eq(memberNotifications.id, body.id),
                eq(memberNotifications.memberId, ctx.memberId),
                eq(memberNotifications.organizationId, ctx.organizationId),
              ),
            );
          return res.json({ ok: true });
        }

        if (body.action === "mark_all_read") {
          await db
            .update(memberNotifications)
            .set({ readAt: new Date() })
            .where(
              and(
                eq(memberNotifications.memberId, ctx.memberId),
                eq(memberNotifications.organizationId, ctx.organizationId),
                isNull(memberNotifications.readAt),
              ),
            );
          return res.json({ ok: true });
        }

        if (body.action === "resolve_deep_link") {
          let deepLink = body.deepLink as NotificationDeepLink | undefined;
          let notificationOrgId: number | undefined = ctx.organizationId;
          if (body.id) {
            const [row] = await db
              .select()
              .from(memberNotifications)
              .where(
                and(
                  eq(memberNotifications.id, body.id),
                  eq(memberNotifications.memberId, ctx.memberId),
                ),
              )
              .limit(1);
            if (!row) {
              return res.status(404).json({
                error: "Notification not found",
                code: "TARGET_DELETED",
              });
            }
            deepLink = row.deepLink;
            notificationOrgId = row.organizationId;
            if (!row.readAt) {
              await db
                .update(memberNotifications)
                .set({ readAt: new Date() })
                .where(eq(memberNotifications.id, row.id));
            }
          }
          const resolved = resolveNotificationDeepLink(deepLink, {
            authenticated: true,
            canUseFieldKit: ctx.canUseFieldKit,
            organizationId: ctx.organizationId,
            notificationOrganizationId: notificationOrgId,
            targetExists: true,
          });
          return res.json({ resolved });
        }

        if (body.action === "seed_demo") {
          // Test/demo: enqueue one safe notification (duplicate-safe)
          const type = (body.type || "important_next_action") as NotificationType;
          const copy = safeCopyForType(type);
          const dedupeKey = `${type}:demo:${new Date().toISOString().slice(0, 13)}`;
          try {
            await db.insert(memberNotifications).values({
              organizationId: ctx.organizationId,
              memberId: ctx.memberId,
              type,
              titleSafe: copy.titleSafe,
              bodySafe: copy.bodySafe,
              deepLink: copy.deepLink,
              dedupeKey,
            });
          } catch {
            // duplicate hour key
          }
          return res.json({ ok: true, dedupeKey });
        }

        res.status(400).json({ error: "Unknown action" });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: "Invalid body", details: error.flatten() });
        }
        console.error("notifications actions failed:", error);
        res.status(500).json({ error: "Failed to process notification action" });
      }
    },
  );
}
