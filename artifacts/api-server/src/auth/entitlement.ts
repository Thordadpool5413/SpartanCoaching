import {
  clientOrganizations,
  clientMembers,
  type ClientMember,
  type ClientOrganization,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { refreshOrgStatusWithLifecycle } from "./trialLifecycle";

export type FieldKitAccess = {
  allowed: boolean;
  reason?: "unauthenticated" | "disabled" | "no_org" | "suspended" | "expired" | "pending_password";
  member?: ClientMember;
  org?: ClientOrganization;
  trialEndsAt?: Date | null;
  hoursRemaining?: number | null;
};

/** Ensure trial orgs past trialEndsAt flip to expired (+ lifecycle emails). */
export async function refreshOrgStatus(org: ClientOrganization): Promise<ClientOrganization> {
  return refreshOrgStatusWithLifecycle(org);
}

export function evaluateFieldKitAccess(member: ClientMember, org: ClientOrganization): FieldKitAccess {
  if (member.status === "disabled") {
    return { allowed: false, reason: "disabled", member, org };
  }
  if (member.status === "invited" || !member.passwordHash) {
    return { allowed: false, reason: "pending_password", member, org };
  }
  if (member.status !== "active") {
    return { allowed: false, reason: "disabled", member, org };
  }

  // Platform operators always have tool + admin access
  if (member.role === "platform_admin" || org.type === "platform") {
    return {
      allowed: true,
      member,
      org,
      trialEndsAt: null,
      hoursRemaining: null,
    };
  }

  if (org.status === "suspended") {
    return { allowed: false, reason: "suspended", member, org };
  }
  if (org.status === "expired") {
    return { allowed: false, reason: "expired", member, org, trialEndsAt: org.trialEndsAt };
  }
  if (org.status === "trial") {
    if (org.trialEndsAt && org.trialEndsAt.getTime() <= Date.now()) {
      return { allowed: false, reason: "expired", member, org, trialEndsAt: org.trialEndsAt };
    }
    const hoursRemaining = org.trialEndsAt
      ? Math.max(0, (org.trialEndsAt.getTime() - Date.now()) / 3_600_000)
      : null;
    return {
      allowed: true,
      member,
      org,
      trialEndsAt: org.trialEndsAt,
      hoursRemaining,
    };
  }
  if (org.status === "active") {
    return { allowed: true, member, org, trialEndsAt: null, hoursRemaining: null };
  }

  return { allowed: false, reason: "expired", member, org };
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
  return {
    id: member.id,
    email: member.email,
    name: member.name,
    title: member.title,
    role: member.role,
    organizationId: member.organizationId,
    status: member.status,
    lastLoginAt: member.lastLoginAt,
  };
}

export function publicOrg(org: ClientOrganization) {
  return {
    id: org.id,
    name: org.name,
    type: org.type,
    seatLimit: org.seatLimit,
    status: org.status,
    pipelineStatus: (org as any).pipelineStatus ?? null,
    trialEndsAt: org.trialEndsAt,
    activatedAt: org.activatedAt,
    nextFollowUpAt: (org as any).nextFollowUpAt ?? null,
    lostReason: (org as any).lostReason ?? null,
    notes: org.notes ?? null,
  };
}
