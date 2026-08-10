import { randomBytes } from "node:crypto";
import type { Express, Response } from "express";
import { eq, desc, sql, and, isNull, ne, gte, lt } from "drizzle-orm";
import {
  accessRequests,
  clientMembers,
  clientOrganizations,
  clientSessions,
  authTokens,
  authEvents,
  orgInvites,
  orgTimelineEvents,
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
  magicLinkRequestSchema,
  changePasswordBodySchema,
  extendEvaluationBodySchema,
  adminBootstrapBodySchema,
  orgPipelineBodySchema,
  orgNoteBodySchema,
  orgUpdateBodySchema,
  onboardingUpdateSchema,
  selfRegisterBodySchema,
  inquiries,
} from "@workspace/db";
import { db } from "../db";
import { generateToken, hashToken, hashPassword, verifyPassword, safeEqualString } from "../auth/crypto";
import {
  COOKIE_NAME,
  SESSION_DAYS,
  MAX_SESSIONS_PER_MEMBER,
  requireAuth,
  requireFieldKit,
  requireOrgAdmin,
  requireAdmin,
  isAdminRequest,
  useSecureCookies,
  type AuthedRequest,
} from "../auth/middleware";
import { getAccessForMemberId, publicMember, publicOrg } from "../auth/entitlement";
import {
  publicEntitlementPayload,
  resolveProductEntitlement,
} from "../billing/entitlementService";
import { isStripeConfigured } from "../billing/stripeClient";
import { runTrialLifecycleSweep } from "../auth/trialLifecycle";
import {
  runOpsDigest,
  runScheduledJobs,
  runSessionCleanup,
  buildOpsSnapshot,
} from "../auth/opsJobs";
import {
  loginLimit,
  authLimit,
  requestAccessLimit,
  registerLimit,
} from "../rateLimits";
import {
  sendAccessRequestReceived,
  sendAccessRequestAdminAlert,
  sendAccessApprovedEmail,
  sendAccessRejectedEmail,
  sendMembershipActivatedEmail,
  sendTrialExtendedEmail,
  sendPasswordResetEmail,
  sendOrgInviteEmail,
} from "../resend";
import { storage } from "../storage";

function isCronAuthorized(req: { headers: Record<string, unknown> }): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers["x-cron-secret"];
  return typeof header === "string" && safeEqualString(header, secret);
}

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
    secure: useSecureCookies(),
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    secure: useSecureCookies(),
    sameSite: "strict",
  });
}

async function pruneExpiredSessions(memberId: number) {
  await db
    .delete(clientSessions)
    .where(and(eq(clientSessions.memberId, memberId), lt(clientSessions.expiresAt, new Date())));
}

async function pruneExcessSessions(memberId: number) {
  const rows = await db
    .select({ id: clientSessions.id })
    .from(clientSessions)
    .where(eq(clientSessions.memberId, memberId))
    .orderBy(desc(clientSessions.createdAt));
  if (rows.length <= MAX_SESSIONS_PER_MEMBER) return;
  const toDrop = rows.slice(MAX_SESSIONS_PER_MEMBER).map((r) => r.id);
  for (const id of toDrop) {
    await db.delete(clientSessions).where(eq(clientSessions.id, id));
  }
}

async function createSession(memberId: number, userAgent?: string) {
  await pruneExpiredSessions(memberId);
  const token = generateToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(clientSessions).values({
    memberId,
    tokenHash,
    expiresAt,
    userAgent: userAgent?.slice(0, 500) ?? null,
  });
  await pruneExcessSessions(memberId);
  return { token, expiresAt };
}

function bootstrapTokenMatches(input: string): boolean {
  const expected = process.env.ADMIN_BOOTSTRAP_TOKEN?.trim();
  if (!expected || expected.length < 32) return false;
  return safeEqualString((input || "").trim(), expected);
}

type EmailDispatchResult = {
  sent: number;
  failed: number;
  errors: string[];
};

async function dispatchEmails(
  jobs: Array<() => Promise<boolean>>,
): Promise<EmailDispatchResult> {
  const result: EmailDispatchResult = { sent: 0, failed: 0, errors: [] };
  for (const job of jobs) {
    try {
      const ok = await job();
      if (ok) result.sent += 1;
      else {
        result.failed += 1;
        result.errors.push("Email provider returned failure");
      }
    } catch (err: any) {
      result.failed += 1;
      result.errors.push(err?.message || "Email send failed");
    }
  }
  return result;
}

