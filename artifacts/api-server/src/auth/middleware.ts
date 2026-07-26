import type { Request, Response, NextFunction } from "express";
import { clientSessions, clientMembers, clientOrganizations } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { hashToken } from "./crypto";
import { evaluateFieldKitAccess, refreshOrgStatus, type FieldKitAccess } from "./entitlement";
import { db } from "../db";
export { isAdminRequest, requireAdmin } from "./adminAuthorization";

const COOKIE_NAME = "spartan_session";
/** Session lifetime in days */
const SESSION_DAYS = 14;
/** Cap concurrent sessions per member (oldest pruned on login) */
const MAX_SESSIONS_PER_MEMBER = 8;

export { COOKIE_NAME, SESSION_DAYS, MAX_SESSIONS_PER_MEMBER };

export type AuthedRequest = Request & {
  clientMemberId?: number;
  fieldKit?: FieldKitAccess;
  sessionId?: number;
  clinicalAccess?: {
    canUse: boolean;
    canReview: boolean;
    canAdmin: boolean;
  };
};

function isDeployedRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.REPLIT_DEPLOYMENT === "1" ||
    process.env.REPLIT_DEPLOYMENT === "true"
  );
}

export function useSecureCookies(): boolean {
  return (
    isDeployedRuntime() ||
    process.env.FORCE_SECURE_COOKIES === "1" ||
    process.env.FORCE_SECURE_COOKIES === "true"
  );
}

function extractSessionToken(req: Request): string | null {
  const cookie = req.cookies?.[COOKIE_NAME];
  if (cookie && typeof cookie === "string") return cookie;

  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

export async function loadSession(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const token = extractSessionToken(req);
    if (!token) return next();

    const tokenHash = hashToken(token);
    const [session] = await db
      .select()
      .from(clientSessions)
      .where(and(eq(clientSessions.tokenHash, tokenHash), gt(clientSessions.expiresAt, new Date())))
      .limit(1);

    if (!session) return next();

    const [member] = await db
      .select()
      .from(clientMembers)
      .where(eq(clientMembers.id, session.memberId))
      .limit(1);
    if (!member || member.status === "disabled") return next();

    const [org] = await db
      .select()
      .from(clientOrganizations)
      .where(eq(clientOrganizations.id, member.organizationId))
      .limit(1);
    if (!org) return next();

    const freshOrg = await refreshOrgStatus(org);
    req.clientMemberId = member.id;
    req.sessionId = session.id;
    req.fieldKit = evaluateFieldKitAccess(member, freshOrg);
    next();
  } catch (err) {
    next(err);
  }
}

/** Requires a valid login session (member present). Does not require Field Kit entitlement. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.clientMemberId || !req.fieldKit?.member) {
    return res.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
  }
  next();
}

/** Requires active Field Kit access (trial or active org). */
export function requireFieldKit(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.clientMemberId || !req.fieldKit?.member) {
    return res.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
  }
  if (!req.fieldKit.allowed) {
    return res.status(403).json({
      error: "Field Kit access is not active",
      code: "FIELD_KIT_DENIED",
      reason: req.fieldKit.reason,
    });
  }
  next();
}

export function requireOrgAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const role = req.fieldKit?.member?.role;
  if (!req.fieldKit?.member || (role !== "org_admin" && role !== "platform_admin")) {
    return res.status(403).json({ error: "Organization admin required", code: "ORG_ADMIN_REQUIRED" });
  }
  next();
}
