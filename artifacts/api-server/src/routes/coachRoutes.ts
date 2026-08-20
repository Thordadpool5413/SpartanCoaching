import type { Express, Response } from "express";
import { and, asc, desc, eq, lt, ne } from "drizzle-orm";
import { z } from "zod";
import {
  clientMembers,
  coachConversations,
  coachMemoryItems,
  coachMessages,
  coachPreferences,
  coachSharedSummaries,
} from "@workspace/db";
import { db } from "../db";
import { requireElite, type AuthedRequest } from "../auth/middleware";
import { standardAiLimit, globalDailyAiCap } from "../rateLimits";
import { findPotentialIdentifiers } from "../clinical/deidentification";
import { preflightUncertainty } from "../ai/uncertaintyBoundaries";
import { generateSpartanCoachResponse } from "../openai";
import { clientErrorMessage } from "../lib/httpErrors";

const preferenceSchema = z.object({
  memoryEnabled: z.boolean(),
  responseStyle: z.enum(["concise", "balanced", "detailed"]),
}).strict();
const conversationSchema = z.object({ title: z.string().trim().min(1).max(160).optional() }).strict();
const messageSchema = z.object({
  requestId: z.string().uuid(),
  message: z.string().trim().min(1).max(4000),
}).strict();
const memorySchema = z.object({
  category: z.enum(["goal", "preference", "commitment", "context"]),
  content: z.string().trim().min(1).max(500),
}).strict();
const shareSchema = z.object({
  summary: z.string().trim().min(1).max(1200),
  commitments: z.array(z.string().trim().min(1).max(240)).max(10),
}).strict();
const COACH_RAW_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export async function runCoachRetentionSweep(now = new Date()) {
  const cutoff = new Date(now.getTime() - COACH_RAW_RETENTION_MS);
  const deleted = await db
    .delete(coachConversations)
    .where(lt(coachConversations.updatedAt, cutoff))
    .returning({ id: coachConversations.id });
  return { conversationsDeleted: deleted.length, cutoff: cutoff.toISOString() };
}

function owner(request: AuthedRequest) {
  const member = request.fieldKit?.member;
  if (!member || !request.clientMemberId) throw new Error("Authentication required");
  return { organizationId: member.organizationId, memberId: request.clientMemberId, member };
}

function invalidBody(response: Response, issues: unknown) {
  return response.status(400).json({ error: "Invalid request", code: "INVALID_REQUEST", issues });
}

function rejectIdentifiers(response: Response, value: unknown): boolean {
  const findings = findPotentialIdentifiers(value);
  if (!findings.length) return false;
  response.status(400).json({
    error: "Remove patient identifiers before using Spartan Coach.",
    code: "POTENTIAL_PHI_DETECTED",
    findings,
  });
  return true;
}

async function ownedConversation(id: string, request: AuthedRequest) {
  const context = owner(request);
  const [conversation] = await db.select().from(coachConversations).where(and(
    eq(coachConversations.id, id),
    eq(coachConversations.organizationId, context.organizationId),
    eq(coachConversations.memberId, context.memberId),
  )).limit(1);
  return conversation;
}

async function persistTurn(input: {
  conversationId: string;
  requestId: string;
  organizationId: number;
  memberId: number;
  user: string;
  assistant: string;
}) {
  await db.transaction(async (tx) => {
    await tx.insert(coachMessages).values([
      { conversationId: input.conversationId, clientRequestId: input.requestId, organizationId: input.organizationId, memberId: input.memberId, role: "user", content: input.user },
      { conversationId: input.conversationId, clientRequestId: input.requestId, organizationId: input.organizationId, memberId: input.memberId, role: "assistant", content: input.assistant },
    ]).onConflictDoNothing();
    await tx.update(coachConversations).set({
      title: input.user.slice(0, 80),
      updatedAt: new Date(),
    }).where(and(
      eq(coachConversations.id, input.conversationId),
      eq(coachConversations.organizationId, input.organizationId),
      eq(coachConversations.memberId, input.memberId),
      eq(coachConversations.title, "New conversation"),
    ));
  });
  const [assistant] = await db.select().from(coachMessages).where(and(
    eq(coachMessages.conversationId, input.conversationId),
    eq(coachMessages.organizationId, input.organizationId),
    eq(coachMessages.memberId, input.memberId),
    eq(coachMessages.clientRequestId, input.requestId),
    eq(coachMessages.role, "assistant"),
  )).limit(1);
  return assistant;
}

