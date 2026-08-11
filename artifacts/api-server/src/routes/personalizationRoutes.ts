/**
 * Personalization API (HSP-37 Slice A).
 *
 * Endpoints (3):
 *   GET  /api/v1/personalization
 *   PUT  /api/v1/personalization
 *   POST /api/v1/personalization/events
 */
import type { Express } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  memberPersonalization,
  resourceWork,
  emptyPersonalizationPayload,
  type PersonalizationPayload,
} from "@workspace/db";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import { db } from "../db";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { lightAiLimit } from "../rateLimits";
import {
  buildPersonalizationView,
  normalizePayload,
  pushRecent,
  toggleList,
} from "../personalization/personalizationEngine";

function memberContext(req: AuthedRequest): {
  organizationId: number;
  memberId: number;
  jobRole?: string | null;
} | null {
  const member = req.fieldKit?.member;
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
    jobRole: (member as { jobRole?: string | null })?.jobRole,
  };
}

async function loadOrCreatePayload(ctx: {
  organizationId: number;
  memberId: number;
}): Promise<{ rowId: number | null; payload: PersonalizationPayload }> {
  const [row] = await db
    .select()
    .from(memberPersonalization)
    .where(eq(memberPersonalization.memberId, ctx.memberId))
    .limit(1);
  if (row) {
    return { rowId: row.id, payload: normalizePayload(row.payload) };
  }
  return { rowId: null, payload: emptyPersonalizationPayload() };
}

async function savePayload(
  ctx: { organizationId: number; memberId: number },
  payload: PersonalizationPayload,
  rowId: number | null,
): Promise<PersonalizationPayload> {
  const normalized = normalizePayload(payload);
  if (rowId) {
    await db
      .update(memberPersonalization)
      .set({ payload: normalized, updatedAt: new Date() })
      .where(
        and(
          eq(memberPersonalization.id, rowId),
          eq(memberPersonalization.memberId, ctx.memberId),
          eq(memberPersonalization.organizationId, ctx.organizationId),
        ),
      );
  } else {
    await db.insert(memberPersonalization).values({
      organizationId: ctx.organizationId,
      memberId: ctx.memberId,
      payload: normalized,
    });
  }
  return normalized;
}

async function buildViewForMember(ctx: {
  organizationId: number;
  memberId: number;
  jobRole?: string | null;
}) {
  const { payload } = await loadOrCreatePayload(ctx);
  let drafts: Array<{
    resourceKey: string;
    title: string;
    href: string;
    status: string;
  }> = [];
  try {
    const rows = await db
      .select()
      .from(resourceWork)
      .where(
        and(
          eq(resourceWork.organizationId, ctx.organizationId),
          eq(resourceWork.memberId, ctx.memberId),
          eq(resourceWork.status, "draft"),
        ),
      )
      .orderBy(desc(resourceWork.updatedAt))
      .limit(5);
    drafts = rows.map((r) => ({
      resourceKey: r.resourceKey,
      title: r.title,
      href:
        r.resourceKey === "weekly-plan"
          ? "/resources/weekly-plan"
          : "/resources",
      status: r.status,
    }));
  } catch {
    drafts = [];
  }

  const toolTitleById = Object.fromEntries(
    FIELD_KIT_TOOLS.map((t) => [t.id, t.title]),
  );

  return buildPersonalizationView({
    payload,
    jobRole: ctx.jobRole,
    drafts,
    toolTitleById,
  });
}

const putBodySchema = z
  .object({
    reset: z.boolean().optional(),
    favorites: z
      .object({
        tools: z.array(z.string()).max(40).optional(),
        resources: z.array(z.string()).max(40).optional(),
      })
      .optional(),
    pinnedTools: z.array(z.string()).max(20).optional(),
    pinnedResources: z.array(z.string()).max(20).optional(),
    dismissRecommendationId: z.string().max(120).optional(),
    clearRecent: z.boolean().optional(),
  })
  .strict();

const eventBodySchema = z
  .object({
    action: z.enum([
      "open",
      "favorite_tool",
      "unfavorite_tool",
      "pin_tool",
      "unpin_tool",
      "favorite_resource",
      "unfavorite_resource",
      "pin_resource",
      "unpin_resource",
      "clear_recent",
      "reset",
    ]),
    item: z
      .object({
        kind: z.enum(["tool", "resource", "page", "saved_work", "workflow"]).optional(),
        id: z.string().max(200),
        title: z.string().max(300).optional(),
        href: z.string().max(500).optional(),
      })
      .optional(),
  })
  .strict();

