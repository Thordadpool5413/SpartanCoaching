import { randomUUID } from "node:crypto";
import type { Express } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { memberWorkItems } from "@workspace/db";
import { z } from "zod/v4";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { findPotentialIdentifiers } from "../clinical/deidentification";
import { db } from "../db";
import { fieldWorkStateForStatus } from "@workspace/field-kit-catalog";

const nextActionSchema = z.object({ title: z.string().trim().min(1).max(240), href: z.string().trim().max(500).optional(), dueAt: z.string().datetime({ offset: true }).optional() }).strict().nullable();
const inputSchema = z.object({
  kind: z.enum(["tool_result", "calculator_report", "intelligence_brief", "roleplay", "transcript", "resource_work"]),
  toolId: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(1).max(240), status: z.enum(["draft", "completed", "failed"]).default("completed"),
  accountId: z.string().uuid().nullable().optional(), input: z.record(z.string().max(80), z.unknown()).default({}),
  output: z.record(z.string().max(80), z.unknown()), nextAction: nextActionSchema.optional(),
  sourcePlatform: z.enum(["web", "ios"]).default("web"),
}).strict();

function owner(req: AuthedRequest) { const member = req.fieldKit?.member; return member && req.clientMemberId ? { organizationId: member.organizationId, memberId: req.clientMemberId } : null; }
function safe(value: unknown) { const serialized = JSON.stringify(value); return Buffer.byteLength(serialized, "utf8") <= 64_000 && findPotentialIdentifiers(serialized).length === 0; }
function item(row: typeof memberWorkItems.$inferSelect) {
  return {
    ...row,
    syncState: fieldWorkStateForStatus(row.status, "synced"),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

const updateSchema = z.object({
  status: z.enum(["draft", "completed", "failed"]).optional(),
  nextAction: nextActionSchema.optional(),
}).strict();

const IDEMPOTENCY_PATTERN = /^[\x21-\x7e]{8,200}$/;

export function registerMemberWorkRoutes(app: Express): void {
  app.get("/api/v1/member-work", requireAuth, async (req: AuthedRequest, res) => {
    try { const context = owner(req); if (!context) return res.status(401).json({ error: "Authentication required" });
      const rows = await db.select().from(memberWorkItems).where(and(eq(memberWorkItems.organizationId, context.organizationId), eq(memberWorkItems.memberId, context.memberId), isNull(memberWorkItems.archivedAt))).orderBy(desc(memberWorkItems.updatedAt)).limit(250);
      return res.json({ items: rows.map(item) });
    } catch (error) { console.error("member work GET failed:", error); return res.status(500).json({ error: "Saved work could not be loaded." }); }
  });
  app.get("/api/v1/member-work/:id", requireAuth, async (req: AuthedRequest, res) => {
    try { const context = owner(req); const id = z.string().uuid().safeParse(req.params.id); if (!context) return res.status(401).json({ error: "Authentication required" }); if (!id.success) return res.status(400).json({ error: "Saved-work ID is invalid." });
      const [row] = await db.select().from(memberWorkItems).where(and(eq(memberWorkItems.id, id.data), eq(memberWorkItems.organizationId, context.organizationId), eq(memberWorkItems.memberId, context.memberId), isNull(memberWorkItems.archivedAt))).limit(1);
      return row ? res.json({ item: item(row) }) : res.status(404).json({ error: "Saved work was not found." });
    } catch (error) { console.error("member work detail failed:", error); return res.status(500).json({ error: "Saved work could not be loaded." }); }
  });
  app.post("/api/v1/member-work", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const context = owner(req);
      if (!context) return res.status(401).json({ error: "Authentication required" });
      const idempotencyKey = String(req.get("Idempotency-Key") || "").trim();
      if (idempotencyKey && !IDEMPOTENCY_PATTERN.test(idempotencyKey)) {
        return res.status(400).json({ error: "Idempotency-Key must contain 8 to 200 printable characters.", code: "INVALID_IDEMPOTENCY_KEY" });
      }
      if (idempotencyKey) {
        const [existing] = await db.select().from(memberWorkItems).where(and(
          eq(memberWorkItems.organizationId, context.organizationId),
          eq(memberWorkItems.memberId, context.memberId),
          eq(memberWorkItems.idempotencyKey, idempotencyKey),
        )).limit(1);
        if (existing) return res.status(200).json({ item: item(existing), idempotent: true });
      }
      const parsed = inputSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Saved work is invalid." });
      if (!safe(parsed.data)) return res.status(400).json({ error: "Remove patient identifiers before saving work.", code: "POTENTIAL_PHI_DETECTED" });
      const [created] = await db.insert(memberWorkItems).values({
        id: randomUUID(),
        ...context,
        ...parsed.data,
        idempotencyKey: idempotencyKey || null,
      }).returning();
      return res.status(201).json({ item: item(created), idempotent: false });
    } catch (error) { console.error("member work POST failed:", error); return res.status(500).json({ error: "The result could not be saved." }); }
  });

  app.patch("/api/v1/member-work/:id", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const context = owner(req);
      const id = z.string().uuid().safeParse(req.params.id);
      if (!context) return res.status(401).json({ error: "Authentication required" });
      if (!id.success) return res.status(400).json({ error: "Saved-work ID is invalid." });
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success || (!parsed.data.status && parsed.data.nextAction === undefined)) {
        return res.status(400).json({ error: "Saved-work update is invalid." });
      }
      const [updated] = await db.update(memberWorkItems).set({
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.nextAction !== undefined ? { nextAction: parsed.data.nextAction } : {}),
        updatedAt: new Date(),
      }).where(and(
        eq(memberWorkItems.id, id.data),
        eq(memberWorkItems.organizationId, context.organizationId),
        eq(memberWorkItems.memberId, context.memberId),
        isNull(memberWorkItems.archivedAt),
      )).returning();
      return updated ? res.json({ item: item(updated) }) : res.status(404).json({ error: "Saved work was not found." });
    } catch (error) { console.error("member work PATCH failed:", error); return res.status(500).json({ error: "Saved work could not be updated." }); }
  });
}
