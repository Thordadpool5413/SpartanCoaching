import type { NextFunction, Response } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { clinicalPermissions, clientSessions } from "@workspace/db";
import { db } from "../db";
import type { AuthedRequest } from "../auth/middleware";

export type ClinicalAccess = {
  canUse: boolean;
  canReview: boolean;
  canAdmin: boolean;
};

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
        isNull(clinicalPermissions.revokedAt),
      ),
    )
    .limit(1);
  if (!permission) return null;
  return {
    canUse: permission.canUse,
    canReview: permission.canReview,
    canAdmin: permission.canAdmin,
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
