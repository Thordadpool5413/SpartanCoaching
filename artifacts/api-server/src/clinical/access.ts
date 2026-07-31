import type { NextFunction, Response } from "express";
import { and, eq } from "drizzle-orm";
import { clinicalPermissions, clientSessions } from "@workspace/db";
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
 * Resolve clinical tool access for the current Field Kit member.
 *
 * De-identified mode: all entitled Field Kit members may use clinical education tools.
 * PHI mode: explicit permission rows win (including revokes). When no row exists and
 * the PHI runtime is fully ready (BAAs + infrastructure), entitled members receive
 * operational canUse access so production is not blocked on manual grants. Org and
 * platform admins also receive review/admin when auto-granted.
 */
export async function resolveClinicalAccess(
  request: AuthedRequest,
): Promise<ClinicalAccess | null> {
  const member = request.fieldKit?.member;
  if (!member || !request.clientMemberId) return null;

  if (!isPhiClinicalMode()) {
    return {
      canUse: true,
      canReview: false,
      canAdmin: isOrgClinicalAdmin(member.role),
    };
  }

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

  if (permission) {
    if (permission.revokedAt) return null;
    if (!permission.canUse && !permission.canReview && !permission.canAdmin) {
      return null;
    }
    return {
      canUse: permission.canUse,
      canReview: permission.canReview,
      canAdmin: permission.canAdmin,
    };
  }

  const readiness = clinicalRuntimeReadiness();
  if (!readiness.ready) return null;

  const admin = isOrgClinicalAdmin(member.role);
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