function emailSummary(email: EmailDispatchResult): string {
  if (email.failed === 0 && email.sent > 0) {
    return email.sent === 1 ? "Email sent." : `${email.sent} emails sent.`;
  }
  if (email.sent === 0 && email.failed > 0) {
    return `Email failed: ${email.errors[0] || "unknown error"}`;
  }
  if (email.sent > 0 && email.failed > 0) {
    return `${email.sent} sent, ${email.failed} failed. ${email.errors[0] || ""}`.trim();
  }
  return "No email attempted.";
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

async function addOrgTimeline(
  organizationId: number,
  type: string,
  body: string,
  createdBy?: string | null,
  meta?: Record<string, unknown>,
) {
  try {
    await db.insert(orgTimelineEvents).values({
      organizationId,
      type,
      body,
      createdBy: createdBy ?? "system",
      meta: meta ?? null,
    });
  } catch (err) {
    console.error("addOrgTimeline failed:", err);
  }
}

const DEFAULT_COMPANY_TRIAL_HOURS = 72;

export function registerAuthRoutes(app: Express): void {
  // loadSession is mounted globally in app.ts so requireFieldKit sees the session

  // ── Public: request access ─────────────────────────────────────────
  app.post("/api/auth/request-access", requestAccessLimit, async (req, res) => {
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

      // CRM: mirror into inquiries so Access Desk + Inquiries stay connected
      try {
        await db.insert(inquiries).values({
          name: body.name.trim(),
          email,
          phone: "n/a",
          company: body.companyName?.trim() || null,
          serviceType: `Membership Access (${body.type})`,
          message: [
            body.role ? `Role: ${body.role}` : null,
            body.primaryGoal ? `Goal: ${body.primaryGoal}` : null,
            body.teamSize ? `Team size: ${body.teamSize}` : null,
            body.market ? `Market: ${body.market}` : null,
            body.message?.trim() || null,
          ]
            .filter(Boolean)
            .join("\n") || "Membership access request",
          submittedAt: Date.now(),
          isRead: false,
        });
      } catch {
        // non-fatal if inquiries insert fails
      }

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

  // ── Public: self-service individual registration ───────────────────
  app.post("/api/auth/register", registerLimit, async (req, res) => {
    try {
      const parsed = selfRegisterBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid registration data", details: parsed.error.flatten() });
      }
      const { name, email: rawEmail, password } = parsed.data;
      const email = rawEmail.toLowerCase().trim();

      // Reject if member already exists
      const [existingMember] = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.email, email))
        .limit(1);
      if (existingMember && existingMember.status !== "disabled") {
        return res.status(409).json({
          error: "An account with this email already exists. Please sign in instead.",
          code: "ACCOUNT_EXISTS",
        });
      }

      const passwordHash = await hashPassword(password);
      const orgName = `${name.trim()}'s Membership`;

      // Create personal org in expired state — requires subscription before accessing tools
      const [org] = await db
        .insert(clientOrganizations)
        .values({
          name: orgName,
          type: "personal",
          seatLimit: 1,
          status: "expired",
          pipelineStatus: "self_registered",
        })
        .returning();

      if (!org) {
        return res.status(500).json({ error: "Failed to create organization" });
      }

      // Create member with password already set (status active, not invited)
      let member;
      if (existingMember) {
        // Re-enable a previously disabled account onto the new org
        const [updated] = await db
          .update(clientMembers)
          .set({ name: name.trim(), role: "org_admin", organizationId: org.id, status: "active", passwordHash })
          .where(eq(clientMembers.id, existingMember.id))
          .returning();
        member = updated;
      } else {
        const [created] = await db
          .insert(clientMembers)
          .values({ email, name: name.trim(), role: "org_admin", organizationId: org.id, status: "active", passwordHash })
          .returning();
        member = created;
      }

      if (!member) {
        return res.status(500).json({ error: "Failed to create member account" });
      }

      await addOrgTimeline(org.id, "system", `Self-registered: ${name.trim()} <${email}>`, "system");
      await logEvent("self_register", member.id, { email, orgId: org.id });

      const { token, expiresAt } = await createSession(
        member.id,
        req.headers["user-agent"] as string | undefined,
      );
      await db.update(clientMembers).set({ lastLoginAt: new Date() }).where(eq(clientMembers.id, member.id));

      setSessionCookie(res, token, expiresAt);
      const access = await getAccessForMemberId(member.id);

      return res.status(201).json({
        member: publicMember(access.member || member),
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
      console.error("register error:", err);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  // ── Auth: login / logout / me ──────────────────────────────────────
  app.post("/api/auth/login", loginLimit, async (req, res) => {
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
        member: publicMember(access.member || member),
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

  /** End all sessions for the signed-in member (other devices). Keeps current session. */
  app.post("/api/auth/logout-others", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const memberId = req.clientMemberId!;
      const currentId = req.sessionId;
      if (currentId) {
        await db
          .delete(clientSessions)
          .where(and(eq(clientSessions.memberId, memberId), ne(clientSessions.id, currentId)));
      } else {
        await db.delete(clientSessions).where(eq(clientSessions.memberId, memberId));
      }
      await logEvent("logout_others", memberId);
      return res.json({ ok: true });
    } catch (err) {
      console.error("logout-others error:", err);
      return res.status(500).json({ error: "Unable to end other sessions" });
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
    const entitlement = access.org
      ? resolveProductEntitlement(access.member!, access.org, {
          activeMemberCount: seatCount,
          stripeConfigured: isStripeConfigured(),
          individualPriceConfigured: Boolean(
            process.env.STRIPE_PRICE_INDIVIDUAL_WEEKLY?.trim(),
          ),
        })
      : null;

    return res.json({
      member: publicMember(access.member!),
      organization: access.org ? { ...publicOrg(access.org), seatCount } : null,
      fieldKit: {
        allowed: access.allowed,
        reason: access.reason ?? null,
        trialEndsAt: access.trialEndsAt ?? null,
        hoursRemaining: access.hoursRemaining ?? null,
      },
      // Authoritative product + billing snapshot (web and iOS must not re-derive).
      entitlement: entitlement ? publicEntitlementPayload(entitlement) : null,
    });
  });

  // ── Onboarding profile + checklist ─────────────────────────────────
  app.get("/api/me/onboarding", requireAuth, async (req: AuthedRequest, res) => {
    const member = req.fieldKit!.member!;
    // re-fetch for latest checklist
    const [fresh] = await db
      .select()
      .from(clientMembers)
      .where(eq(clientMembers.id, member.id))
      .limit(1);
    return res.json({ member: publicMember(fresh || member) });
  });

  app.patch("/api/me/onboarding", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const parsed = onboardingUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid onboarding payload", details: parsed.error.flatten() });
      }
      const memberId = req.clientMemberId!;
      const [current] = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.id, memberId))
        .limit(1);
      if (!current) return res.status(404).json({ error: "Member not found" });

      const patch: Record<string, unknown> = {};
      if (parsed.data.jobRole !== undefined) patch.jobRole = parsed.data.jobRole;
      if (parsed.data.territoryNote !== undefined) patch.territoryNote = parsed.data.territoryNote;
      if (parsed.data.topObjections !== undefined) patch.topObjections = parsed.data.topObjections;

      let checklist = {
        ...(((current as any).checklistProgress || {}) as Record<string, boolean | string>),
      };
      if (parsed.data.checklist) {
        checklist = { ...checklist, ...parsed.data.checklist };
      }
      if (parsed.data.checklistItem) {
        const { id, done } = parsed.data.checklistItem;
        if (done) {
          checklist[id] = new Date().toISOString();
        } else {
          delete checklist[id];
        }
      }
      if (parsed.data.checklist || parsed.data.checklistItem) {
        patch.checklistProgress = checklist;
      }
      if (!(current as any).onboardingStartedAt) {
        patch.onboardingStartedAt = new Date();
      }

      const [updated] = await db
        .update(clientMembers)
        .set(patch as any)
        .where(eq(clientMembers.id, memberId))
        .returning();

      await logEvent("onboarding_updated", memberId, {
        keys: Object.keys(patch),
        checklistDone: publicMember(updated).checklistDone,
      });

      return res.json({ member: publicMember(updated) });
    } catch (err) {
      console.error("onboarding update error:", err);
      return res.status(500).json({ error: "Failed to update onboarding" });
    }
  });

  // ── Set password (from approval / invite) ──────────────────────────
  app.post("/api/auth/set-password", authLimit, async (req, res) => {
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

  app.post("/api/auth/forgot-password", loginLimit, async (req, res) => {
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

  app.post("/api/auth/reset-password", authLimit, async (req, res) => {
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
        const pub = orgMembers.map((m) => publicMember(m));
        return {
          ...org,
          memberCount: orgMembers.filter((m) => m.status !== "disabled").length,
          activatedCount: pub.filter((m) => m.activated).length,
          activated: pub.some((m) => m.activated),
          members: pub.map((m) => ({
            id: m.id,
            email: m.email,
            name: m.name,
            role: m.role,
            status: m.status,
            lastLoginAt: m.lastLoginAt,
            activated: m.activated,
            checklistDone: m.checklistDone,
            jobRole: m.jobRole,
          })),
        };
      });
      return res.json({ organizations: enriched });
    } catch (err) {
      console.error("list orgs error:", err);
      return res.status(500).json({ error: "Failed to load organizations" });
    }
  });

  /** Full org detail for Access Desk */
  app.get("/api/admin/organizations/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

      const [org] = await db
        .select()
        .from(clientOrganizations)
        .where(eq(clientOrganizations.id, id))
        .limit(1);
      if (!org) return res.status(404).json({ error: "Organization not found" });

      const members = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.organizationId, id));

      const membersPublic = members.map((m) => publicMember(m));
      const activatedCount = membersPublic.filter((m) => m.activated).length;

      const byOrg = await db
        .select()
        .from(accessRequests)
        .where(eq(accessRequests.resultingOrgId, id))
        .orderBy(desc(accessRequests.createdAt))
        .limit(50);
      const emails = new Set(members.map((m) => m.email.toLowerCase()));
      let relatedRequests = byOrg;
      if (emails.size > 0) {
        const recentReqs = await db
          .select()
          .from(accessRequests)
          .orderBy(desc(accessRequests.createdAt))
          .limit(300);
        const byEmail = recentReqs.filter((r) => emails.has(r.email.toLowerCase()));
        const map = new Map<number, (typeof byOrg)[0]>();
        for (const r of [...byOrg, ...byEmail]) map.set(r.id, r);
        relatedRequests = [...map.values()].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }

      const timeline = await db
        .select()
        .from(orgTimelineEvents)
        .where(eq(orgTimelineEvents.organizationId, id))
        .orderBy(desc(orgTimelineEvents.createdAt))
        .limit(100);

      const emailSet = new Set(members.map((m) => m.email.toLowerCase()));
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      let usageTotal = 0;
      if (emailSet.size > 0) {
        const recent = await db
          .select()
          .from(usageEvents)
          .where(gte(usageEvents.createdAt, weekAgo))
          .limit(3000);
        usageTotal = recent.filter((r) => emailSet.has(String(r.email || "").toLowerCase())).length;
      }

      return res.json({
        organization: org,
        members: membersPublic,
        activatedCount,
        activated: activatedCount > 0,
        requests: relatedRequests,
        timeline,
        usageLast7Days: usageTotal,
      });
    } catch (err) {
      console.error("org detail error:", err);
      return res.status(500).json({ error: "Failed to load organization" });
    }
  });

  app.patch("/api/admin/organizations/:id/pipeline", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const parsed = orgPipelineBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid pipeline payload" });

      const patch: Record<string, unknown> = {
        pipelineStatus: parsed.data.pipelineStatus,
      };
      if (parsed.data.nextFollowUpAt !== undefined) {
        patch.nextFollowUpAt = parsed.data.nextFollowUpAt
          ? new Date(parsed.data.nextFollowUpAt)
          : null;
      }
      if (parsed.data.lostReason !== undefined) {
        patch.lostReason = parsed.data.lostReason;
      }
      // Sync technical status for common pipeline outcomes
      if (parsed.data.pipelineStatus === "won") {
        patch.status = "active";
        patch.activatedAt = new Date();
        patch.trialEndsAt = null;
      }
      if (parsed.data.pipelineStatus === "churned" || parsed.data.pipelineStatus === "lost") {
        // don't auto-expire access on lost (might still be evaluating) — only churned suspends
        if (parsed.data.pipelineStatus === "churned") {
          patch.status = "suspended";
        }
      }

      const [org] = await db
        .update(clientOrganizations)
        .set(patch as any)
        .where(eq(clientOrganizations.id, id))
        .returning();
      if (!org) return res.status(404).json({ error: "Organization not found" });

      await addOrgTimeline(
        id,
        "pipeline",
        `Pipeline → ${parsed.data.pipelineStatus}${parsed.data.lostReason ? `: ${parsed.data.lostReason}` : ""}`,
        "admin",
        { pipelineStatus: parsed.data.pipelineStatus },
      );
      await logEvent("org_pipeline_updated", null, { orgId: id, ...parsed.data });

      return res.json({ organization: org });
    } catch (err) {
      console.error("pipeline update error:", err);
      return res.status(500).json({ error: "Failed to update pipeline" });
    }
  });

  app.post("/api/admin/organizations/:id/notes", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const parsed = orgNoteBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Note body required" });

      const [org] = await db
        .select()
        .from(clientOrganizations)
        .where(eq(clientOrganizations.id, id))
        .limit(1);
      if (!org) return res.status(404).json({ error: "Organization not found" });

      const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      const sticky = org.notes
        ? `${stamp}\n${parsed.data.body.trim()}\n\n---\n${org.notes}`
        : `${stamp}\n${parsed.data.body.trim()}`;

      const [updated] = await db
        .update(clientOrganizations)
        .set({ notes: sticky.slice(0, 10000) })
        .where(eq(clientOrganizations.id, id))
        .returning();

      await addOrgTimeline(id, "note", parsed.data.body.trim(), "admin");
      return res.json({ organization: updated, ok: true });
    } catch (err) {
      console.error("org note error:", err);
      return res.status(500).json({ error: "Failed to add note" });
    }
  });

  app.patch("/api/admin/organizations/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const parsed = orgUpdateBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid update" });
      const patch: Record<string, unknown> = {};
      if (parsed.data.name !== undefined) patch.name = parsed.data.name;
      if (parsed.data.seatLimit !== undefined) {
        patch.seatLimit = parsed.data.seatLimit;
        patch.billableSeats = parsed.data.seatLimit;
      }
      if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes;

      // If seats changed and org has Stripe corporate sub, prefer dedicated seats endpoint semantics
      if (parsed.data.seatLimit !== undefined) {
        try {
          const { updateCorporateSeats } = await import("../billing/corporateBilling");
          const result = await updateCorporateSeats(id, parsed.data.seatLimit);
          if (parsed.data.name !== undefined || parsed.data.notes !== undefined) {
            const extra: Record<string, unknown> = {};
            if (parsed.data.name !== undefined) extra.name = parsed.data.name;
            if (parsed.data.notes !== undefined) extra.notes = parsed.data.notes;
            if (Object.keys(extra).length) {
              await db
                .update(clientOrganizations)
                .set(extra as any)
                .where(eq(clientOrganizations.id, id));
            }
          }
          await addOrgTimeline(
            id,
            "system",
            `Seats → ${parsed.data.seatLimit}${result.message ? ` (${result.message})` : ""}`,
            "admin",
          );
          const [fresh] = await db
            .select()
            .from(clientOrganizations)
            .where(eq(clientOrganizations.id, id))
            .limit(1);
          return res.json({ organization: fresh, message: result.message });
        } catch (seatErr) {
          console.warn("seat sync via Stripe failed, applying DB seatLimit only:", seatErr);
        }
      }

      const [org] = await db
        .update(clientOrganizations)
        .set(patch as any)
        .where(eq(clientOrganizations.id, id))
        .returning();
      if (!org) return res.status(404).json({ error: "Organization not found" });
      await addOrgTimeline(id, "system", `Organization updated: ${Object.keys(patch).join(", ")}`, "admin");
      return res.json({ organization: org });
    } catch (err) {
      console.error("org update error:", err);
      return res.status(500).json({ error: "Failed to update organization" });
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

      const countBy = <T extends string>(items: { status?: string; pipelineStatus?: string }[], key: "status" | "pipelineStatus", value: T) =>
        items.filter((i) => i[key] === value).length;

      const followUpsDue = allOrgs.filter(
        (o) =>
          o.nextFollowUpAt &&
          o.nextFollowUpAt.getTime() <= Date.now() &&
          o.pipelineStatus !== "won" &&
          o.pipelineStatus !== "lost" &&
          o.pipelineStatus !== "churned",
      ).length;

      const pending = countBy(allRequests, "status", "pending");
      const approved = countBy(allRequests, "status", "approved");
      const rejected = countBy(allRequests, "status", "rejected");
      const trialOrgs = countBy(allOrgs, "status", "trial");
      const activeOrgs = countBy(allOrgs, "status", "active");
      const expiredOrgs = countBy(allOrgs, "status", "expired");
      const wonPipeline = countBy(allOrgs, "pipelineStatus", "won");
      const decided = approved + rejected;
      const conversionRate =
        decided > 0 ? Math.round((approved / decided) * 100) : null;
      const winRate =
        approved > 0 ? Math.round((wonPipeline / approved) * 100) : null;

      const trialsEndingSoon = allOrgs.filter(
        (o) =>
          o.status === "trial" &&
          o.trialEndsAt &&
          o.trialEndsAt.getTime() > Date.now() &&
          o.trialEndsAt.getTime() <= Date.now() + 4 * 60 * 60 * 1000,
      ).length;

      return res.json({
        requests: {
          total: allRequests.length,
          pending,
          approved,
          rejected,
        },
        organizations: {
          total: allOrgs.length,
          trial: trialOrgs,
          active: activeOrgs,
          expired: expiredOrgs,
          suspended: countBy(allOrgs, "status", "suspended"),
        },
        pipeline: {
          trial: countBy(allOrgs, "pipelineStatus", "trial"),
          follow_up: countBy(allOrgs, "pipelineStatus", "follow_up"),
          won: wonPipeline,
          lost: countBy(allOrgs, "pipelineStatus", "lost"),
          churned: countBy(allOrgs, "pipelineStatus", "churned"),
          followUpsDue,
        },
        /** request → approve → trial/active → won */
        funnel: {
          pending,
          approved,
          rejected,
          inTrial: trialOrgs,
          activeClients: activeOrgs,
          expired: expiredOrgs,
          won: wonPipeline,
          approvalRatePct: conversionRate,
          winFromApprovedPct: winRate,
          trialsEndingSoon4h: trialsEndingSoon,
          followUpsDue,
        },
        members: {
          total: allMembers.length,
          active: countBy(allMembers, "status", "active"),
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

  /** Per-member mobile event counts — used by admin UI to show mobile vs web activity */
  app.get("/api/admin/subscriber-mobile-usage", requireAdmin, async (_req, res) => {
    try {
      const rows = await storage.getMobileUsagePerMember();
      return res.json({ usage: rows });
    } catch (err) {
      console.error("subscriber-mobile-usage error:", err);
      return res.status(500).json({ error: "Failed to load mobile usage" });
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
        (isCompany ? DEFAULT_COMPANY_TRIAL_HOURS : 24);
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
          pipelineStatus: "trial",
          trialEndsAt,
          notes: body.adminNote ?? null,
        })
        .returning();

      await addOrgTimeline(
        org.id,
        "system",
        `Evaluation approved (${trialHours}h trial, ${seats} seat${seats === 1 ? "" : "s"}). Contact: ${request.name} <${request.email}>`,
        "admin",
        { requestId: id, trialHours },
      );

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
      const emailResult = await dispatchEmails([
        () => sendAccessApprovedEmail(member.email, member.name, setPasswordUrl, trialHours),
      ]);
      await logEvent("access_approved", member.id, {
        requestId: id,
        orgId: org.id,
        trialHours,
        email,
      });

      return res.json({
        ok: true,
        organization: publicOrg(org),
        member: publicMember(member),
        trialHours,
        email,
        emailMessage: emailSummary(emailResult),
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

      const email = await dispatchEmails([
        () => sendAccessRejectedEmail(request.email, request.name, note),
      ]);
      await logEvent("access_rejected", null, {
        requestId: id,
        notified: email.sent > 0,
        email,
      });

      return res.json({
        ok: true,
        email,
        emailMessage: emailSummary(email),
      });
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
        patch.pipelineStatus = "trial";
      }
      if (status === "active") {
        patch.activatedAt = new Date();
        patch.trialEndsAt = null;
        patch.pipelineStatus = "won";
      }
      if (status === "expired") {
        patch.trialEndsAt = new Date();
        patch.pipelineStatus = "follow_up";
      }
      if (status === "suspended") {
        patch.pipelineStatus = "churned";
      }

      const [org] = await db
        .update(clientOrganizations)
        .set(patch as any)
        .where(eq(clientOrganizations.id, id))
        .returning();
      if (!org) return res.status(404).json({ error: "Organization not found" });
      await addOrgTimeline(id, "status", `Access status → ${status}`, "admin", { status });
      await logEvent("org_status_changed", null, { orgId: id, status, trialHours });

      let email: EmailDispatchResult = { sent: 0, failed: 0, errors: [] };
      // Notify members when activated as continuing clients
      if (status === "active") {
        const members = await db
          .select()
          .from(clientMembers)
          .where(
            and(
              eq(clientMembers.organizationId, id),
              ne(clientMembers.status, "disabled"),
            ),
          );
        email = await dispatchEmails(
          members.map(
            (m) => () => sendMembershipActivatedEmail(m.email, m.name, org.name),
          ),
        );
      }

      return res.json({
        organization: publicOrg(org),
        email,
        emailMessage: emailSummary(email),
      });
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
        .set({ status: "trial", pipelineStatus: "trial", trialEndsAt })
        .where(eq(clientOrganizations.id, id))
        .returning();
      await addOrgTimeline(id, "status", `Trial extended by ${hours}h (ends ${trialEndsAt.toISOString()})`, "admin", {
        hours,
      });
      await logEvent("org_trial_extended", null, { orgId: id, hours });

      const members = await db
        .select()
        .from(clientMembers)
        .where(
          and(
            eq(clientMembers.organizationId, id),
            ne(clientMembers.status, "disabled"),
          ),
        );
      const email = await dispatchEmails(
        members.map(
          (m) => () => sendTrialExtendedEmail(m.email, m.name, hours, trialEndsAt),
        ),
      );

      return res.json({
        organization: publicOrg(updated),
        email,
        emailMessage: emailSummary(email),
      });
    } catch (err) {
      console.error("extend trial error:", err);
      return res.status(500).json({ error: "Failed to extend trial" });
    }
  });

  // ── Org admin: members & invites ───────────────────────────────────
  app.get("/api/org/members", requireAuth, requireFieldKit, requireOrgAdmin, async (req: AuthedRequest, res) => {
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
  app.get("/api/org/usage", requireAuth, requireFieldKit, requireOrgAdmin, async (req: AuthedRequest, res) => {
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

  app.post("/api/org/invites", requireAuth, requireFieldKit, requireOrgAdmin, async (req: AuthedRequest, res) => {
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
      // Prefer billable seats from contract when set; fall back to seatLimit
      const seatCap =
        typeof (org as any).billableSeats === "number" && (org as any).billableSeats > 0
          ? (org as any).billableSeats
          : org.seatLimit;
      if (activeCount >= seatCap) {
        return res.status(400).json({
          error: `Seat limit reached (${seatCap}). Contact Spartan Coaching to add seats under your contract.`,
          code: "SEAT_LIMIT_REACHED",
          seatLimit: seatCap,
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

  // ── One-time platform admin bootstrap ─────────────────────────────
  app.get("/api/admin/bootstrap-status", async (_req, res) => {
    try {
      const admins = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.role, "platform_admin"))
        .limit(1);
      return res.json({ needsBootstrap: admins.length === 0 });
    } catch (err) {
      console.error("bootstrap-status error:", err);
      return res.json({ needsBootstrap: true });
    }
  });

  /**
   * Create the first platform administrator. This function is called only after
   * a strong, environment-held one-time bootstrap token is verified.
   */
  async function ensurePlatformAdmin(opts?: {
    email?: string;
    name?: string;
    password?: string;
  }) {
    if (!opts?.email || !opts?.name || !opts?.password) {
      throw new Error("Bootstrap identity and password are required");
    }
    const email = opts.email.toLowerCase().trim();
    const name = opts.name.trim();
    const password = opts.password;
    const passwordHash = await hashPassword(password);

    // Never reset or replace an existing administrator through bootstrap.
    const [existingAdmin] = await db
      .select()
      .from(clientMembers)
      .where(and(eq(clientMembers.role, "platform_admin"), eq(clientMembers.status, "active")))
      .limit(1);

    if (existingAdmin) {
      throw new Error("Platform administrator already exists");
    }

    // Reuse platform org if present
    let orgId: number;
    const [existingOrg] = await db
      .select()
      .from(clientOrganizations)
      .where(eq(clientOrganizations.type, "platform"))
      .limit(1);
    if (existingOrg) {
      orgId = existingOrg.id;
    } else {
      const [org] = await db
        .insert(clientOrganizations)
        .values({
          name: "Spartan Platform",
          type: "platform",
          seatLimit: 10,
          status: "active",
          activatedAt: new Date(),
        })
        .returning();
      orgId = org.id;
    }

    // Promote existing member with admin email, or create new
    const [byEmail] = await db
      .select()
      .from(clientMembers)
      .where(eq(clientMembers.email, email))
      .limit(1);

    if (byEmail) {
      const [promoted] = await db
        .update(clientMembers)
        .set({
          role: "platform_admin",
          organizationId: orgId,
          status: "active",
          passwordHash,
          name: name || byEmail.name,
          termsAcceptedAt: byEmail.termsAcceptedAt ?? new Date(),
          lastLoginAt: new Date(),
        })
        .where(eq(clientMembers.id, byEmail.id))
        .returning();
      return { member: promoted!, created: true as const };
    }

    const [member] = await db
      .insert(clientMembers)
      .values({
        email,
        name,
        role: "platform_admin",
        organizationId: orgId,
        status: "active",
        passwordHash,
        termsAcceptedAt: new Date(),
        lastLoginAt: new Date(),
      })
      .returning();
    return { member: member!, created: true as const };
  }

  app.post("/api/admin/bootstrap", authLimit, async (req, res) => {
    try {
      const parsed = adminBootstrapBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid bootstrap payload" });
      }
      if (!bootstrapTokenMatches(parsed.data.adminPassword)) {
        return res.status(401).json({
          error: "Invalid or unavailable bootstrap token",
          code: "INVALID_BOOTSTRAP_TOKEN",
        });
      }

      const existing = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.role, "platform_admin"))
        .limit(1);
      if (existing.length > 0) {
        return res.status(409).json({
          error: "Platform administrator already exists. Use the standard login.",
          code: "BOOTSTRAP_ALREADY_COMPLETED",
        });
      }

      const { member } = await ensurePlatformAdmin({
        email: parsed.data.email,
        name: parsed.data.name,
        password: parsed.data.password,
      });

      const { token, expiresAt } = await createSession(
        member.id,
        req.headers["user-agent"] as string | undefined,
      );
      setSessionCookie(res, token, expiresAt);
      await logEvent("admin_bootstrap", member.id, { email: member.email });

      const access = await getAccessForMemberId(member.id);
      return res.status(201).json({
        ok: true,
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
      console.error("admin bootstrap error:", err);
      return res.status(500).json({ error: "Bootstrap failed" });
    }
  });

  app.post("/api/admin/legacy-login", loginLimit, (_req, res) => {
    return res.status(410).json({
      error: "Passcode unlock has been retired. Sign in with your platform administrator account.",
      code: "LEGACY_ADMIN_LOGIN_RETIRED",
    });
  });

  // ── Magic link login ───────────────────────────────────────────────
  app.post("/api/auth/magic-link", loginLimit, async (req, res) => {
    try {
      const parsed = magicLinkRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Valid email required" });
      }
      const email = parsed.data.email.toLowerCase().trim();
      const [member] = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.email, email))
        .limit(1);

      // Only active members with a password may receive magic links (no enumeration).
      if (member && member.status === "active" && member.passwordHash) {
        const token = await createAuthToken(member.id, "magic_link", 1);
        const url = `${getSiteUrl()}/magic-login?token=${encodeURIComponent(token)}`;
        // Reuse password-reset style email
        const { sendMagicLinkEmail } = await import("../resend");
        await sendMagicLinkEmail(member.email, member.name, url);
        await logEvent("magic_link_sent", member.id);
      }

      return res.json({
        ok: true,
        message: "If an account exists for that email, a sign-in link has been sent.",
      });
    } catch (err) {
      console.error("magic-link error:", err);
      return res.json({
        ok: true,
        message: "If an account exists for that email, a sign-in link has been sent.",
      });
    }
  });

  app.post("/api/auth/magic-login", loginLimit, async (req, res) => {
    try {
      const token = String(req.body?.token || "");
      if (!token) return res.status(400).json({ error: "Token required" });
      const tokenHash = hashToken(token);
      const [row] = await db
        .select()
        .from(authTokens)
        .where(and(eq(authTokens.tokenHash, tokenHash), isNull(authTokens.usedAt)))
        .limit(1);
      if (!row || row.purpose !== "magic_link" || row.expiresAt.getTime() < Date.now()) {
        return res.status(400).json({ error: "This sign-in link is invalid or has expired." });
      }

      // Load member first — never force-activate invited/disabled accounts.
      const [existing] = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.id, row.memberId))
        .limit(1);
      if (!existing || existing.status === "disabled") {
        return res.status(400).json({ error: "Account unavailable" });
      }
      if (existing.status === "invited" || !existing.passwordHash) {
        return res.status(400).json({
          error: "Please set your password using the link from your approval email first.",
          code: "PASSWORD_NOT_SET",
        });
      }
      if (existing.status !== "active") {
        return res.status(400).json({ error: "Account unavailable" });
      }

      await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, row.id));
      const [member] = await db
        .update(clientMembers)
        .set({ lastLoginAt: new Date() })
        .where(eq(clientMembers.id, existing.id))
        .returning();
      if (!member) {
        return res.status(400).json({ error: "Account unavailable" });
      }

      const { token: sessionToken, expiresAt } = await createSession(
        member.id,
        req.headers["user-agent"] as string | undefined,
      );
      setSessionCookie(res, sessionToken, expiresAt);
      await logEvent("magic_login", member.id);

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
        token: sessionToken,
        expiresAt,
      });
    } catch (err) {
      console.error("magic-login error:", err);
      return res.status(500).json({ error: "Sign-in failed" });
    }
  });

  // ── Change password ────────────────────────────────────────────────
  app.post("/api/auth/change-password", requireAuth, authLimit, async (req: AuthedRequest, res) => {
    try {
      const parsed = changePasswordBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid password payload" });
      }
      const member = req.fieldKit!.member!;
      if (!member.passwordHash) {
        return res.status(400).json({ error: "Set a password first via your invite link." });
      }
      const ok = await verifyPassword(parsed.data.currentPassword, member.passwordHash);
      if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

      const passwordHash = await hashPassword(parsed.data.newPassword);
      await db
        .update(clientMembers)
        .set({ passwordHash })
        .where(eq(clientMembers.id, member.id));
      await db.delete(clientSessions).where(eq(clientSessions.memberId, member.id));
      const { token, expiresAt } = await createSession(
        member.id,
        req.headers["user-agent"] as string | undefined,
      );
      setSessionCookie(res, token, expiresAt);
      await logEvent("password_changed", member.id);
      return res.json({ ok: true, token, expiresAt });
    } catch (err) {
      console.error("change-password error:", err);
      return res.status(500).json({ error: "Unable to change password" });
    }
  });

  // ── Org: disable member ────────────────────────────────────────────
  app.post("/api/org/members/:id/disable", requireAuth, requireFieldKit, requireOrgAdmin, async (req: AuthedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const orgId = req.fieldKit!.org!.id;
      const [target] = await db
        .select()
        .from(clientMembers)
        .where(and(eq(clientMembers.id, id), eq(clientMembers.organizationId, orgId)))
        .limit(1);
      if (!target) return res.status(404).json({ error: "Member not found" });
      if (target.id === req.clientMemberId) {
        return res.status(400).json({ error: "You cannot disable your own account" });
      }
      if (target.role === "platform_admin") {
        return res.status(400).json({ error: "Cannot disable platform admin" });
      }

      await db
        .update(clientMembers)
        .set({ status: "disabled" })
        .where(eq(clientMembers.id, id));
      await db.delete(clientSessions).where(eq(clientSessions.memberId, id));
      await logEvent("member_disabled", req.clientMemberId, { targetId: id, orgId });
      return res.json({ ok: true });
    } catch (err) {
      console.error("disable member error:", err);
      return res.status(500).json({ error: "Failed to disable member" });
    }
  });

  // ── Request extended evaluation (from expired clients) ─────────────
  app.post("/api/auth/request-extension", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const parsed = extendEvaluationBodySchema.safeParse(req.body ?? {});
      const message = parsed.success ? parsed.data.message : undefined;
      const member = req.fieldKit!.member!;
      const org = req.fieldKit!.org;

      const [row] = await db
        .insert(accessRequests)
        .values({
          type: org?.type === "company" ? "company" : "individual",
          name: member.name,
          email: member.email,
          companyName: org?.name ?? null,
          message: message?.trim() || "Requesting extended membership evaluation.",
          seatsRequested: org?.seatLimit ?? 1,
          status: "pending",
          adminNote: `extension_request orgId=${org?.id ?? "n/a"}`,
        })
        .returning();

      // Also create inquiry for CRM visibility
      try {
        await db.insert(inquiries).values({
          name: member.name,
          email: member.email,
          phone: "n/a",
          company: org?.name ?? null,
          serviceType: "Membership Extended Evaluation",
          message: message?.trim() || "Requesting extended membership evaluation.",
          submittedAt: Date.now(),
          isRead: false,
        });
      } catch {
        // non-fatal
      }

      sendAccessRequestAdminAlert({
        name: member.name,
        email: member.email,
        type: "extension",
        companyName: org?.name,
        message: message || "Extended evaluation requested",
        seatsRequested: org?.seatLimit ?? 1,
      }).catch(() => {});

      await logEvent("extension_requested", member.id, { requestId: row.id });
      return res.status(201).json({ ok: true, requestId: row.id });
    } catch (err) {
      console.error("request-extension error:", err);
      return res.status(500).json({ error: "Unable to submit extension request" });
    }
  });

  // ── Admin: resend set-password / create inquiry from request ───────
  app.post("/api/admin/access-requests/:id/resend-invite", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [request] = await db
        .select()
        .from(accessRequests)
        .where(eq(accessRequests.id, id))
        .limit(1);
      if (!request || request.status !== "approved" || !request.resultingMemberId) {
        return res.status(400).json({ error: "Only approved requests with a member can be resent" });
      }
      const [member] = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.id, request.resultingMemberId))
        .limit(1);
      if (!member) return res.status(404).json({ error: "Member not found" });

      const token = await createAuthToken(member.id, "set_password", 48);
      const url = `${getSiteUrl()}/set-password?token=${encodeURIComponent(token)}`;
      const email = await dispatchEmails([
        () => sendAccessApprovedEmail(member.email, member.name, url, 24),
      ]);
      await logEvent("invite_resent", member.id, { requestId: id, email });
      return res.json({ ok: true, email, emailMessage: emailSummary(email) });
    } catch (err) {
      console.error("resend-invite error:", err);
      return res.status(500).json({ error: "Failed to resend" });
    }
  });

  app.post("/api/admin/access-requests/:id/to-inquiry", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [request] = await db
        .select()
        .from(accessRequests)
        .where(eq(accessRequests.id, id))
        .limit(1);
      if (!request) return res.status(404).json({ error: "Request not found" });

      const [inquiry] = await db
        .insert(inquiries)
        .values({
          name: request.name,
          email: request.email,
          phone: "n/a",
          company: request.companyName ?? null,
          serviceType: `Membership Access (${request.type})`,
          message: [
            request.primaryGoal ? `Goal: ${request.primaryGoal}` : null,
            request.role ? `Role: ${request.role}` : null,
            request.message || null,
          ]
            .filter(Boolean)
            .join("\n") || "Membership access request",
          submittedAt: Date.now(),
          isRead: false,
        })
        .returning();

      return res.status(201).json({ ok: true, inquiry });
    } catch (err) {
      console.error("to-inquiry error:", err);
      return res.status(500).json({ error: "Failed to create inquiry" });
    }
  });

  // ── Scheduled / manual ops jobs ────────────────────────────────────
  app.get("/api/admin/jobs/snapshot", requireAdmin, async (_req, res) => {
    try {
      const snapshot = await buildOpsSnapshot();
      return res.json({ ok: true, snapshot, at: new Date().toISOString() });
    } catch (err) {
      console.error("jobs snapshot error:", err);
      return res.status(500).json({ error: "Failed to build snapshot" });
    }
  });

  app.post("/api/admin/jobs/trial-sweep", requireAdmin, async (_req, res) => {
    try {
      const trialSweep = await runTrialLifecycleSweep();
      return res.json({ ok: true, trialSweep });
    } catch (err) {
      console.error("trial-sweep error:", err);
      return res.status(500).json({ error: "Trial sweep failed" });
    }
  });

  app.post("/api/admin/jobs/ops-digest", requireAdmin, async (req, res) => {
    try {
      const force = req.body?.force === true;
      const opsDigest = await runOpsDigest({ force });
      return res.json({ ok: true, opsDigest });
    } catch (err) {
      console.error("ops-digest error:", err);
      return res.status(500).json({ error: "Ops digest failed" });
    }
  });

  app.post("/api/admin/jobs/session-cleanup", requireAdmin, async (_req, res) => {
    try {
      const cleanup = await runSessionCleanup();
      return res.json({ ok: true, cleanup });
    } catch (err) {
      console.error("session-cleanup error:", err);
      return res.status(500).json({ error: "Session cleanup failed" });
    }
  });

  app.post("/api/admin/jobs/run-all", requireAdmin, async (req, res) => {
    try {
      const forceDigest = req.body?.forceDigest === true;
      const result = await runScheduledJobs({ forceDigest });
      return res.json({ ok: true, ...result });
    } catch (err) {
      console.error("run-all jobs error:", err);
      return res.status(500).json({ error: "Jobs failed" });
    }
  });

  /** External cron (Replit / GitHub Actions) — header X-Cron-Secret must match CRON_SECRET */
  app.post("/api/cron/jobs", async (req, res) => {
    if (!isCronAuthorized(req as any) && !isAdminRequest(req)) {
      return res.status(401).json({ error: "Unauthorized", code: "CRON_OR_ADMIN_REQUIRED" });
    }
    try {
      const forceDigest = req.body?.forceDigest === true;
      const result = await runScheduledJobs({ forceDigest });
      return res.json({ ok: true, ...result });
    } catch (err) {
      console.error("cron jobs error:", err);
      return res.status(500).json({ error: "Cron jobs failed" });
    }
  });

  /**
   * Reset (or seed) the Apple App Store reviewer test account.
   *
   * Safe to call before every review cycle — idempotent.
   * - If the account already exists: resets password + re-activates.
   * - If it does not exist: creates the org + member from scratch.
   *
   * Auth (either is accepted):
   *   1. Active platform_admin session cookie / Bearer token (preferred).
   *   2. X-Admin-Auth: <secret> header where <secret> matches the ADMIN_PASSWORD
   *      Replit Secret (must be explicitly set; fails closed if unset).
   *
   * Body (all optional):
   *   { password?: string }   — omit to auto-generate a secure random password
   *
   * Returns:
   *   { ok: true, email, password, created: boolean }
   *
   * Shell usage (ADMIN_PASSWORD must be set as a Replit Secret):
   *   curl -s -X POST localhost:80/api/admin/reviewer/reset-password \
   *     -H "X-Admin-Auth: $ADMIN_PASSWORD" \
   *     -H "Content-Type: application/json" \
   *     -d '{}' | jq .
   */
  app.post("/api/admin/reviewer/reset-password", authLimit, async (req: AuthedRequest, res) => {
    // Accept a platform_admin session OR an X-Admin-Auth header matched
    // against the ADMIN_PASSWORD env var (shell/curl fallback per replit.md).
    // Fails closed — no fallback default — when ADMIN_PASSWORD is not configured.
    const sessionOk = isAdminRequest(req);
    const headerSecret = process.env.ADMIN_PASSWORD?.trim() || null;
    const headerValue = typeof req.headers["x-admin-auth"] === "string"
      ? req.headers["x-admin-auth"].trim()
      : null;
    const headerOk = !!(headerSecret && headerValue && safeEqualString(headerValue, headerSecret));

    if (!sessionOk && !headerOk) {
      await logEvent("reviewer_reset_denied", req.clientMemberId ?? null, {
        reason: headerSecret ? "bad_header" : "no_admin_password_configured",
        ip: req.ip,
      });
      return res.status(req.clientMemberId ? 403 : 401).json({
        error: "Platform administrator session or valid X-Admin-Auth header required",
        code: "ADMIN_REQUIRED",
      });
    }
    const REVIEWER_EMAIL = "apple-reviewer@spartanhospicecoaching.com";
    const REVIEWER_NAME = "Apple App Reviewer";
    const REVIEWER_ORG = "Apple App Review (Test Account)";

    function generateReviewerPassword(): string {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
      return Array.from(randomBytes(20))
        .map((b: number) => chars[b % chars.length])
        .join("");
    }

    try {
      const rawPassword =
        typeof req.body?.password === "string" && req.body.password.trim().length >= 8
          ? req.body.password.trim()
          : generateReviewerPassword();

      const passwordHash = await hashPassword(rawPassword);

      const [existing] = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.email, REVIEWER_EMAIL))
        .limit(1);

      let created = false;

      if (existing) {
        await db
          .update(clientMembers)
          .set({ passwordHash, status: "active", name: REVIEWER_NAME })
          .where(eq(clientMembers.id, existing.id));

        await db
          .update(clientOrganizations)
          .set({ status: "active", trialEndsAt: null })
          .where(eq(clientOrganizations.id, existing.organizationId));

        await addOrgTimeline(
          existing.organizationId,
          "system",
          "Apple reviewer test account password reset and re-activated via admin endpoint.",
          "admin",
        );

        await logEvent("reviewer_password_reset", existing.id, { via: "admin-endpoint" });
      } else {
        const [org] = await db
          .insert(clientOrganizations)
          .values({
            name: REVIEWER_ORG,
            type: "personal",
            seatLimit: 1,
            status: "active",
            pipelineStatus: "won",
            trialEndsAt: null,
            activatedAt: new Date(),
            notes: "Permanent test account for Apple App Store reviewers. Do not expire or delete.",
          })
          .returning();

        const [member] = await db
          .insert(clientMembers)
          .values({
            email: REVIEWER_EMAIL,
            passwordHash,
            name: REVIEWER_NAME,
            title: "App Reviewer",
            role: "member",
            organizationId: org.id,
            status: "active",
            termsAcceptedAt: new Date(),
          })
          .returning();

        await addOrgTimeline(
          org.id,
          "system",
          "Apple reviewer test account seeded for App Store review via admin endpoint.",
          "admin",
        );

        await logEvent("reviewer_account_created", member.id, { via: "admin-endpoint" });
        created = true;
      }

      return res.json({
        ok: true,
        email: REVIEWER_EMAIL,
        password: rawPassword,
        created,
        note: "Copy email + password into App Store Connect → App Review Information → Sign-in required. Do not commit the password.",
      });
    } catch (err) {
      console.error("reviewer reset-password error:", err);
      return res.status(500).json({ error: "Failed to reset reviewer account" });
    }
  });

  /**
   * @deprecated Use POST /api/admin/access-requests/:id/reject (emails requester).
   * Kept as a thin alias so old clients do not 404.
   */
  app.post("/api/admin/access-requests/:id/reject-and-notify", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const note = typeof req.body?.adminNote === "string" ? req.body.adminNote : undefined;
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
      try {
        await sendAccessRejectedEmail(request.email, request.name, note);
      } catch (emailErr) {
        console.error("reject-and-notify email failed:", emailErr);
      }
      await logEvent("access_rejected", null, { requestId: id, notified: true, legacyAlias: true });
      return res.json({ ok: true });
    } catch (err) {
      console.error("reject-and-notify error:", err);
      return res.status(500).json({ error: "Failed to reject" });
    }
  });
}
