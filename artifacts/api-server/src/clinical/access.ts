import type { NextFunction, Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { clinicalPermissions, clientSessions } from "@workspace/db";
import {
  canUseDeidentifiedClinical,
  resolveMembershipTier,
} from "@workspace/field-kit-catalog";
import { db } from "../db";
import type { AuthedRequest } from "../auth/middleware";
import type { ClinicalOperationMode } from "./runtimeReadiness";
import { resolveClinicalOperationMode } from "./runtimeReadiness";

export type ClinicalAccess = {
  canUse: boolean;
  canReview: boolean;
  canAdmin: boolean;
};

export type { ClinicalOperationMode };

export function clinicalOperationMode(
  environment: NodeJS.ProcessEnv = process.env,
): ClinicalOperationMode {
  return resolveClinicalOperationMode(environment);
}

export function isPhiClinicalMode(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return clinicalOperationMode(environment) === "phi";
}

/**
 * Resolve clinical tool access for the current Membership member.
 *
 * Ordinary clinical tools remain deidentified. Patient review has its own
 * route and needs explicit clinical permission plus a recent MFA challenge.
 */
export async function resolveClinicalAccess(
  request: AuthedRequest,
): Promise<ClinicalAccess | null> {
  const member = request.fieldKit?.member;
  const organization = request.fieldKit?.org;
  if (
    !member ||
    !organization ||
    !request.clientMemberId ||
    !request.fieldKit?.allowed ||
    member.id !== request.clientMemberId ||
    member.organizationId !== organization.id ||
    member.status !== "active" ||
    (organization.status !== "active" &&
      !(
        organization.status === "trial" &&
        (!organization.trialEndsAt ||
          organization.trialEndsAt.getTime() > Date.now())
      ))
  )
    return null;

  const [permission] = await db
    .select()
    .from(clinicalPermissions)
    .where(
      and(
        eq(clinicalPermissions.organizationId, member.organizationId),
        eq(clinicalPermissions.memberId, request.clientMemberId),
      ),
    )
    .limit(1);

  const activePermission =
    permission &&
    permission.organizationId === organization.id &&
    permission.memberId === member.id &&
    !permission.revokedAt &&
    (permission.canUse || permission.canReview || permission.canAdmin)
      ? permission
      : null;
  const tier = resolveMembershipTier({
    billingPlan: request.fieldKit?.org?.billingPlan,
    organizationType: request.fieldKit?.org?.type,
    memberRole: member.role,
  });
  const explicitUse = Boolean(activePermission?.canUse);
  const canUse = canUseDeidentifiedClinical(tier, explicitUse, member.role);
  return {
    canUse,
    canReview: Boolean(activePermission?.canReview),
    canAdmin: Boolean(activePermission?.canAdmin),
  };
}

export async function requireClinicalUse(
  request: AuthedRequest,
  response: Response,
  next: NextFunction,
) {
  try {
    const access = await resolveClinicalAccess(request);
    if (!access?.canUse) {
      return response.status(403).json({
        error: "Clinical tool access has not been granted.",
        code: "CLINICAL_ACCESS_REQUIRED",
      });
    }
    request.clinicalAccess = access;
    next();
  } catch (error) {
    next(error);
  }
}

/** Existing clinical preparation is public policy / MFA, never patient access. */
export async function requireClinicalPrerequisite(
  request: AuthedRequest,
  response: Response,
  next: NextFunction,
) {
  try {
    const access = await resolveClinicalAccess(request);
    if (!access || !(access.canUse || access.canReview || access.canAdmin)) {
      return response.status(403).json({
        error: "Clinical tool access has not been granted.",
        code: "CLINICAL_ACCESS_REQUIRED",
      });
    }
    request.clinicalAccess = access;
    next();
  } catch (error) {
    next(error);
  }
}

/** One actor-bound recent step-up check for review and privilege changes. */
export async function hasRecentClinicalMfa(
  request: AuthedRequest,
): Promise<boolean> {
  if (!request.sessionId || !request.clientMemberId) return false;
  const [session] = await db
    .select({ verified: clientSessions.mfaVerifiedAt })
    .from(clientSessions)
    .where(
      and(
        eq(clientSessions.id, request.sessionId),
        eq(clientSessions.memberId, request.clientMemberId),
        gt(clientSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  const age = session?.verified ? Date.now() - session.verified.getTime() : NaN;
  return Number.isFinite(age) && age >= 0 && age <= 15 * 60_000;
}

export async function requireClinicalReview(
  request: AuthedRequest,
  response: Response,
  next: NextFunction,
) {
  try {
    // Review is its own explicit permission, independent of deidentified use or
    // clinical administration. Resolve current server-side tenant authority.
    const access = await resolveClinicalAccess(request);
    if (!access?.canReview) {
      return response.status(403).json({
        error: "Clinical reviewer access is required.",
        code: "CLINICAL_REVIEW_REQUIRED",
      });
    }
    request.clinicalAccess = access;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireClinicalAdmin(
  request: AuthedRequest,
  response: Response,
  next: NextFunction,
) {
  try {
    const access = await resolveClinicalAccess(request);
    if (!access?.canAdmin) {
      return response.status(403).json({
        error: "Clinical administrator access is required.",
        code: "CLINICAL_ADMIN_REQUIRED",
      });
    }
    request.clinicalAccess = access;
    next();
  } catch (error) {
    next(error);
  }
}
