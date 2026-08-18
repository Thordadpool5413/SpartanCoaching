import type { Express, NextFunction, Response } from "express";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import {
  aiToolRuns,
  clientMembers,
  clientOrganizations,
  coachConversations,
  coachMemoryItems,
  coachMessages,
  coachPreferences,
  memberNotificationPrefs,
  memberNotifications,
  memberPersonalization,
  resourceWork,
} from "@workspace/db";
import {
  COMPANY_ELITE_PLAN,
  COMPANY_STANDARD_PLAN,
} from "@workspace/field-kit-catalog";
import { db } from "../db";
import {
  requireAuth,
  requireFieldKit,
  requireOrgAdmin,
  type AuthedRequest,
} from "../auth/middleware";
import { resolveSeatCap, seatLimitReached } from "../auth/orgAdminPolicy";

const bodySchema = z.object({
  email: z.string().email().max(320),
  name: z.string().trim().min(2).max(160),
  role: z.enum(["member", "org_admin"]).default("member"),
}).strict();

function publicTransitionMember(member: typeof clientMembers.$inferSelect) {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    status: member.status,
    lastLoginAt: member.lastLoginAt,
  };
}

export function registerCompanySeatTransitionRoutes(app: Express): void {
  // This handler intentionally runs before the ordinary invite route. Existing
  // individual members keep the same account and workspace when a contracted
  // company activates their seat. New email addresses fall through to the
  // normal secure invitation flow in authRoutes.
  app.post(
    "/api/org/invites",
    requireAuth,
    requireFieldKit,
    requireOrgAdmin,
    async (req: AuthedRequest, res: Response, next: NextFunction) => {
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) return next();

      try {
        const company = req.fieldKit?.org;
        if (!company || company.type !== "company") return next();
        if (
          company.status !== "active" ||
          ![COMPANY_STANDARD_PLAN, COMPANY_ELITE_PLAN].includes(company.billingPlan as typeof COMPANY_STANDARD_PLAN | typeof COMPANY_ELITE_PLAN)
        ) {
          return res.status(409).json({
            error: "Company seats can be activated only after the contracted membership is active.",
            code: "COMPANY_CONTRACT_NOT_ACTIVE",
          });
        }

        const email = parsed.data.email.trim().toLowerCase();
        const [existing] = await db
          .select()
          .from(clientMembers)
          .where(eq(clientMembers.email, email))
          .limit(1);
        if (!existing) return next();

        if (existing.id === req.clientMemberId) {
          return res.status(409).json({
            error: "Your own administrator account already occupies a company seat.",
            code: "CANNOT_ACTIVATE_SELF",
          });
        }
        if (existing.role === "platform_admin") {
          return res.status(409).json({
            error: "Platform administrator accounts cannot be moved into a company seat.",
            code: "PLATFORM_ADMIN_PROTECTED",
          });
        }
        if (existing.organizationId === company.id) {
          return res.status(409).json({
            error: "This account already belongs to your organization.",
            code: "ALREADY_ORGANIZATION_MEMBER",
          });
        }

        const [sourceOrganization] = await db
          .select()
          .from(clientOrganizations)
          .where(eq(clientOrganizations.id, existing.organizationId))
          .limit(1);
        if (!sourceOrganization) {
          return res.status(409).json({ error: "Existing account organization was not found.", code: "SOURCE_ORGANIZATION_MISSING" });
        }
        if (sourceOrganization.type !== "personal") {
          return res.status(409).json({
            error: "This account is already assigned to another organization. Spartan Coaching must transfer that seat explicitly.",
            code: "ACCOUNT_ALREADY_COMPANY_ASSIGNED",
          });
        }

        const [countRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(clientMembers)
          .where(and(eq(clientMembers.organizationId, company.id), ne(clientMembers.status, "disabled")));
        const activeCount = countRow?.count ?? 0;
        const seatCap = resolveSeatCap({
          seatLimit: company.seatLimit,
          billableSeats: company.billableSeats,
        });
        if (seatLimitReached(activeCount, seatCap)) {
          return res.status(409).json({
            error: `Seat limit reached (${seatCap}). Contact Spartan Coaching to add seats under your contract.`,
            code: "SEAT_LIMIT_REACHED",
            seatLimit: seatCap,
          });
        }

        const moved = await db.transaction(async (tx) => {
          const sourceOrganizationId = sourceOrganization.id;
          const companyOrganizationId = company.id;
          const memberId = existing.id;

          // Private member work follows the same identity. Clinical permissions
          // and clinical cases intentionally do not transfer between tenants.
          await tx.update(coachConversations).set({ organizationId: companyOrganizationId }).where(and(
            eq(coachConversations.memberId, memberId),
            eq(coachConversations.organizationId, sourceOrganizationId),
          ));
          await tx.update(coachMessages).set({ organizationId: companyOrganizationId }).where(and(
            eq(coachMessages.memberId, memberId),
            eq(coachMessages.organizationId, sourceOrganizationId),
          ));
          await tx.update(coachPreferences).set({ organizationId: companyOrganizationId, updatedAt: new Date() }).where(and(
            eq(coachPreferences.memberId, memberId),
            eq(coachPreferences.organizationId, sourceOrganizationId),
          ));
          await tx.update(coachMemoryItems).set({ organizationId: companyOrganizationId, updatedAt: new Date() }).where(and(
            eq(coachMemoryItems.memberId, memberId),
            eq(coachMemoryItems.organizationId, sourceOrganizationId),
          ));
          await tx.update(aiToolRuns).set({ organizationId: companyOrganizationId }).where(and(
            eq(aiToolRuns.memberId, memberId),
            eq(aiToolRuns.organizationId, sourceOrganizationId),
            eq(aiToolRuns.containsPhi, false),
          ));
          await tx.update(resourceWork).set({ organizationId: companyOrganizationId, updatedAt: new Date() }).where(and(
            eq(resourceWork.memberId, memberId),
            eq(resourceWork.organizationId, sourceOrganizationId),
          ));
          await tx.update(memberPersonalization).set({ organizationId: companyOrganizationId, updatedAt: new Date() }).where(and(
            eq(memberPersonalization.memberId, memberId),
            eq(memberPersonalization.organizationId, sourceOrganizationId),
          ));
          await tx.update(memberNotificationPrefs).set({ organizationId: companyOrganizationId, updatedAt: new Date() }).where(and(
            eq(memberNotificationPrefs.memberId, memberId),
            eq(memberNotificationPrefs.organizationId, sourceOrganizationId),
          ));
          await tx.update(memberNotifications).set({ organizationId: companyOrganizationId }).where(and(
            eq(memberNotifications.memberId, memberId),
            eq(memberNotifications.organizationId, sourceOrganizationId),
          ));

          const [member] = await tx
            .update(clientMembers)
            .set({
              organizationId: companyOrganizationId,
              role: parsed.data.role,
              status: "active",
              name: existing.name || parsed.data.name,
              managerMemberId: null,
              branchId: null,
              teamId: null,
            })
            .where(eq(clientMembers.id, memberId))
            .returning();
          return member;
        });

        if (!moved) {
          return res.status(500).json({ error: "Company seat activation did not complete.", code: "SEAT_ACTIVATION_FAILED" });
        }

        const appleSubscriptionNeedsCancellation =
          sourceOrganization.billingProvider === "apple" &&
          sourceOrganization.billingStatus === "active";

        return res.status(200).json({
          ok: true,
          transitionedExistingAccount: true,
          member: publicTransitionMember(moved),
          companyMembership: company.billingPlan === COMPANY_ELITE_PLAN ? "elite" : "standard",
          previousPersonalMembership: {
            billingProvider: sourceOrganization.billingProvider,
            billingStatus: sourceOrganization.billingStatus,
            currentPeriodEnd: sourceOrganization.currentPeriodEnd,
            appleProductId: sourceOrganization.appleProductId,
          },
          appleSubscriptionNeedsCancellation,
          subscriptionManagementAction: appleSubscriptionNeedsCancellation ? "OPEN_APPLE_SUBSCRIPTIONS" : null,
          message: appleSubscriptionNeedsCancellation
            ? "Company access is active on the same Spartan account. The individual Apple subscription remains under the member's control and should be ended in Apple Subscriptions to prevent the next renewal."
            : "Company access is active on the same Spartan account. Existing private workspace history and preferences were preserved.",
        });
      } catch (error) {
        next(error);
      }
    },
  );
}
