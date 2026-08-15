import type { NextFunction, Response } from "express";
import { and, eq } from "drizzle-orm";
import { clinicalPermissions, clientSessions } from "@workspace/db";
import {
  canUseDeidentifiedClinical,
  canUsePhiClinical,
  resolveMembershipTier,
} from "@workspace/field-kit-catalog";
import { db } from "../db";
import type { AuthedRequest } from "../auth/middleware";
import {
  clinicalRuntimeReadiness,
  resolveClinicalOperationMode,
  type ClinicalOperationMode,
} from "./runtimeReadiness";

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

function isOrgClinicalAdmin(role: string | undefined): boolean {
  return role === "org_admin" || role === "platform_admin";
}

/**
 * Resolve clinical tool access for the current Membership member.
 *
 * De-identified mode: all entitled Membership members may use clinical education tools.
 * PHI mode: explicit permission rows only (including revokes). Default deny when no row.
 * Break-glass auto-grant: set CLINICAL_AUTO_GRANT=1 when runtime is ready (ops only).
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
  const admin = isOrgClinicalAdmin(member.role);

  if (!isPhiClinicalMode()) {
    const canUse = canUseDeidentifiedClinical(tier, explicitUse, member.role);
    if (!canUse) return null;
    return {
      canUse,
      canReview: Boolean(activePermission?.canReview),
      canAdmin: member.role === "platform_admin" || Boolean(activePermission?.canAdmin),
    };
  }

  if (activePermission && canUsePhiClinical(tier, explicitUse, member.role)) {
    return {
      canUse: activePermission.canUse,
      canReview: activePermission.canReview,
      canAdmin: activePermission.canAdmin || member.role === "platform_admin",
    };
  }

  // Default deny without a grant row. Optional break-glass for emergency ops.
  const autoGrant =
    process.env.CLINICAL_AUTO_GRANT === "1" || process.env.CLINICAL_AUTO_GRANT === "true";
  if (!autoGrant) return null;

  const readiness = clinicalRuntimeReadiness();
  if (!readiness.ready) return null;

  if (request.fieldKit?.org?.type !== "company") return null;
  return {
    canUse: true,
    canReview: admin,
    canAdmin: admin,
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
    if (!isPhiClinicalMode()) {
      request.clinicalAccess = access;
      next();
      return;
    }
    if (!request.sessionId) {
      return response.status(401).json({
        error: "Authentication required.",
        code: "UNAUTHENTICATED",
      });
    }
    const [session] = await db
      .select({ mfaVerifiedAt: clientSessions.mfaVerifiedAt })
      .from(clientSessions)
      .where(eq(clientSessions.id, request.sessionId))
      .limit(1);
    const verifiedAt = session?.mfaVerifiedAt?.getTime() ?? 0;
    if (Date.now() - verifiedAt > 15 * 60 * 1000) {
      return response.status(403).json({
        error: "Clinical access requires a recent email verification code.",
        code: "CLINICAL_MFA_REQUIRED",
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
