import type { Express, Response } from "express";
import rateLimit from "express-rate-limit";
import { eq, desc, sql, and, isNull, ne, gte } from "drizzle-orm";
import {
  accessRequests,
  clientMembers,
  clientOrganizations,
  clientSessions,
  authTokens,
  authEvents,
  orgInvites,
  usageEvents,
  requestAccessBodySchema,
  loginBodySchema,
  setPasswordBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  approveAccessBodySchema,
  rejectAccessBodySchema,
  orgStatusBodySchema,
  inviteMemberBodySchema,
} from "@workspace/db";
import { db } from "../db";
import { generateToken, hashToken, hashPassword, verifyPassword } from "../auth/crypto";
import {
  COOKIE_NAME,
  SESSION_DAYS,
  requireAuth,
  requireOrgAdmin,
  type AuthedRequest,
} from "../auth/middleware";
import { getAccessForMemberId, publicMember, publicOrg } from "../auth/entitlement";
import {
  sendAccessRequestReceived,
  sendAccessRequestAdminAlert,
  sendAccessApprovedEmail,
  sendPasswordResetEmail,
  sendOrgInviteEmail,
} from "../resend";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "5413";

function requireAdmin(req: any, res: any, next: any) {
  const auth = req.headers["x-admin-auth"];
  if (auth !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

const requestAccessLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many access requests from this network. Please try again later." },
});

function getSiteUrl(): string {
  return (
    process.env.SITE_URL ||
    (process.env.REPLIT_DEPLOYMENT_URL ? `https://${process.env.REPLIT_DEPLOYMENT_URL}` : "") ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "") ||
    "https://spartanhospicecoaching.com"
  );
}

function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

async function createSession(memberId: number, userAgent?: string) {
  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(clientSessions).values({
    memberId,
    tokenHash,
    expiresAt,
    userAgent: userAgent?.slice(0, 500) ?? null,
  });
  return { token, expiresAt };
}

async function createAuthToken(memberId: number, purpose: string, hoursValid: number) {
  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000);
  await db.insert(authTokens).values({
    memberId,
    tokenHash,
    purpose,
    expiresAt,
  });
  return token;
}

async function logEvent(type: string, memberId?: number | null, meta?: Record<string, unknown>) {
  try {
    await db.insert(authEvents).values({
      memberId: memberId ?? null,
      type,
      meta: meta ?? null,
    });
  } catch {
    // non-fatal
  }
}

const DEFAULT_INDIVIDUAL_TRIAL_HOURS = 24;
const DEFAULT_COMPANY_TRIAL_HOURS = 72;

