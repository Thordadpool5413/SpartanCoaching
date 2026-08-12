/**
 * Provider-owned resource library API (HSP-28 Slice A).
 *
 * Endpoints (3):
 *   GET   /api/v1/provider-resources
 *   POST  /api/v1/provider-resources
 *   PATCH /api/v1/provider-resources/:id
 *
 * Isolation: organizationId always from session — never from client body.
 */
import type { Express } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { providerResources } from "@workspace/db";
import { db } from "../db";
import {
  requireFieldKit,
  requireOrgAdmin,
  type AuthedRequest,
} from "../auth/middleware";
import { lightAiLimit } from "../rateLimits";
import {
  allowedTransitions,
  assertProviderResourceOrgAccess,
  canManageProviderLibrary,
  canViewProviderResource,
  matchesSearch,
  normalizeKind,
  normalizeStatus,
  presentProviderResource,
  sanitizeFileUrl,
  sanitizeMeta,
  PROVIDER_RESOURCE_KINDS,
  PROVIDER_RESOURCE_LIBRARY_VERSION,
  type ProviderResourceStatusId,
} from "../resources/providerResourceLibrary";

const createBodySchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    description: z.string().trim().max(4_000).optional().nullable(),
    fileUrl: z.string().trim().min(1).max(1000),
    kind: z.string().trim().max(64).optional(),
    status: z
      .enum(["draft", "in_review", "published", "archived"])
      .optional(),
    meta: z.record(z.string(), z.unknown()).optional().nullable(),
  })
  .strict();

const patchBodySchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    description: z.string().trim().max(4_000).optional().nullable(),
    fileUrl: z.string().trim().min(1).max(1000).optional(),
    kind: z.string().trim().max(64).optional(),
    status: z
      .enum(["draft", "in_review", "published", "archived", "deleted"])
      .optional(),
    meta: z.record(z.string(), z.unknown()).optional().nullable(),
  })
  .strict();

function sessionContext(req: AuthedRequest): {
  organizationId: number;
  memberId: number;
  isOrgAdmin: boolean;
} | null {
  const memberId = req.clientMemberId ?? req.fieldKit?.member?.id;
  const organizationId = req.fieldKit?.member?.organizationId;
  const role = req.fieldKit?.member?.role;
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
    isOrgAdmin: role === "org_admin" || role === "platform_admin",
  };
}

