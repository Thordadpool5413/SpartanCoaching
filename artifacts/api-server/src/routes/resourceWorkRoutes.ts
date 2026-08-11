/**
 * Executable resource work API (HSP-26 Slice A).
 *
 * Endpoints (3):
 *   GET  /api/v1/resource-work
 *   GET  /api/v1/resource-work/:resourceKey
 *   PUT  /api/v1/resource-work/:resourceKey
 *
 * Also:
 *   GET  /api/v1/executable-resources  — catalog detail metadata (counts as catalog, not work CRUD)
 *
 * Wait - budget says max 3 new API endpoints. Stick to 3:
 *   GET /api/v1/resource-work — list mine (+ optional ?catalog=1 embeds executable list)
 *   GET /api/v1/resource-work/:resourceKey
 *   PUT /api/v1/resource-work/:resourceKey
 */
import type { Express } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { resourceWork } from "@workspace/db";
import { db } from "../db";
import { requireFieldKit, type AuthedRequest } from "../auth/middleware";
import { lightAiLimit } from "../rateLimits";
import {
  getExecutableDefinition,
  listExecutableResources,
  resourceDetailFromExecutable,
  validateResourceWorkSave,
} from "../resources/executableResources";

const putBodySchema = z
  .object({
    formData: z.record(z.string(), z.unknown()).optional(),
    status: z.enum(["draft", "completed"]).optional(),
    title: z.string().trim().max(300).optional(),
    resourceId: z.number().int().positive().nullable().optional(),
  })
  .strict();

function memberContext(req: AuthedRequest): {
  organizationId: number;
  memberId: number;
} | null {
  const memberId = req.clientMemberId ?? req.fieldKit?.member?.id;
  const organizationId = req.fieldKit?.member?.organizationId;
  if (
    typeof memberId !== "number" ||
    memberId < 1 ||
    typeof organizationId !== "number" ||
    organizationId < 1
  ) {
    return null;
  }
  return { memberId, organizationId };
}

function publicWork(row: typeof resourceWork.$inferSelect) {
  return {
    id: row.id,
    resourceKey: row.resourceKey,
    resourceId: row.resourceId,
    title: row.title,
    status: row.status,
    formSchemaVersion: row.formSchemaVersion,
    formData: row.formData ?? {},
    lastError: row.lastError,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt,
  };
}