export function registerPersonalizationRoutes(app: Express): void {
  app.get(
    "/api/v1/personalization",
    requireAuth,
    lightAiLimit,
    async (req: AuthedRequest, res) => {
      try {
        const ctx = memberContext(req);
        if (!ctx) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const view = await buildViewForMember(ctx);
        res.json(view);
      } catch (error) {
        console.error("personalization GET failed:", error);
        res.status(500).json({ error: "Failed to load personalization" });
      }
    },
  );

  app.put(
    "/api/v1/personalization",
    requireAuth,
    lightAiLimit,
    async (req: AuthedRequest, res) => {
      try {
        const ctx = memberContext(req);
        if (!ctx) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const body = putBodySchema.parse(req.body ?? {});
        const loaded = await loadOrCreatePayload(ctx);
        let payload = loaded.payload;

        if (body.reset) {
          payload = emptyPersonalizationPayload();
        } else {
          if (body.favorites?.tools) {
            payload.favorites.tools = body.favorites.tools.map(String);
          }
          if (body.favorites?.resources) {
            payload.favorites.resources = body.favorites.resources.map(String);
          }
          if (body.pinnedTools) payload.pinnedTools = body.pinnedTools.map(String);
          if (body.pinnedResources) {
            payload.pinnedResources = body.pinnedResources.map(String);
          }
          if (body.clearRecent) payload.recent = [];
          if (body.dismissRecommendationId) {
            payload.dismissedRecommendationIds = toggleList(
              payload.dismissedRecommendationIds,
              body.dismissRecommendationId,
              true,
              50,
            );
          }
        }

        payload = normalizePayload(payload);
        await savePayload(ctx, payload, loaded.rowId);
        const view = await buildViewForMember(ctx);
        res.json(view);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: "Invalid body", details: error.flatten() });
        }
        console.error("personalization PUT failed:", error);
        res.status(500).json({ error: "Failed to save personalization" });
      }
    },
  );

  app.post(
    "/api/v1/personalization/events",
    requireAuth,
    lightAiLimit,
    async (req: AuthedRequest, res) => {
      try {
        const ctx = memberContext(req);
        if (!ctx) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const body = eventBodySchema.parse(req.body ?? {});
        const loaded = await loadOrCreatePayload(ctx);
        let payload = loaded.payload;

        switch (body.action) {
          case "reset":
            payload = emptyPersonalizationPayload();
            break;
          case "clear_recent":
            payload.recent = [];
            break;
          case "open": {
            if (!body.item?.id) {
              return res.status(400).json({ error: "item.id required for open" });
            }
            payload = pushRecent(payload, {
              kind: body.item.kind || "page",
              id: body.item.id,
              title: body.item.title || body.item.id,
              href: body.item.href || "/portal",
            });
            break;
          }
          case "favorite_tool":
          case "unfavorite_tool":
            if (!body.item?.id) {
              return res.status(400).json({ error: "item.id required" });
            }
            payload.favorites.tools = toggleList(
              payload.favorites.tools,
              body.item.id,
              body.action === "favorite_tool",
            );
            break;
          case "pin_tool":
          case "unpin_tool":
            if (!body.item?.id) {
              return res.status(400).json({ error: "item.id required" });
            }
            payload.pinnedTools = toggleList(
              payload.pinnedTools,
              body.item.id,
              body.action === "pin_tool",
            );
            break;
          case "favorite_resource":
          case "unfavorite_resource":
            if (!body.item?.id) {
              return res.status(400).json({ error: "item.id required" });
            }
            payload.favorites.resources = toggleList(
              payload.favorites.resources,
              body.item.id,
              body.action === "favorite_resource",
            );
            break;
          case "pin_resource":
          case "unpin_resource":
            if (!body.item?.id) {
              return res.status(400).json({ error: "item.id required" });
            }
            payload.pinnedResources = toggleList(
              payload.pinnedResources,
              body.item.id,
              body.action === "pin_resource",
            );
            break;
          default:
            break;
        }

        payload = normalizePayload(payload);
        await savePayload(ctx, payload, loaded.rowId);
        const view = await buildViewForMember(ctx);
        res.json(view);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: "Invalid body", details: error.flatten() });
        }
        console.error("personalization events failed:", error);
        res.status(500).json({ error: "Failed to record personalization event" });
      }
    },
  );
}