export function registerProviderResourceRoutes(app: Express): void {
  /**
   * List provider library for the session organization.
   * Query: q (search), status, kind, includeCoreLabels=1 (metadata only).
   */
  app.get(
    "/api/v1/provider-resources",
    requireFieldKit,
    lightAiLimit,
    async (req, res) => {
      try {
        const ctx = sessionContext(req as AuthedRequest);
        if (!ctx) {
          res.status(401).json({
            error: {
              code: "UNAUTHORIZED",
              message: "Membership session required.",
            },
          });
          return;
        }

        const rows = await db
          .select()
          .from(providerResources)
          .where(
            and(
              eq(providerResources.organizationId, ctx.organizationId),
              isNull(providerResources.deletedAt),
            ),
          )
          .orderBy(desc(providerResources.updatedAt))
          .limit(200);

        const q = typeof req.query.q === "string" ? req.query.q : "";
        const statusFilter =
          typeof req.query.status === "string" ? req.query.status : "";
        const kindFilter =
          typeof req.query.kind === "string" ? req.query.kind : "";

        const items = rows
          .filter((r) => canViewProviderResource(r.status, ctx.isOrgAdmin))
          .filter((r) =>
            statusFilter ? normalizeStatus(r.status) === statusFilter : true,
          )
          .filter((r) =>
            kindFilter ? normalizeKind(r.kind) === kindFilter : true,
          )
          .filter((r) =>
            matchesSearch(
              {
                title: r.title,
                description: r.description,
                kind: r.kind,
                meta: (r.meta as Record<string, unknown> | null) ?? null,
              },
              q,
            ),
          )
          .map((r) =>
            presentProviderResource({
              ...r,
              meta: (r.meta as Record<string, unknown> | null) ?? null,
            }),
          );

        res.json({
          libraryVersion: PROVIDER_RESOURCE_LIBRARY_VERSION,
          organizationId: ctx.organizationId,
          canManage: canManageProviderLibrary(ctx.isOrgAdmin),
          kinds: PROVIDER_RESOURCE_KINDS,
          items,
          /** Core library is separate (/api/resources) — label for UI composition. */
          coreLibrary: {
            ownership: "core",
            ownershipLabel: "Hospice Sales Pro Core",
            listPath: "/api/resources",
          },
        });
      } catch (error) {
        console.error("provider-resources list failed:", error);
        res.status(500).json({
          error: {
            code: "LIST_FAILED",
            message: "Could not list provider resources.",
          },
        });
      }
    },
  );

  /** Create provider resource (org admin). */
  app.post(
    "/api/v1/provider-resources",
    requireFieldKit,
    requireOrgAdmin,
    lightAiLimit,
    async (req, res) => {
      try {
        const ctx = sessionContext(req as AuthedRequest);
        if (!ctx) {
          res.status(401).json({
            error: {
              code: "UNAUTHORIZED",
              message: "Membership session required.",
            },
          });
          return;
        }
        if (!canManageProviderLibrary(ctx.isOrgAdmin)) {
          res.status(403).json({
            error: {
              code: "ORG_ADMIN_REQUIRED",
              message: "Organization admin required to manage provider library.",
            },
          });
          return;
        }

        const parsed = createBodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Invalid provider resource payload.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }

        const fileUrl = sanitizeFileUrl(parsed.data.fileUrl);
        if (!fileUrl) {
          res.status(400).json({
            error: {
              code: "INVALID_FILE_URL",
              message:
                "fileUrl must be an https URL or /objects/… /resources/files/… path.",
            },
          });
          return;
        }

        const status = normalizeStatus(parsed.data.status || "draft");
        const kind = normalizeKind(parsed.data.kind || "other");
        const now = new Date();

        // Never take organizationId from body
        const [created] = await db
          .insert(providerResources)
          .values({
            organizationId: ctx.organizationId,
            title: parsed.data.title,
            description: parsed.data.description ?? null,
            fileUrl,
            kind,
            status,
            ownership: "provider",
            meta: sanitizeMeta(parsed.data.meta),
            createdByMemberId: ctx.memberId,
            updatedByMemberId: ctx.memberId,
            createdAt: now,
            updatedAt: now,
            archivedAt: status === "archived" ? now : null,
          })
          .returning();

        res.status(201).json({
          success: true,
          item: presentProviderResource({
            ...created,
            meta: (created.meta as Record<string, unknown> | null) ?? null,
          }),
        });
      } catch (error) {
        console.error("provider-resources create failed:", error);
        res.status(500).json({
          error: {
            code: "CREATE_FAILED",
            message: "Could not create provider resource.",
          },
        });
      }
    },
  );

  /** Update / archive / soft-delete (org admin). Tenant checked on load. */
  app.patch(
    "/api/v1/provider-resources/:id",
    requireFieldKit,
    requireOrgAdmin,
    lightAiLimit,
    async (req, res) => {
      try {
        const ctx = sessionContext(req as AuthedRequest);
        if (!ctx) {
          res.status(401).json({
            error: {
              code: "UNAUTHORIZED",
              message: "Membership session required.",
            },
          });
          return;
        }

        const id = parseInt(String(req.params.id), 10);
        if (!Number.isFinite(id) || id < 1) {
          res.status(400).json({
            error: { code: "INVALID_ID", message: "Invalid resource id." },
          });
          return;
        }

        const [existing] = await db
          .select()
          .from(providerResources)
          .where(eq(providerResources.id, id))
          .limit(1);

        if (!existing) {
          res.status(404).json({
            error: { code: "NOT_FOUND", message: "Provider resource not found." },
          });
          return;
        }

        const access = assertProviderResourceOrgAccess(
          existing.organizationId,
          ctx.organizationId,
        );
        if (!access.ok) {
          // Do not leak existence across tenants
          res.status(404).json({
            error: { code: "NOT_FOUND", message: "Provider resource not found." },
          });
          return;
        }

        const parsed = patchBodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Invalid update payload.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }

        const fromStatus = normalizeStatus(existing.status);
        if (fromStatus === "deleted") {
          res.status(409).json({
            error: {
              code: "ALREADY_DELETED",
              message: "Resource is deleted.",
            },
          });
          return;
        }

        let nextStatus: ProviderResourceStatusId = fromStatus;
        if (parsed.data.status) {
          nextStatus = normalizeStatus(parsed.data.status);
          const allowed = allowedTransitions(fromStatus);
          if (nextStatus !== fromStatus && !allowed.includes(nextStatus)) {
            res.status(409).json({
              error: {
                code: "INVALID_TRANSITION",
                message: `Cannot change status from ${fromStatus} to ${nextStatus}.`,
              },
            });
            return;
          }
        }

        let nextFileUrl = existing.fileUrl;
        if (parsed.data.fileUrl !== undefined) {
          const u = sanitizeFileUrl(parsed.data.fileUrl);
          if (!u) {
            res.status(400).json({
              error: {
                code: "INVALID_FILE_URL",
                message: "Invalid fileUrl.",
              },
            });
            return;
          }
          nextFileUrl = u;
        }

        const now = new Date();
        const [updated] = await db
          .update(providerResources)
          .set({
            title: parsed.data.title ?? existing.title,
            description:
              parsed.data.description !== undefined
                ? parsed.data.description
                : existing.description,
            fileUrl: nextFileUrl,
            kind:
              parsed.data.kind !== undefined
                ? normalizeKind(parsed.data.kind)
                : existing.kind,
            status: nextStatus,
            meta:
              parsed.data.meta !== undefined
                ? sanitizeMeta(parsed.data.meta)
                : existing.meta,
            updatedByMemberId: ctx.memberId,
            updatedAt: now,
            archivedAt:
              nextStatus === "archived"
                ? existing.archivedAt || now
                : nextStatus === "published" || nextStatus === "draft"
                  ? null
                  : existing.archivedAt,
            deletedAt: nextStatus === "deleted" ? now : existing.deletedAt,
          })
          .where(
            and(
              eq(providerResources.id, id),
              eq(providerResources.organizationId, ctx.organizationId),
            ),
          )
          .returning();

        res.json({
          success: true,
          item: presentProviderResource({
            ...updated,
            meta: (updated.meta as Record<string, unknown> | null) ?? null,
          }),
        });
      } catch (error) {
        console.error("provider-resources patch failed:", error);
        res.status(500).json({
          error: {
            code: "UPDATE_FAILED",
            message: "Could not update provider resource.",
          },
        });
      }
    },
  );
}