export function registerCoachRoutes(app: Express): void {
  app.use("/api/v1/coach", requireElite, async (req, _res, next) => {
    try {
      const context = owner(req as AuthedRequest);
      await db.delete(coachConversations).where(and(
        eq(coachConversations.organizationId, context.organizationId),
        eq(coachConversations.memberId, context.memberId),
        lt(coachConversations.updatedAt, new Date(Date.now() - COACH_RAW_RETENTION_MS)),
      ));
      next();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/coach/preferences", requireElite, async (req, res, next) => {
    try {
      const context = owner(req as AuthedRequest);
      const [preference] = await db.select().from(coachPreferences).where(and(
        eq(coachPreferences.organizationId, context.organizationId),
        eq(coachPreferences.memberId, context.memberId),
      )).limit(1);
      res.json({ preference: preference ?? { memoryEnabled: false, responseStyle: "balanced" } });
    } catch (error) { next(error); }
  });

  app.put("/api/v1/coach/preferences", requireElite, async (req, res, next) => {
    const parsed = preferenceSchema.safeParse(req.body);
    if (!parsed.success) return invalidBody(res, parsed.error.issues);
    try {
      const context = owner(req as AuthedRequest);
      const [preference] = await db.insert(coachPreferences).values({
        organizationId: context.organizationId,
        memberId: context.memberId,
        ...parsed.data,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: [coachPreferences.organizationId, coachPreferences.memberId],
        set: { ...parsed.data, updatedAt: new Date() },
      }).returning();
      res.json({ preference });
    } catch (error) { next(error); }
  });

  app.get("/api/v1/coach/memory", requireElite, async (req, res, next) => {
    try {
      const context = owner(req as AuthedRequest);
      const items = await db.select().from(coachMemoryItems).where(and(
        eq(coachMemoryItems.organizationId, context.organizationId),
        eq(coachMemoryItems.memberId, context.memberId),
      )).orderBy(desc(coachMemoryItems.updatedAt));
      res.json({ items });
    } catch (error) { next(error); }
  });

  app.post("/api/v1/coach/memory", requireElite, async (req, res, next) => {
    const parsed = memorySchema.safeParse(req.body);
    if (!parsed.success) return invalidBody(res, parsed.error.issues);
    if (rejectIdentifiers(res, parsed.data)) return;
    try {
      const context = owner(req as AuthedRequest);
      const [item] = await db.insert(coachMemoryItems).values({
        ...parsed.data,
        organizationId: context.organizationId,
        memberId: context.memberId,
      }).returning();
      res.status(201).json({ item });
    } catch (error) { next(error); }
  });

  app.delete("/api/v1/coach/memory/:id", requireElite, async (req, res, next) => {
    try {
      const context = owner(req as AuthedRequest);
      await db.delete(coachMemoryItems).where(and(
        eq(coachMemoryItems.id, String(req.params.id)),
        eq(coachMemoryItems.organizationId, context.organizationId),
        eq(coachMemoryItems.memberId, context.memberId),
      ));
      res.json({ ok: true });
    } catch (error) { next(error); }
  });

  app.get("/api/v1/coach/conversations", requireElite, async (req, res, next) => {
    try {
      const context = owner(req as AuthedRequest);
      const conversations = await db.select().from(coachConversations).where(and(
        eq(coachConversations.organizationId, context.organizationId),
        eq(coachConversations.memberId, context.memberId),
        ne(coachConversations.status, "archived"),
      )).orderBy(desc(coachConversations.updatedAt));
      res.json({ conversations });
    } catch (error) { next(error); }
  });

  app.post("/api/v1/coach/conversations", requireElite, async (req, res, next) => {
    const parsed = conversationSchema.safeParse(req.body ?? {});
    if (!parsed.success) return invalidBody(res, parsed.error.issues);
    try {
      const context = owner(req as AuthedRequest);
      const [conversation] = await db.insert(coachConversations).values({
        organizationId: context.organizationId,
        memberId: context.memberId,
        ...(parsed.data.title ? { title: parsed.data.title } : {}),
      }).returning();
      res.status(201).json({ conversation });
    } catch (error) { next(error); }
  });

  app.get("/api/v1/coach/conversations/:id", requireElite, async (req, res, next) => {
    try {
      const request = req as AuthedRequest;
      const context = owner(request);
      const conversation = await ownedConversation(String(req.params.id), request);
      if (!conversation) return res.status(404).json({ error: "Conversation not found", code: "NOT_FOUND" });
      const messages = await db.select().from(coachMessages).where(and(
        eq(coachMessages.conversationId, conversation.id),
        eq(coachMessages.organizationId, context.organizationId),
        eq(coachMessages.memberId, context.memberId),
      )).orderBy(asc(coachMessages.createdAt));
      res.json({ conversation, messages });
    } catch (error) { next(error); }
  });

  app.delete("/api/v1/coach/conversations/:id", requireElite, async (req, res, next) => {
    try {
      const context = owner(req as AuthedRequest);
      const deleted = await db.delete(coachConversations).where(and(
        eq(coachConversations.id, String(req.params.id)),
        eq(coachConversations.organizationId, context.organizationId),
        eq(coachConversations.memberId, context.memberId),
      )).returning({ id: coachConversations.id });
      if (!deleted.length) return res.status(404).json({ error: "Conversation not found", code: "NOT_FOUND" });
      res.json({ ok: true, hardDeleted: true });
    } catch (error) { next(error); }
  });

  app.post("/api/v1/coach/conversations/:id/share", requireElite, async (req, res, next) => {
    const parsed = shareSchema.safeParse(req.body);
    if (!parsed.success) return invalidBody(res, parsed.error.issues);
    if (rejectIdentifiers(res, parsed.data)) return;
    try {
      const request = req as AuthedRequest;
      const context = owner(request);
      const conversation = await ownedConversation(String(req.params.id), request);
      if (!conversation) return res.status(404).json({ error: "Conversation not found", code: "NOT_FOUND" });
      const managerId = context.member.managerMemberId;
      if (!managerId) return res.status(409).json({ error: "No manager is assigned", code: "MANAGER_NOT_ASSIGNED" });
      const [manager] = await db.select().from(clientMembers).where(and(
        eq(clientMembers.id, managerId),
        eq(clientMembers.organizationId, context.organizationId),
        ne(clientMembers.status, "disabled"),
      )).limit(1);
      if (!manager) return res.status(409).json({ error: "Assigned manager is unavailable", code: "MANAGER_UNAVAILABLE" });
      const [sharedSummary] = await db.insert(coachSharedSummaries).values({
        organizationId: context.organizationId,
        ownerMemberId: context.memberId,
        sharedWithMemberId: manager.id,
        conversationId: conversation.id,
        summary: parsed.data.summary,
        commitments: parsed.data.commitments,
      }).returning();
      res.status(201).json({ sharedSummary });
    } catch (error) { next(error); }
  });

  app.get("/api/v1/coach/shared-summaries", requireElite, async (req, res, next) => {
    try {
      const context = owner(req as AuthedRequest);
      const summaries = await db.select().from(coachSharedSummaries).where(and(
        eq(coachSharedSummaries.organizationId, context.organizationId),
        eq(coachSharedSummaries.sharedWithMemberId, context.memberId),
      )).orderBy(desc(coachSharedSummaries.sharedAt));
      res.json({ summaries });
    } catch (error) { next(error); }
  });

  app.delete("/api/v1/coach/shared-summaries/:id", requireElite, async (req, res, next) => {
    try {
      const context = owner(req as AuthedRequest);
      await db.delete(coachSharedSummaries).where(and(
        eq(coachSharedSummaries.id, String(req.params.id)),
        eq(coachSharedSummaries.organizationId, context.organizationId),
        eq(coachSharedSummaries.ownerMemberId, context.memberId),
      ));
      res.json({ ok: true });
    } catch (error) { next(error); }
  });

  app.post(
    "/api/v1/coach/conversations/:id/messages",
    requireElite,
    standardAiLimit,
    globalDailyAiCap,
    async (req, res) => {
      const parsed = messageSchema.safeParse(req.body);
      if (!parsed.success) return invalidBody(res, parsed.error.issues);
      if (rejectIdentifiers(res, parsed.data.message)) return;
      try {
        const request = req as AuthedRequest;
        const context = owner(request);
        const conversation = await ownedConversation(String(req.params.id), request);
        if (!conversation || conversation.status !== "active") {
          return res.status(404).json({ error: "Conversation not found", code: "NOT_FOUND" });
        }
        const [existing] = await db.select().from(coachMessages).where(and(
          eq(coachMessages.conversationId, conversation.id),
          eq(coachMessages.organizationId, context.organizationId),
          eq(coachMessages.memberId, context.memberId),
          eq(coachMessages.clientRequestId, parsed.data.requestId),
          eq(coachMessages.role, "assistant"),
        )).limit(1);
        if (existing) return res.json({ message: existing, idempotent: true });

        const blocked = preflightUncertainty(parsed.data.message, { workflow: "other" });
        if (blocked) {
          const saved = await persistTurn({
            conversationId: conversation.id,
            requestId: parsed.data.requestId,
            organizationId: context.organizationId,
            memberId: context.memberId,
            user: parsed.data.message,
            assistant: blocked.safeResponse,
          });
          return res.status(201).json({ message: saved, uncertainty: blocked });
        }

        const historyRows = await db.select({ role: coachMessages.role, content: coachMessages.content }).from(coachMessages).where(and(
          eq(coachMessages.conversationId, conversation.id),
          eq(coachMessages.organizationId, context.organizationId),
          eq(coachMessages.memberId, context.memberId),
        )).orderBy(desc(coachMessages.createdAt)).limit(20);
        const [preference] = await db.select().from(coachPreferences).where(and(
          eq(coachPreferences.organizationId, context.organizationId),
          eq(coachPreferences.memberId, context.memberId),
        )).limit(1);
        const memory = preference?.memoryEnabled
          ? await db.select({ category: coachMemoryItems.category, content: coachMemoryItems.content }).from(coachMemoryItems).where(and(
              eq(coachMemoryItems.organizationId, context.organizationId),
              eq(coachMemoryItems.memberId, context.memberId),
              eq(coachMemoryItems.enabled, true),
            )).orderBy(desc(coachMemoryItems.updatedAt)).limit(20)
          : [];
        const answer = await generateSpartanCoachResponse(
          parsed.data.message,
          historyRows.reverse().filter((row): row is { role: "user" | "assistant"; content: string } => row.role === "user" || row.role === "assistant"),
          {
            profile: { name: context.member.name, jobRole: context.member.jobRole, territoryNote: context.member.territoryNote },
            memory,
            responseStyle: (preference?.responseStyle as "concise" | "balanced" | "detailed" | undefined) ?? "balanced",
          },
        );
        const saved = await persistTurn({
          conversationId: conversation.id,
          requestId: parsed.data.requestId,
          organizationId: context.organizationId,
          memberId: context.memberId,
          user: parsed.data.message,
          assistant: answer,
        });
        res.status(201).json({ message: saved });
      } catch (error) {
        res.status(500).json({ error: clientErrorMessage(error, "Spartan Coach is temporarily unavailable") });
      }
    },
  );
}