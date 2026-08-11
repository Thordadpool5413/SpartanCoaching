/**
 * Resource lifecycle admin + public version notices (HSP-27 Slice A).
 *
 * Endpoints (3):
 *   GET  /api/v1/resources/:id/lifecycle
 *   GET  /api/v1/resources/:id/lifecycle/history
 *   POST /api/v1/resources/:id/lifecycle/transition
 */
import type { Express } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  resources,
  resourceLifecycleEvents,
  type SelectResource,
} from "@workspace/db";
import { db } from "../db";
import { requireAdmin, type AuthedRequest } from "../auth/middleware";
import { lightAiLimit } from "../rateLimits";
import { presentResource } from "../resources/resourceArchitecture";
import {
  defaultSeriesKey,
  newerVersionNotice,
  normalizeLifecycleStatus,
  planLifecycleTransition,
  type LifecycleAction,
  type LifecycleResourceSnapshot,
} from "../resources/resourceLifecycle";

const transitionBodySchema = z
  .object({
    action: z.enum([
      "create_draft",
      "submit_review",
      "publish",
      "archive",
      "retire",
      "restore_draft",
      "publish_new_version",
      "update_metadata",
    ]),
    note: z.string().trim().max(2_000).optional(),
    actorLabel: z.string().trim().max(200).optional(),
    newVersion: z
      .object({
        versionLabel: z.string().trim().min(1).max(32),
        fileUrl: z.string().trim().min(1).max(1_000),
        title: z.string().trim().max(300).optional(),
        description: z.string().trim().max(4_000).optional().nullable(),
        category: z.string().trim().max(80).optional(),
      })
      .optional(),
  })
  .strict();

function toSnapshot(row: SelectResource): LifecycleResourceSnapshot {
  const arch = row.contentArchitecture;
  return {
    id: row.id,
    title: row.title,
    fileUrl: row.fileUrl,
    seriesKey: row.seriesKey ?? null,
    versionLabel: row.versionLabel ?? "1.0",
    lifecycleStatus: row.lifecycleStatus ?? "published",
    isCurrent: row.isCurrent ?? true,
    supersededById: row.supersededById ?? null,
    contentOwner: arch?.contentOwner ?? arch?.author ?? null,
    reviewer: arch?.reviewer ?? null,
    publishedAt: arch?.publishedAt ?? null,
    reviewedAt: arch?.reviewedAt ?? null,
    reviewDueAt: arch?.reviewDueAt ?? null,
  };
}

async function loadAllSnapshots(): Promise<LifecycleResourceSnapshot[]> {
  const rows = await db.select().from(resources);
  return rows.map(toSnapshot);
}

