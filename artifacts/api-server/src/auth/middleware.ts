import type { Request, Response, NextFunction } from "express";
import { clientSessions, clientMembers, clientOrganizations } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { hashToken } from "./crypto";
import { evaluateFieldKitAccess, refreshOrgStatus, type FieldKitAccess } from "./entitlement";
import { db } from "../db";

const COOKIE_NAME = "spartan_session";
const SESSION_DAYS = 30;

export { COOKIE_NAME, SESSION_DAYS };

export type AuthedRequest = Request & {
  clientMemberId?: number;
  fieldKit?: FieldKitAccess;
};

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
  if (!req.fieldKit?.member || req.fieldKit.member.role !== "org_admin") {
    return res.status(403).json({ error: "Organization admin required", code: "ORG_ADMIN_REQUIRED" });
  }
  next();
}
