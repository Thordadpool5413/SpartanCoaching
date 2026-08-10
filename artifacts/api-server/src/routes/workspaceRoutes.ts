import type { Express } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { memberWorkspaceItems } from "@workspace/db";
import { db } from "../db";
import { requireAuth, requireFieldKit, type AuthedRequest } from "../auth/middleware";
import { resolveWorkspaceWrite } from "../sync/workspaceConflict";
import { authLimit } from "../rateLimits";

const kindSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_]*$/);

const upsertBodySchema = z.object({
  kind: kindSchema,
  title: z.string().max(500).optional().nullable(),
  payload: z.record(z.unknown()),
  baseVersion: z.number().int().min(0),
  clientUpdatedAtMs: z.number().int().min(0),
});

const WORKSPACE_KINDS = new Set([
  "saved_response",
  "preference",
  "next_action",
  "plan_draft",
]);

function publicItem(row: typeof memberWorkspaceItems.$inferSelect) {
  return {
    id: row.id,
    kind: row.kind,
    clientKey: row.clientKey,
    title: row.title,
    payload: row.payload,
    version: row.version,
    clientUpdatedAtMs: row.clientUpdatedAtMs,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

export function registerWorkspaceRoutes(app: Express): void {
  /**
   * GET /api/workspace/items?kind=saved_response
   * List non-deleted workspace items for the signed-in member (tenant-scoped).
   */
  app.get(
    "/api/workspace/items",
    requireAuth,
    requireFieldKit,
    async (req: AuthedRequest, res) => {
      try {
        const member = req.fieldKit!.member!;
        const kindRaw = typeof req.query.kind === "string" ? req.query.kind : "";
        const kindParsed = kindSchema.safeParse(kindRaw);
        if (!kindParsed.success || !WORKSPACE_KINDS.has(kindParsed.data)) {
          return res.status(400).json({
            error: "Valid kind query required",
            code: "INVALID_KIND",
            allowed: [...WORKSPACE_KINDS],
          });
        }
        const kind = kindParsed.data;
        const rows = await db
          .select()
          .from(memberWorkspaceItems)
          .where(
            and(
              eq(memberWorkspaceItems.memberId, member.id),
              eq(memberWorkspaceItems.organizationId, member.organizationId),
              eq(memberWorkspaceItems.kind, kind),
              isNull(memberWorkspaceItems.deletedAt),
            ),
          );
        return res.json({
          items: rows.map(publicItem),
          conflictPolicy:
            "Optimistic concurrency: PUT requires baseVersion === server version; stale clients receive 409",
        });
      } catch (err) {
        console.error("workspace list error:", err);
        return res.status(500).json({ error: "Failed to list workspace items" });
      }
    },
  );

  /**
   * PUT /api/workspace/items/:clientKey
   * Upsert with version check — never silent overwrite of newer server work.
   */
  app.put(
    "/api/workspace/items/:clientKey",
    requireAuth,
    requireFieldKit,
    authLimit,
    async (req: AuthedRequest, res) => {
      try {
        const member = req.fieldKit!.member!;
        const clientKey = String(req.params.clientKey || "").slice(0, 128);
        if (!clientKey) {
          return res.status(400).json({ error: "clientKey required", code: "INVALID_KEY" });
        }
        const parsed = upsertBodySchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error: "Invalid workspace payload",
            code: "INVALID_BODY",
            details: parsed.error.flatten(),
          });
        }
        if (!WORKSPACE_KINDS.has(parsed.data.kind)) {
          return res.status(400).json({ error: "Unknown kind", code: "INVALID_KIND" });
        }

        const [existing] = await db
          .select()
          .from(memberWorkspaceItems)
          .where(
            and(
              eq(memberWorkspaceItems.memberId, member.id),
              eq(memberWorkspaceItems.kind, parsed.data.kind),
              eq(memberWorkspaceItems.clientKey, clientKey),
            ),
          )
          .limit(1);

        const decision = resolveWorkspaceWrite({
          baseVersion: parsed.data.baseVersion,
          clientUpdatedAtMs: parsed.data.clientUpdatedAtMs,
          server: existing
            ? {
                version: existing.version,
                clientUpdatedAtMs: existing.clientUpdatedAtMs,
                updatedAtMs: existing.updatedAt.getTime(),
                deletedAtMs: existing.deletedAt ? existing.deletedAt.getTime() : null,
              }
            : null,
        });

        if (decision.decision === "conflict") {
          return res.status(409).json({
            error: "Workspace conflict — reload server state before retrying",
            code: decision.code,
            server: existing ? publicItem(existing) : null,
          });
        }

        const now = new Date();
        if (decision.decision === "create") {
          const [created] = await db
            .insert(memberWorkspaceItems)
            .values({
              organizationId: member.organizationId,
              memberId: member.id,
              kind: parsed.data.kind,
              clientKey,
              title: parsed.data.title ?? null,
              payload: parsed.data.payload as Record<string, unknown>,
              version: decision.nextVersion,
              clientUpdatedAtMs: parsed.data.clientUpdatedAtMs,
              updatedAt: now,
              deletedAt: null,
            })
            .returning();
          return res.status(201).json({ item: publicItem(created), decision: "create" });
        }

        // update / revive
        const [updated] = await db
          .update(memberWorkspaceItems)
          .set({
            title: parsed.data.title ?? null,
            payload: parsed.data.payload as Record<string, unknown>,
            version: decision.nextVersion,
            clientUpdatedAtMs: parsed.data.clientUpdatedAtMs,
            updatedAt: now,
            deletedAt: null,
            organizationId: member.organizationId,
          })
          .where(
            and(
              eq(memberWorkspaceItems.memberId, member.id),
              eq(memberWorkspaceItems.kind, parsed.data.kind),
              eq(memberWorkspaceItems.clientKey, clientKey),
            ),
          )
          .returning();

        return res.json({ item: publicItem(updated), decision: "update" });
      } catch (err) {
        console.error("workspace upsert error:", err);
        return res.status(500).json({ error: "Failed to save workspace item" });
      }
    },
  );

  /**
   * DELETE /api/workspace/items/:clientKey?kind=&baseVersion=
   * Soft-delete with version check.
   */
  app.delete(
    "/api/workspace/items/:clientKey",
    requireAuth,
    requireFieldKit,
    authLimit,
    async (req: AuthedRequest, res) => {
      try {
        const member = req.fieldKit!.member!;
        const clientKey = String(req.params.clientKey || "").slice(0, 128);
        const kindParsed = kindSchema.safeParse(req.query.kind);
        const baseVersion = Number(req.query.baseVersion);
        if (!clientKey || !kindParsed.success || !Number.isFinite(baseVersion)) {
          return res.status(400).json({
            error: "kind and baseVersion query params required",
            code: "INVALID_QUERY",
          });
        }
        const kind = kindParsed.data;

        const [existing] = await db
          .select()
          .from(memberWorkspaceItems)
          .where(
            and(
              eq(memberWorkspaceItems.memberId, member.id),
              eq(memberWorkspaceItems.kind, kind),
              eq(memberWorkspaceItems.clientKey, clientKey),
            ),
          )
          .limit(1);

        if (!existing || existing.deletedAt) {
          return res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
        }
        if (existing.version !== baseVersion) {
          return res.status(409).json({
            error: "Version conflict on delete",
            code: "STALE_CLIENT",
            server: publicItem(existing),
          });
        }

        const [updated] = await db
          .update(memberWorkspaceItems)
          .set({
            deletedAt: new Date(),
            version: existing.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(memberWorkspaceItems.id, existing.id))
          .returning();

        return res.json({ ok: true, item: publicItem(updated) });
      } catch (err) {
        console.error("workspace delete error:", err);
        return res.status(500).json({ error: "Failed to delete workspace item" });
      }
    },
  );
}