export function registerResourceLifecycleRoutes(app: Express): void {
  /** Public-readable version notice + lifecycle summary (no secrets). */
  app.get(
    "/api/v1/resources/:id/lifecycle",
    lightAiLimit,
    async (req, res) => {
      try {
        const id = parseInt(String(req.params.id), 10);
        if (!Number.isFinite(id) || id < 1) {
          res.status(400).json({
            error: { code: "INVALID_ID", message: "Invalid resource id." },
          });
          return;
        }
        const [row] = await db
          .select()
          .from(resources)
          .where(eq(resources.id, id))
          .limit(1);
        if (!row) {
          res.status(404).json({
            error: { code: "NOT_FOUND", message: "Resource not found." },
          });
          return;
        }
        const all = await loadAllSnapshots();
        const snap = toSnapshot(row);
        const notice = newerVersionNotice(snap, all);
        const seriesKey = snap.seriesKey || defaultSeriesKey(snap.id);
        const series = all
          .filter((r) => (r.seriesKey || defaultSeriesKey(r.id)) === seriesKey)
          .sort((a, b) => b.id - a.id)
          .map((r) => ({
            id: r.id,
            versionLabel: r.versionLabel || "1.0",
            lifecycleStatus: normalizeLifecycleStatus(r.lifecycleStatus),
            isCurrent: r.isCurrent !== false,
            title: r.title,
          }));

        res.json({
          resource: presentResource(row),
          lifecycle: {
            seriesKey,
            versionLabel: snap.versionLabel || "1.0",
            status: normalizeLifecycleStatus(snap.lifecycleStatus),
            isCurrent: snap.isCurrent !== false,
            contentOwner: snap.contentOwner,
            reviewer: snap.reviewer,
            publishedAt: snap.publishedAt,
            reviewedAt: snap.reviewedAt,
            reviewDueAt: snap.reviewDueAt,
            documentVersionLine: notice.documentVersionLine,
            hasNewerVersion: notice.hasNewerVersion,
            currentVersion: notice.currentVersion,
            isSuperseded: notice.isSuperseded,
            series,
          },
        });
      } catch (error) {
        console.error("resource lifecycle get failed:", error);
        res.status(500).json({
          error: {
            code: "LIFECYCLE_GET_FAILED",
            message: "Could not load resource lifecycle.",
          },
        });
      }
    },
  );

  /** Admin audit history. */
  app.get(
    "/api/v1/resources/:id/lifecycle/history",
    requireAdmin,
    lightAiLimit,
    async (req, res) => {
      try {
        const id = parseInt(String(req.params.id), 10);
        if (!Number.isFinite(id) || id < 1) {
          res.status(400).json({
            error: { code: "INVALID_ID", message: "Invalid resource id." },
          });
          return;
        }
        const events = await db
          .select()
          .from(resourceLifecycleEvents)
          .where(eq(resourceLifecycleEvents.resourceId, id))
          .orderBy(desc(resourceLifecycleEvents.createdAt))
          .limit(100);
        res.json({
          resourceId: id,
          events: events.map((e) => ({
            id: e.id,
            action: e.action,
            fromStatus: e.fromStatus,
            toStatus: e.toStatus,
            actorLabel: e.actorLabel,
            note: e.note,
            meta: e.meta,
            createdAt: e.createdAt,
          })),
        });
      } catch (error) {
        console.error("resource lifecycle history failed:", error);
        res.status(500).json({
          error: {
            code: "HISTORY_FAILED",
            message: "Could not load lifecycle history.",
          },
        });
      }
    },
  );

  /** Admin lifecycle transition (including publish_new_version). */
  app.post(
    "/api/v1/resources/:id/lifecycle/transition",
    requireAdmin,
    lightAiLimit,
    async (req, res) => {
      try {
        const id = parseInt(String(req.params.id), 10);
        if (!Number.isFinite(id) || id < 1) {
          res.status(400).json({
            error: { code: "INVALID_ID", message: "Invalid resource id." },
          });
          return;
        }
        const parsed = transitionBodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Invalid transition payload.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }

        const [row] = await db
          .select()
          .from(resources)
          .where(eq(resources.id, id))
          .limit(1);
        if (!row) {
          res.status(404).json({
            error: { code: "NOT_FOUND", message: "Resource not found." },
          });
          return;
        }

        const plan = planLifecycleTransition({
          resource: toSnapshot(row),
          action: parsed.data.action as LifecycleAction,
          note: parsed.data.note,
          newVersion: parsed.data.newVersion,
        });
        if (!plan.ok) {
          res.status(409).json({
            error: { code: plan.code, message: plan.message },
          });
          return;
        }

        const actorLabel =
          parsed.data.actorLabel ||
          (req as AuthedRequest).fieldKit?.member?.email ||
          "admin";

        let newResource: SelectResource | null = null;

        if (plan.createNewVersion) {
          const nv = plan.createNewVersion;
          const arch = {
            ...(row.contentArchitecture || {}),
            contentVersion: nv.versionLabel,
            status: "published" as const,
            lifecycleStatus: "published" as const,
            publishedAt: new Date().toISOString(),
            contentOwner:
              row.contentArchitecture?.contentOwner ||
              row.contentArchitecture?.author,
            versionLabel: nv.versionLabel,
            isCurrent: true,
          };
          const [created] = await db
            .insert(resources)
            .values({
              title: nv.title,
              description: nv.description ?? row.description,
              fileUrl: nv.fileUrl,
              category: nv.category || row.category,
              seriesKey: nv.seriesKey,
              versionLabel: nv.versionLabel,
              lifecycleStatus: "published",
              isCurrent: true,
              supersededById: null,
              contentArchitecture: arch,
            })
            .returning();
          newResource = created;

          // Mark old as superseded pointing at new
          await db
            .update(resources)
            .set({
              lifecycleStatus: "superseded",
              isCurrent: false,
              supersededById: created.id,
              seriesKey: nv.seriesKey,
            })
            .where(eq(resources.id, id));

          await db.insert(resourceLifecycleEvents).values([
            {
              resourceId: id,
              seriesKey: nv.seriesKey,
              action: "supersede",
              fromStatus: plan.fromStatus,
              toStatus: "superseded",
              actorLabel,
              note: plan.auditNote,
              meta: { newResourceId: created.id, versionLabel: nv.versionLabel },
            },
            {
              resourceId: created.id,
              seriesKey: nv.seriesKey,
              action: "publish_new_version",
              fromStatus: null,
              toStatus: "published",
              actorLabel,
              note: plan.auditNote,
              meta: { supersedesResourceId: id, versionLabel: nv.versionLabel },
            },
          ]);
        } else {
          const patch = plan.patchSource;
          const arch = {
            ...(row.contentArchitecture || {}),
            status:
              plan.toStatus === "in_review"
                ? ("review_required" as const)
                : plan.toStatus === "published"
                  ? ("published" as const)
                  : plan.toStatus === "archived" || plan.toStatus === "retired"
                    ? ("archived" as const)
                    : plan.toStatus === "draft"
                      ? ("draft" as const)
                      : row.contentArchitecture?.status,
            lifecycleStatus: plan.toStatus,
            publishedAt:
              plan.toStatus === "published"
                ? new Date().toISOString()
                : row.contentArchitecture?.publishedAt,
            contentVersion:
              patch.versionLabel ||
              row.versionLabel ||
              row.contentArchitecture?.contentVersion,
          };
          await db
            .update(resources)
            .set({
              lifecycleStatus: patch.lifecycleStatus ?? row.lifecycleStatus,
              isCurrent:
                patch.isCurrent !== undefined ? patch.isCurrent : row.isCurrent,
              seriesKey: patch.seriesKey ?? row.seriesKey,
              versionLabel: patch.versionLabel ?? row.versionLabel,
              supersededById:
                patch.supersededById !== undefined
                  ? patch.supersededById
                  : row.supersededById,
              contentArchitecture: arch,
            })
            .where(eq(resources.id, id));

          await db.insert(resourceLifecycleEvents).values({
            resourceId: id,
            seriesKey: patch.seriesKey ?? row.seriesKey,
            action: plan.action,
            fromStatus: plan.fromStatus,
            toStatus: plan.toStatus,
            actorLabel,
            note: plan.auditNote,
            meta: null,
          });
        }

        const [fresh] = await db
          .select()
          .from(resources)
          .where(eq(resources.id, newResource?.id ?? id))
          .limit(1);
        const [oldFresh] = newResource
          ? await db.select().from(resources).where(eq(resources.id, id)).limit(1)
          : [null];

        res.json({
          success: true,
          action: plan.action,
          resource: fresh ? presentResource(fresh) : null,
          supersededResource: oldFresh ? presentResource(oldFresh) : null,
          newResourceId: newResource?.id ?? null,
        });
      } catch (error) {
        console.error("resource lifecycle transition failed:", error);
        res.status(500).json({
          error: {
            code: "TRANSITION_FAILED",
            message: "Could not apply lifecycle transition.",
          },
        });
      }
    },
  );
}