export function registerResourceWorkRoutes(app: Express): void {
  /**
   * List member's saved work. Query includeCatalog=1 also returns executable definitions.
   */
  app.get(
    "/api/v1/resource-work",
    requireFieldKit,
    lightAiLimit,
    async (req, res) => {
      try {
        const ctx = memberContext(req as AuthedRequest);
        if (!ctx) {
          res.status(401).json({
            error: { code: "UNAUTHORIZED", message: "Membership session required." },
          });
          return;
        }

        const rows = await db
          .select()
          .from(resourceWork)
          .where(
            and(
              eq(resourceWork.organizationId, ctx.organizationId),
              eq(resourceWork.memberId, ctx.memberId),
            ),
          )
          .orderBy(desc(resourceWork.updatedAt))
          .limit(100);

        const includeCatalog =
          String(req.query.includeCatalog || "") === "1" ||
          String(req.query.includeCatalog || "") === "true";

        res.json({
          items: rows.map(publicWork),
          ...(includeCatalog
            ? {
                executableResources: listExecutableResources().map((d) =>
                  resourceDetailFromExecutable(d.resourceKey),
                ),
              }
            : {}),
        });
      } catch (error) {
        console.error("resource-work list failed:", error);
        res.status(500).json({
          error: {
            code: "LIST_FAILED",
            message: "Could not list saved resource work.",
          },
        });
      }
    },
  );

  /** Get one work item + executable detail for resume UX. */
  app.get(
    "/api/v1/resource-work/:resourceKey",
    requireFieldKit,
    lightAiLimit,
    async (req, res) => {
      try {
        const ctx = memberContext(req as AuthedRequest);
        if (!ctx) {
          res.status(401).json({
            error: { code: "UNAUTHORIZED", message: "Membership session required." },
          });
          return;
        }
        const resourceKey = String(req.params.resourceKey || "")
          .trim()
          .slice(0, 120);
        if (!resourceKey) {
          res.status(400).json({
            error: { code: "INVALID_KEY", message: "resourceKey required." },
          });
          return;
        }

        const def = getExecutableDefinition(resourceKey);
        const [row] = await db
          .select()
          .from(resourceWork)
          .where(
            and(
              eq(resourceWork.organizationId, ctx.organizationId),
              eq(resourceWork.memberId, ctx.memberId),
              eq(resourceWork.resourceKey, resourceKey),
            ),
          )
          .limit(1);

        res.json({
          detail: def ? resourceDetailFromExecutable(resourceKey) : null,
          work: row ? publicWork(row) : null,
        });
      } catch (error) {
        console.error("resource-work get failed:", error);
        res.status(500).json({
          error: {
            code: "GET_FAILED",
            message: "Could not load resource work.",
          },
        });
      }
    },
  );

  /** Upsert draft/completed work for this member only. */
  app.put(
    "/api/v1/resource-work/:resourceKey",
    requireFieldKit,
    lightAiLimit,
    async (req, res) => {
      try {
        const ctx = memberContext(req as AuthedRequest);
        if (!ctx) {
          res.status(401).json({
            error: { code: "UNAUTHORIZED", message: "Membership session required." },
          });
          return;
        }
        const resourceKey = String(req.params.resourceKey || "")
          .trim()
          .slice(0, 120);
        const def = getExecutableDefinition(resourceKey);
        if (!def) {
          res.status(404).json({
            error: {
              code: "UNKNOWN_RESOURCE",
              message: "Executable resource not found.",
            },
          });
          return;
        }

        const parsed = putBodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Invalid work payload.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }

        const validated = validateResourceWorkSave(resourceKey, {
          formData: parsed.data.formData,
          status: parsed.data.status,
          title: parsed.data.title,
        });
        if (!validated.ok && validated.errors.includes("UNKNOWN_RESOURCE_KEY")) {
          res.status(404).json({
            error: { code: "UNKNOWN_RESOURCE", message: "Unknown resource key." },
          });
          return;
        }

        const title =
          (parsed.data.title || def.title).trim().slice(0, 300) || def.title;
        const now = new Date();
        const completedAt =
          validated.status === "completed" ? now : null;

        const [existing] = await db
          .select()
          .from(resourceWork)
          .where(
            and(
              eq(resourceWork.organizationId, ctx.organizationId),
              eq(resourceWork.memberId, ctx.memberId),
              eq(resourceWork.resourceKey, resourceKey),
            ),
          )
          .limit(1);

        let row: typeof resourceWork.$inferSelect;
        if (existing) {
          const [updated] = await db
            .update(resourceWork)
            .set({
              title,
              status: validated.status,
              formSchemaVersion: def.formSchemaVersion,
              formData: validated.sanitizedFormData,
              resourceId:
                parsed.data.resourceId === undefined
                  ? existing.resourceId
                  : parsed.data.resourceId,
              lastError:
                validated.errors.length > 0
                  ? validated.errors.join(",")
                  : null,
              updatedAt: now,
              completedAt:
                validated.status === "completed"
                  ? completedAt
                  : existing.completedAt && validated.status === "draft"
                    ? null
                    : existing.completedAt,
            })
            .where(
              and(
                eq(resourceWork.id, existing.id),
                eq(resourceWork.organizationId, ctx.organizationId),
                eq(resourceWork.memberId, ctx.memberId),
              ),
            )
            .returning();
          row = updated;
        } else {
          const [created] = await db
            .insert(resourceWork)
            .values({
              organizationId: ctx.organizationId,
              memberId: ctx.memberId,
              resourceKey,
              resourceId: parsed.data.resourceId ?? def.catalogResourceId,
              title,
              status: validated.status,
              formSchemaVersion: def.formSchemaVersion,
              formData: validated.sanitizedFormData,
              lastError:
                validated.errors.length > 0
                  ? validated.errors.join(",")
                  : null,
              completedAt,
            })
            .returning();
          row = created;
        }

        res.json({
          work: publicWork(row),
          detail: resourceDetailFromExecutable(resourceKey),
          validation: {
            status: validated.status,
            errors: validated.errors,
          },
          success: true,
        });
      } catch (error) {
        console.error("resource-work put failed:", error);
        res.status(500).json({
          error: {
            code: "SAVE_FAILED",
            message: "Could not save resource work.",
          },
        });
      }
    },
  );
}