export function registerAuthRoutes(app: Express): void {
  // loadSession is mounted globally in app.ts so requireFieldKit sees the session

  // ── Public: request access ─────────────────────────────────────────
  app.post("/api/auth/request-access", requestAccessLimiter, async (req, res) => {
    try {
      const parsed = requestAccessBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }
      const body = parsed.data;
      const email = body.email.toLowerCase().trim();

      if (body.type === "company" && !body.companyName?.trim()) {
        return res.status(400).json({ error: "Company name is required for organization access." });
      }

      const [existingPending] = await db
        .select()
        .from(accessRequests)
        .where(and(eq(accessRequests.email, email), eq(accessRequests.status, "pending")))
        .limit(1);
      if (existingPending) {
        return res.status(409).json({
          error: "You already have a pending request. We will review it within one business day.",
        });
      }

      const [existingMember] = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.email, email))
        .limit(1);
      if (existingMember && existingMember.status !== "disabled") {
        return res.status(409).json({
          error: "An account with this email already exists. Please log in instead.",
          code: "ACCOUNT_EXISTS",
        });
      }

      const seats =
        body.type === "company"
          ? Math.max(1, body.seatsRequested ?? 5)
          : 1;

      const [row] = await db
        .insert(accessRequests)
        .values({
          type: body.type,
          name: body.name.trim(),
          email,
          companyName: body.companyName?.trim() || null,
          jobTitle: body.jobTitle?.trim() || null,
          role: body.role?.trim() || null,
          teamSize: body.teamSize?.trim() || null,
          primaryGoal: body.primaryGoal?.trim() || null,
          market: body.market?.trim() || null,
          message: body.message?.trim() || null,
          seatsRequested: seats,
          status: "pending",
        })
        .returning();

      await logEvent("access_request_created", null, { requestId: row.id, email, type: body.type });

      sendAccessRequestReceived(email, body.name.trim()).catch(() => {});
      sendAccessRequestAdminAlert({
        name: body.name.trim(),
        email,
        type: body.type,
        companyName: body.companyName,
        role: body.role,
        primaryGoal: body.primaryGoal,
        seatsRequested: seats,
        message: body.message,
      }).catch(() => {});

      return res.status(201).json({
        ok: true,
        message: "Request received. We will review within one business day.",
        requestId: row.id,
      });
    } catch (err) {
      console.error("request-access error:", err);
      return res.status(500).json({ error: "Unable to submit request" });
    }
  });

  // ── Auth: login / logout / me ──────────────────────────────────────
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const parsed = loginBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const email = parsed.data.email.toLowerCase().trim();
      const [member] = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.email, email))
        .limit(1);

      if (!member?.passwordHash || member.status === "disabled") {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      if (member.status === "invited") {
        return res.status(403).json({
          error: "Please set your password using the link from your approval email first.",
          code: "PASSWORD_NOT_SET",
        });
      }

      const valid = await verifyPassword(parsed.data.password, member.passwordHash);
      if (!valid) {
        await logEvent("login_failed", member.id, { email });
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const { token, expiresAt } = await createSession(
        member.id,
        req.headers["user-agent"] as string | undefined,
      );
      await db
        .update(clientMembers)
        .set({ lastLoginAt: new Date() })
        .where(eq(clientMembers.id, member.id));
      await logEvent("login_success", member.id);

      setSessionCookie(res, token, expiresAt);
      const access = await getAccessForMemberId(member.id);

      return res.json({
        member: publicMember(member),
        organization: access.org ? publicOrg(access.org) : null,
        fieldKit: {
          allowed: access.allowed,
          reason: access.reason ?? null,
          trialEndsAt: access.trialEndsAt ?? null,
          hoursRemaining: access.hoursRemaining ?? null,
        },
        // Mobile clients use bearer token
        token,
        expiresAt,
      });
    } catch (err) {
      console.error("login error:", err);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req: AuthedRequest, res) => {
    try {
      const token =
        req.cookies?.[COOKIE_NAME] ||
        (req.headers.authorization?.startsWith("Bearer ")
          ? req.headers.authorization.slice(7)
          : null);
      if (token) {
        await db.delete(clientSessions).where(eq(clientSessions.tokenHash, hashToken(token)));
      }
      if (req.clientMemberId) await logEvent("logout", req.clientMemberId);
      clearSessionCookie(res);
      return res.json({ ok: true });
    } catch (err) {
      clearSessionCookie(res);
      return res.json({ ok: true });
    }
  });

  app.get("/api/auth/me", async (req: AuthedRequest, res) => {
    if (!req.clientMemberId || !req.fieldKit?.member) {
      return res.status(401).json({ error: "Not authenticated", code: "UNAUTHENTICATED" });
    }
    const access = req.fieldKit;
    let seatCount = 0;
    if (access.org) {
      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(clientMembers)
        .where(
          and(
            eq(clientMembers.organizationId, access.org.id),
            ne(clientMembers.status, "disabled"),
          ),
        );
      seatCount = countRow?.count ?? 0;
    }
    return res.json({
      member: publicMember(access.member!),
      organization: access.org ? { ...publicOrg(access.org), seatCount } : null,
      fieldKit: {
        allowed: access.allowed,
        reason: access.reason ?? null,
        trialEndsAt: access.trialEndsAt ?? null,
        hoursRemaining: access.hoursRemaining ?? null,
      },
    });
  });

  // ── Set password (from approval / invite) ──────────────────────────
  app.post("/api/auth/set-password", authLimiter, async (req, res) => {
    try {
      const parsed = setPasswordBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request. Password must be at least 8 characters and terms must be accepted." });
      }
      const tokenHash = hashToken(parsed.data.token);
      const [row] = await db
        .select()
        .from(authTokens)
        .where(
          and(
            eq(authTokens.tokenHash, tokenHash),
            isNull(authTokens.usedAt),
          ),
        )
        .limit(1);

      if (!row || row.expiresAt.getTime() < Date.now()) {
        return res.status(400).json({ error: "This link is invalid or has expired." });
      }
      if (row.purpose !== "set_password" && row.purpose !== "invite") {
        return res.status(400).json({ error: "Invalid token purpose." });
      }

      const passwordHash = await hashPassword(parsed.data.password);
      const [member] = await db
        .update(clientMembers)
        .set({
          passwordHash,
          status: "active",
          termsAcceptedAt: new Date(),
          lastLoginAt: new Date(),
        })
        .where(eq(clientMembers.id, row.memberId))
        .returning();

      if (!member) {
        return res.status(400).json({ error: "Account not found for this link." });
      }

      await db
        .update(authTokens)
        .set({ usedAt: new Date() })
        .where(eq(authTokens.id, row.id));

      // Mark invite accepted if any
      await db
        .update(orgInvites)
        .set({ status: "accepted" })
        .where(and(eq(orgInvites.email, member.email), eq(orgInvites.status, "pending")));

      const { token, expiresAt } = await createSession(
        member.id,
        req.headers["user-agent"] as string | undefined,
      );
      setSessionCookie(res, token, expiresAt);
      await logEvent("password_set", member.id);

      const access = await getAccessForMemberId(member.id);
      return res.json({
        member: publicMember(member),
        organization: access.org ? publicOrg(access.org) : null,
        fieldKit: {
          allowed: access.allowed,
          reason: access.reason ?? null,
          trialEndsAt: access.trialEndsAt ?? null,
          hoursRemaining: access.hoursRemaining ?? null,
        },
        token,
        expiresAt,
      });
    } catch (err) {
      console.error("set-password error:", err);
      return res.status(500).json({ error: "Unable to set password" });
    }
  });

  app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
    try {
      const parsed = forgotPasswordBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Valid email required" });
      }
      const email = parsed.data.email.toLowerCase().trim();
      // Always return ok to avoid email enumeration
      const [member] = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.email, email))
        .limit(1);

      if (member && member.status !== "disabled" && member.passwordHash) {
        const token = await createAuthToken(member.id, "reset_password", 1);
        const resetUrl = `${getSiteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
        await sendPasswordResetEmail(member.email, member.name, resetUrl);
        await logEvent("password_reset_requested", member.id);
      }

      return res.json({
        ok: true,
        message: "If an account exists for that email, a reset link has been sent.",
      });
    } catch (err) {
      console.error("forgot-password error:", err);
      return res.json({
        ok: true,
        message: "If an account exists for that email, a reset link has been sent.",
      });
    }
  });

  app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
    try {
      const parsed = resetPasswordBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request. Password must be at least 8 characters." });
      }
      const tokenHash = hashToken(parsed.data.token);
      const [row] = await db
        .select()
        .from(authTokens)
        .where(and(eq(authTokens.tokenHash, tokenHash), isNull(authTokens.usedAt)))
        .limit(1);

      if (!row || row.purpose !== "reset_password" || row.expiresAt.getTime() < Date.now()) {
        return res.status(400).json({ error: "This reset link is invalid or has expired." });
      }

      const passwordHash = await hashPassword(parsed.data.password);
      await db
        .update(clientMembers)
        .set({ passwordHash, status: "active" })
        .where(eq(clientMembers.id, row.memberId));
      await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, row.id));
      // Invalidate existing sessions
      await db.delete(clientSessions).where(eq(clientSessions.memberId, row.memberId));
      await logEvent("password_reset_completed", row.memberId);

      return res.json({ ok: true, message: "Password updated. You can log in now." });
    } catch (err) {
      console.error("reset-password error:", err);
      return res.status(500).json({ error: "Unable to reset password" });
    }
  });

  // ── Admin Access Desk ──────────────────────────────────────────────
  app.get("/api/admin/access-requests", requireAdmin, async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(accessRequests)
        .orderBy(desc(accessRequests.createdAt))
        .limit(200);
      return res.json({ requests: rows });
    } catch (err) {
      console.error("list access-requests error:", err);
      return res.status(500).json({ error: "Failed to load requests" });
    }
  });

  app.get("/api/admin/organizations", requireAdmin, async (_req, res) => {
    try {
      const orgs = await db
        .select()
        .from(clientOrganizations)
        .orderBy(desc(clientOrganizations.createdAt))
        .limit(200);
      const members = await db.select().from(clientMembers).limit(1000);
      const enriched = orgs.map((org) => {
        const orgMembers = members.filter((m) => m.organizationId === org.id);
        return {
          ...org,
          memberCount: orgMembers.filter((m) => m.status !== "disabled").length,
          members: orgMembers.map((m) => ({
            id: m.id,
            email: m.email,
            name: m.name,
            role: m.role,
            status: m.status,
            lastLoginAt: m.lastLoginAt,
          })),
        };
      });
      return res.json({ organizations: enriched });
    } catch (err) {
      console.error("list orgs error:", err);
      return res.status(500).json({ error: "Failed to load organizations" });
    }
  });

  /** Lightweight Access Desk metrics */
  app.get("/api/admin/access-metrics", requireAdmin, async (_req, res) => {
    try {
      const allRequests = await db.select().from(accessRequests).limit(2000);
      const allOrgs = await db.select().from(clientOrganizations).limit(2000);
      const allMembers = await db.select().from(clientMembers).limit(5000);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [usageWeek] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(usageEvents)
        .where(gte(usageEvents.createdAt, weekAgo));

      const countBy = <T extends string>(items: { status: string }[], status: T) =>
        items.filter((i) => i.status === status).length;

      return res.json({
        requests: {
          total: allRequests.length,
          pending: countBy(allRequests, "pending"),
          approved: countBy(allRequests, "approved"),
          rejected: countBy(allRequests, "rejected"),
        },
        organizations: {
          total: allOrgs.length,
          trial: countBy(allOrgs, "trial"),
          active: countBy(allOrgs, "active"),
          expired: countBy(allOrgs, "expired"),
          suspended: countBy(allOrgs, "suspended"),
        },
        members: {
          total: allMembers.length,
          active: countBy(allMembers, "active"),
          loggedIn7d: allMembers.filter(
            (m) => m.lastLoginAt && m.lastLoginAt.getTime() > weekAgo.getTime(),
          ).length,
        },
        toolUsesLast7Days: usageWeek?.count ?? 0,
      });
    } catch (err) {
      console.error("access-metrics error:", err);
      return res.status(500).json({ error: "Failed to load metrics" });
    }
  });

  app.post("/api/admin/access-requests/:id/approve", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

      const parsed = approveAccessBodySchema.safeParse(req.body ?? {});
      const body = parsed.success ? parsed.data : {};

      const [request] = await db
        .select()
        .from(accessRequests)
        .where(eq(accessRequests.id, id))
        .limit(1);
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "pending") {
        return res.status(400).json({ error: `Request is already ${request.status}` });
      }

      const isCompany = request.type === "company";
      const trialHours =
        body.trialHours ??
        (isCompany ? DEFAULT_COMPANY_TRIAL_HOURS : DEFAULT_INDIVIDUAL_TRIAL_HOURS);
      const seats = body.seats ?? request.seatsRequested ?? (isCompany ? 5 : 1);
      const trialEndsAt = new Date(Date.now() + trialHours * 60 * 60 * 1000);
      const orgName =
        (isCompany ? request.companyName : null)?.trim() ||
        `${request.name}'s Workspace`;

      const [org] = await db
        .insert(clientOrganizations)
        .values({
          name: orgName,
          type: isCompany ? "company" : "personal",
          seatLimit: seats,
          status: "trial",
          trialEndsAt,
          notes: body.adminNote ?? null,
        })
        .returning();

      const email = request.email.toLowerCase();
      const [existingMember] = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.email, email))
        .limit(1);

      let member;
      if (existingMember) {
        // Re-enable a previously disabled account onto the new org
        const [updated] = await db
          .update(clientMembers)
          .set({
            name: request.name,
            title: request.jobTitle ?? null,
            role: "org_admin",
            organizationId: org.id,
            status: "invited",
            passwordHash: null,
          })
          .where(eq(clientMembers.id, existingMember.id))
          .returning();
        member = updated;
      } else {
        const [created] = await db
          .insert(clientMembers)
          .values({
            email,
            name: request.name,
            title: request.jobTitle ?? null,
            role: "org_admin",
            organizationId: org.id,
            status: "invited",
            passwordHash: null,
          })
          .returning();
        member = created;
      }

      if (!member) {
        return res.status(500).json({ error: "Failed to create member account" });
      }

      await db
        .update(accessRequests)
        .set({
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: "admin",
          adminNote: body.adminNote ?? null,
          resultingMemberId: member.id,
          resultingOrgId: org.id,
        })
        .where(eq(accessRequests.id, id));

      const token = await createAuthToken(member.id, "set_password", 48);
      const setPasswordUrl = `${getSiteUrl()}/set-password?token=${encodeURIComponent(token)}`;
      await sendAccessApprovedEmail(member.email, member.name, setPasswordUrl, trialHours);
      await logEvent("access_approved", member.id, {
        requestId: id,
        orgId: org.id,
        trialHours,
      });

      return res.json({
        ok: true,
        organization: publicOrg(org),
        member: publicMember(member),
        trialHours,
      });
    } catch (err) {
      console.error("approve access error:", err);
      return res.status(500).json({ error: "Failed to approve request" });
    }
  });

  app.post("/api/admin/access-requests/:id/reject", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const parsed = rejectAccessBodySchema.safeParse(req.body ?? {});
      const note = parsed.success ? parsed.data.adminNote : undefined;

      const [request] = await db
        .select()
        .from(accessRequests)
        .where(eq(accessRequests.id, id))
        .limit(1);
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "pending") {
        return res.status(400).json({ error: `Request is already ${request.status}` });
      }

      await db
        .update(accessRequests)
        .set({
          status: "rejected",
          reviewedAt: new Date(),
          reviewedBy: "admin",
          adminNote: note ?? null,
        })
        .where(eq(accessRequests.id, id));
      await logEvent("access_rejected", null, { requestId: id });

      return res.json({ ok: true });
    } catch (err) {
      console.error("reject access error:", err);
      return res.status(500).json({ error: "Failed to reject request" });
    }
  });

  app.patch("/api/admin/organizations/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const parsed = orgStatusBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid status payload" });
      }
      const { status, trialHours, notes } = parsed.data;
      const patch: Record<string, unknown> = { status };
      if (notes !== undefined) patch.notes = notes;
      if (status === "trial" && trialHours) {
        patch.trialEndsAt = new Date(Date.now() + trialHours * 60 * 60 * 1000);
      }
      if (status === "active") {
        patch.activatedAt = new Date();
        patch.trialEndsAt = null;
      }
      if (status === "expired") {
        patch.trialEndsAt = new Date();
      }

      const [org] = await db
        .update(clientOrganizations)
        .set(patch as any)
        .where(eq(clientOrganizations.id, id))
        .returning();
      if (!org) return res.status(404).json({ error: "Organization not found" });
      await logEvent("org_status_changed", null, { orgId: id, status, trialHours });
      return res.json({ organization: publicOrg(org) });
    } catch (err) {
      console.error("org status error:", err);
      return res.status(500).json({ error: "Failed to update organization" });
    }
  });

  app.post("/api/admin/organizations/:id/extend-trial", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const hours = Number(req.body?.hours ?? 24);
      if (!Number.isFinite(hours) || hours < 1 || hours > 720) {
        return res.status(400).json({ error: "hours must be 1–720" });
      }
      const [org] = await db
        .select()
        .from(clientOrganizations)
        .where(eq(clientOrganizations.id, id))
        .limit(1);
      if (!org) return res.status(404).json({ error: "Organization not found" });

      const base =
        org.status === "trial" && org.trialEndsAt && org.trialEndsAt.getTime() > Date.now()
          ? org.trialEndsAt.getTime()
          : Date.now();
      const trialEndsAt = new Date(base + hours * 60 * 60 * 1000);

      const [updated] = await db
        .update(clientOrganizations)
        .set({ status: "trial", trialEndsAt })
        .where(eq(clientOrganizations.id, id))
        .returning();
      await logEvent("org_trial_extended", null, { orgId: id, hours });
      return res.json({ organization: publicOrg(updated) });
    } catch (err) {
      console.error("extend trial error:", err);
      return res.status(500).json({ error: "Failed to extend trial" });
    }
  });

  // ── Org admin: members & invites ───────────────────────────────────
  app.get("/api/org/members", requireAuth, requireOrgAdmin, async (req: AuthedRequest, res) => {
    const orgId = req.fieldKit!.org!.id;
    const members = await db
      .select()
      .from(clientMembers)
      .where(eq(clientMembers.organizationId, orgId));
    const invites = await db
      .select()
      .from(orgInvites)
      .where(and(eq(orgInvites.organizationId, orgId), eq(orgInvites.status, "pending")));
    return res.json({
      members: members.map((m) => publicMember(m)),
      invites: invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        status: i.status,
        expiresAt: i.expiresAt,
      })),
      seatLimit: req.fieldKit!.org!.seatLimit,
    });
  });

  /** Light org usage summary for company admins (last 7 days) */
  app.get("/api/org/usage", requireAuth, requireOrgAdmin, async (req: AuthedRequest, res) => {
    try {
      const orgId = req.fieldKit!.org!.id;
      const members = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.organizationId, orgId));
      const emailSet = new Set(members.map((m) => m.email.toLowerCase()));
      if (emailSet.size === 0) {
        return res.json({ total: 0, byTool: [], byMember: [], days: 7 });
      }

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recent = await db
        .select()
        .from(usageEvents)
        .where(gte(usageEvents.createdAt, weekAgo))
        .limit(5000);

      const rows = recent.filter((r) => emailSet.has(String(r.email || "").toLowerCase()));

      const byToolMap = new Map<string, number>();
      const byMemberMap = new Map<string, number>();
      for (const r of rows) {
        byToolMap.set(r.toolName, (byToolMap.get(r.toolName) || 0) + 1);
        const key = String(r.email).toLowerCase();
        byMemberMap.set(key, (byMemberMap.get(key) || 0) + 1);
      }

      return res.json({
        total: rows.length,
        days: 7,
        byTool: [...byToolMap.entries()]
          .map(([toolName, count]) => ({ toolName, count }))
          .sort((a, b) => b.count - a.count),
        byMember: [...byMemberMap.entries()]
          .map(([email, count]) => ({ email, count }))
          .sort((a, b) => b.count - a.count),
      });
    } catch (err) {
      console.error("org usage error:", err);
      return res.status(500).json({ error: "Failed to load usage" });
    }
  });

  app.post("/api/org/invites", requireAuth, requireOrgAdmin, async (req: AuthedRequest, res) => {
    try {
      const parsed = inviteMemberBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Valid email and name required" });
      }
      const org = req.fieldKit!.org!;
      const email = parsed.data.email.toLowerCase().trim();

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(clientMembers)
        .where(
          and(
            eq(clientMembers.organizationId, org.id),
            ne(clientMembers.status, "disabled"),
          ),
        );
      const activeCount = countRow?.count ?? 0;
      if (activeCount >= org.seatLimit) {
        return res.status(400).json({
          error: `Seat limit reached (${org.seatLimit}). Contact Spartan Coaching to add seats.`,
        });
      }

      const [existing] = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.email, email))
        .limit(1);
      if (existing) {
        return res.status(409).json({ error: "A member with this email already exists." });
      }

      const [member] = await db
        .insert(clientMembers)
        .values({
          email,
          name: parsed.data.name.trim(),
          role: parsed.data.role,
          organizationId: org.id,
          status: "invited",
          passwordHash: null,
        })
        .returning();

      const rawToken = generateToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(orgInvites).values({
        organizationId: org.id,
        email,
        role: parsed.data.role,
        tokenHash,
        status: "pending",
        expiresAt,
      });
      await db.insert(authTokens).values({
        memberId: member.id,
        tokenHash,
        purpose: "invite",
        expiresAt,
      });

      const url = `${getSiteUrl()}/set-password?token=${encodeURIComponent(rawToken)}`;
      await sendOrgInviteEmail(email, org.name, url, req.fieldKit!.member!.name);
      await logEvent("org_invite_sent", req.clientMemberId, { email, orgId: org.id });

      return res.status(201).json({ ok: true, member: publicMember(member) });
    } catch (err) {
      console.error("org invite error:", err);
      return res.status(500).json({ error: "Failed to send invite" });
    }
  });
}
