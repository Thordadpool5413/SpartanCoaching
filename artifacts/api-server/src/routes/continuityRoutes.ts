/**
 * Member continuity API.
 *
 * Server-owned plans, Coach commitments, and advanced AI runs remain in their
 * existing tables. This endpoint only syncs approved device-local state.
 */
import type { Express } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  coachMemoryItems,
  emptyMemberContinuityPayload,
  memberContinuity,
  memberContinuityPayloadSchema,
  mergeMemberContinuityPayload,
  type MemberContinuityPayload,
} from "@workspace/db";
import { findPotentialIdentifiers } from "../clinical/deidentification";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { db } from "../db";

const SYNCABLE_TOOL_IDS = new Set(["objection", "playbook", "weekly", "cold", "email", "research"]);

function memberContext(req: AuthedRequest) {
  const member = req.fieldKit?.member;
  if (!member || !req.clientMemberId) return null;
  return { organizationId: member.organizationId, memberId: req.clientMemberId };
}

function safePayload(value: unknown): MemberContinuityPayload | null {
  const parsed = memberContinuityPayloadSchema.safeParse(value);
  if (!parsed.success) return null;
  const payload = parsed.data;
  return {
    ...payload,
    toolDrafts: Object.fromEntries(Object.entries(payload.toolDrafts).filter(([id]) => SYNCABLE_TOOL_IDS.has(id))),
    toolResults: Object.fromEntries(Object.entries(payload.toolResults).filter(([id]) => SYNCABLE_TOOL_IDS.has(id))),
  };
}

export function registerContinuityRoutes(app: Express): void {
  app.get("/api/v1/member-continuity", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const context = memberContext(req);
      if (!context) return res.status(401).json({ error: "Authentication required" });
      const [continuity] = await db.select().from(memberContinuity).where(and(
        eq(memberContinuity.organizationId, context.organizationId),
        eq(memberContinuity.memberId, context.memberId),
      )).limit(1);
      const [commitment] = await db.select({
        content: coachMemoryItems.content,
        updatedAt: coachMemoryItems.updatedAt,
      }).from(coachMemoryItems).where(and(
        eq(coachMemoryItems.organizationId, context.organizationId),
        eq(coachMemoryItems.memberId, context.memberId),
        eq(coachMemoryItems.category, "commitment"),
        eq(coachMemoryItems.enabled, true),
      )).orderBy(desc(coachMemoryItems.updatedAt)).limit(1);
      return res.json({
        payload: safePayload(continuity?.payload) ?? emptyMemberContinuityPayload(),
        commitment: commitment ? {
          value: commitment.content,
          updatedAt: commitment.updatedAt.toISOString(),
        } : null,
      });
    } catch (error) {
      console.error("member continuity GET failed:", error);
      return res.status(500).json({ error: "Could not load member continuity." });
    }
  });

  app.put("/api/v1/member-continuity", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const context = memberContext(req);
      if (!context) return res.status(401).json({ error: "Authentication required" });
      const incoming = safePayload(req.body?.payload);
      if (!incoming) return res.status(400).json({ error: "Invalid continuity payload." });
      if (findPotentialIdentifiers(JSON.stringify(incoming)).length) {
        return res.status(400).json({
          error: "Remove patient identifiers before syncing saved work.",
          code: "POTENTIAL_PHI_DETECTED",
        });
      }

      const [existing] = await db.select().from(memberContinuity).where(and(
        eq(memberContinuity.organizationId, context.organizationId),
        eq(memberContinuity.memberId, context.memberId),
      )).limit(1);
      const merged = mergeMemberContinuityPayload(
        safePayload(existing?.payload) ?? emptyMemberContinuityPayload(),
        incoming,
      );
      if (existing) {
        await db.update(memberContinuity).set({ payload: merged, updatedAt: new Date() }).where(and(
          eq(memberContinuity.id, existing.id),
          eq(memberContinuity.organizationId, context.organizationId),
          eq(memberContinuity.memberId, context.memberId),
        ));
      } else {
        await db.insert(memberContinuity).values({
          organizationId: context.organizationId,
          memberId: context.memberId,
          payload: merged,
        });
      }
      return res.json({ payload: merged, syncPolicy: "per_item_latest_timestamp_wins" });
    } catch (error) {
      console.error("member continuity PUT failed:", error);
      return res.status(500).json({ error: "Could not save member continuity." });
    }
  });
}