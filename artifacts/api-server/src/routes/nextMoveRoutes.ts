import type { Express } from "express";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { clientMembers, coachMemoryItems, memberWorkItems } from "@workspace/db";
import { GetWorkspaceNextMoveResponse } from "@workspace/api-zod";
import { hasEliteMembership } from "@workspace/field-kit-catalog";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { db } from "../db";
import { decideNextMove } from "../workspace/nextMove";

const REVIEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function registerNextMoveRoutes(app: Express): void {
  app.get("/api/v1/workspace/next-move", requireAuth, async (req, res, next): Promise<void> => {
    const request = req as AuthedRequest;
    try {
      const memberId = request.clientMemberId;
      const member = request.fieldKit?.member;
      const org = request.fieldKit?.org;
      if (!memberId || !member) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const since = new Date(Date.now() - REVIEW_WINDOW_MS);
      const [commitment, draft, reviewable] = await Promise.all([
        db.select({ id: coachMemoryItems.id }).from(coachMemoryItems).where(and(
          eq(coachMemoryItems.organizationId, member.organizationId),
          eq(coachMemoryItems.memberId, memberId),
          eq(coachMemoryItems.category, "commitment"),
          eq(coachMemoryItems.enabled, true),
        )).limit(1),
        db.select({ id: memberWorkItems.id }).from(memberWorkItems).where(and(
          eq(memberWorkItems.organizationId, member.organizationId),
          eq(memberWorkItems.memberId, memberId),
          eq(memberWorkItems.status, "draft"),
          isNull(memberWorkItems.archivedAt),
        )).limit(1),
        db.select({ id: memberWorkItems.id }).from(memberWorkItems).where(and(
          eq(memberWorkItems.organizationId, member.organizationId),
          eq(memberWorkItems.memberId, memberId),
          eq(memberWorkItems.status, "completed"),
          gte(memberWorkItems.updatedAt, since),
          isNull(memberWorkItems.archivedAt),
        )).orderBy(desc(memberWorkItems.updatedAt)).limit(1),
      ]);

      const canUseElite = hasEliteMembership({
        billingPlan: org?.billingPlan,
        organizationType: org?.type,
        memberRole: member.role,
      });
      const context = {
        contextAvailable: true,
        hasJobRole: typeof member.jobRole === "string" && member.jobRole.trim().length > 0,
        hasCommitment: canUseElite && commitment.length > 0,
        hasDraftWork: draft.length > 0,
        hasReviewableWork: reviewable.length > 0,
        canUseElite,
        alsoLeadsTeam: member.alsoLeadsTeam,
      };
      const decision = decideNextMove(context);
      const response = GetWorkspaceNextMoveResponse.parse({
        ...decision,
        generatedAt: new Date().toISOString(),
      });
      res.json(response);
    } catch (error) {
      request.log.error({ err: error }, "workspace next-move failed");
      next(error);
    }
  });
}