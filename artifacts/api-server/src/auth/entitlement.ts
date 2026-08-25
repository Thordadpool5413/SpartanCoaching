import {
  clientOrganizations,
  clientMembers,
  type ClientMember,
  type ClientOrganization,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { refreshOrgStatusWithLifecycle } from "./trialLifecycle";
import {
  evaluateFieldKitAccess as evaluatePure,
  type FieldKitAccessResult,
} from "./evaluateAccess";

export type FieldKitAccess = FieldKitAccessResult<ClientMember, ClientOrganization>;

export function evaluateFieldKitAccess(
  member: ClientMember,
  org: ClientOrganization,
): FieldKitAccess {
  return evaluatePure(member, org);
}

/** Ensure trial orgs past trialEndsAt flip to expired (+ lifecycle emails). */
export async function refreshOrgStatus(org: ClientOrganization): Promise<ClientOrganization> {
  if (
    org.billingProvider === "apple" &&
    org.status === "active" &&
    org.currentPeriodEnd &&
    org.currentPeriodEnd.getTime() <= Date.now()
  ) {
    const [updated] = await db
      .update(clientOrganizations)
      .set({ status: "expired", pipelineStatus: "follow_up", billingStatus: "expired" })
      .where(eq(clientOrganizations.id, org.id))
      .returning();
    return updated ?? { ...org, status: "expired", pipelineStatus: "follow_up", billingStatus: "expired" };
  }
  return refreshOrgStatusWithLifecycle(org);
}

export async function getAccessForMemberId(memberId: number): Promise<FieldKitAccess> {
  const [member] = await db.select().from(clientMembers).where(eq(clientMembers.id, memberId)).limit(1);
  if (!member) return { allowed: false, reason: "unauthenticated" };

  const [org] = await db
    .select()
    .from(clientOrganizations)
    .where(eq(clientOrganizations.id, member.organizationId))
    .limit(1);
  if (!org) return { allowed: false, reason: "no_org", member };

  const freshOrg = await refreshOrgStatus(org);
  return evaluateFieldKitAccess(member, freshOrg);
}

export function publicMember(member: ClientMember) {
  const checklist = ((member as any).checklistProgress || {}) as Record<string, boolean | string>;
  const checklistDone = Object.values(checklist).filter((v) => v === true || (typeof v === "string" && v.length > 0)).length;
  return {
    id: member.id,
    email: member.email,
    name: member.name,
    title: member.title,
    role: member.role,
    organizationId: member.organizationId,
    status: member.status,
    lastLoginAt: member.lastLoginAt,
    jobRole: (member as any).jobRole ?? null,
    alsoLeadsTeam: (member as { alsoLeadsTeam?: boolean }).alsoLeadsTeam ?? false,
    territoryNote: (member as any).territoryNote ?? null,
    topObjections: (member as any).topObjections ?? null,
    checklistProgress: checklist,
    checklistDone,
    activated: checklistDone > 0,
    // HSP-41 Slice C structure (nullable)
    branchId: (member as { branchId?: number | null }).branchId ?? null,
    teamId: (member as { teamId?: number | null }).teamId ?? null,
    managerMemberId: (member as { managerMemberId?: number | null }).managerMemberId ?? null,
  };
}

export function publicOrg(org: ClientOrganization) {
  return {
    id: org.id,
    name: org.name,
    type: org.type,
    seatLimit: org.seatLimit,
    status: org.status,
    trialEndsAt: org.trialEndsAt,
    activatedAt: org.activatedAt,
    // Internal Access Desk fields (notes, pipeline, follow-up, lost reason) stay off public payloads.
    // Billing (safe for client UI — no secret Stripe keys)
    billingPlan: (org as any).billingPlan ?? null,
    billingProvider: (org as any).billingProvider ?? null,
    billingStatus: (org as any).billingStatus ?? null,
    currentPeriodEnd: (org as any).currentPeriodEnd ?? null,
    cancelAtPeriodEnd: Boolean((org as any).cancelAtPeriodEnd),
    billableSeats: (org as any).billableSeats ?? null,
    contractRef: (org as any).contractRef ?? null,
    hasStripeCustomer: Boolean((org as any).stripeCustomerId),
    hasStripeSubscription: Boolean((org as any).stripeSubscriptionId),
    // Slice D contacts (safe strings only)
    billingContactEmail: (org as any).billingContactEmail ?? null,
    billingContactName: (org as any).billingContactName ?? null,
    securityContactEmail: (org as any).securityContactEmail ?? null,
    securityContactName: (org as any).securityContactName ?? null,
    dataRetentionNote: (org as any).dataRetentionNote ?? null,
  };
}
