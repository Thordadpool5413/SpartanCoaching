import type { NextFunction, Response } from "express";
import { and, eq } from "drizzle-orm";
import { clinicalPermissions } from "@workspace/db";
import {
  canUseDeidentifiedClinical,
  resolveMembershipTier,
} from "@workspace/field-kit-catalog";
import { db } from "../db";
import type { AuthedRequest } from "../auth/middleware";
import type { ClinicalOperationMode } from "./runtimeReadiness";

export type ClinicalAccess = {
  canUse: boolean;
  canReview: boolean;
  canAdmin: boolean;
};

export type { ClinicalOperationMode };

export function clinicalOperationMode(
  _environment: NodeJS.ProcessEnv = process.env,
): ClinicalOperationMode {
  return "deidentified";
}

export function isPhiClinicalMode(
  _environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return false;
}

/**
 * Resolve clinical tool access for the current Membership member.
 *
 * Clinical tools are intentionally limited to deidentified education input.
 * No environment flag may turn PHI processing on for this product.
 */
export async function resolveClinicalAccess(
  request: AuthedRequest,
): Promise<ClinicalAccess | null> {
  const member = request.fieldKit?.member;
  if (!member || !request.clientMemberId) return null;

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
  if (!canUse) return null;
  return {
    canUse,
    canReview: Boolean(activePermission?.canReview),
    canAdmin: member.role === "platform_admin" || Boolean(activePermission?.canAdmin),
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

export function requireClinicalReview(
  request: AuthedRequest,
  response: Response,
  next: NextFunction,
) {
  if (!request.clinicalAccess?.canReview && !request.clinicalAccess?.canAdmin) {
    return response.status(403).json({
      error: "Clinical reviewer access is required.",
      code: "CLINICAL_REVIEW_REQUIRED",
    });
  }
  next();
}

export function requireClinicalAdmin(
  request: AuthedRequest,
  response: Response,
  next: NextFunction,
) {
  if (!request.clinicalAccess?.canAdmin) {
    return response.status(403).json({
      error: "Clinical administrator access is required.",
      code: "CLINICAL_ADMIN_REQUIRED",
    });
  }
  next();
}
