import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const authRoutes = fs.readFileSync(path.resolve(import.meta.dirname, "../routes/authRoutes.ts"), "utf8");

describe("credential changes revoke sessions", () => {
  it("centralizes member-session invalidation", () => {
    expect(authRoutes).toContain("async function invalidateMemberSessions(memberId: number)");
    expect(authRoutes).toContain("db.delete(clientSessions).where(eq(clientSessions.memberId, memberId))");
  });

  it("uses session invalidation after every password-changing flow", () => {
    expect(authRoutes).toContain("await invalidateMemberSessions(member.id);");
    expect(authRoutes).toContain("await invalidateMemberSessions(row.memberId);");
    expect(authRoutes).toContain("await invalidateMemberSessions(existing.id);");
  });

  it("claims a reset token only once before changing a password", () => {
    expect(authRoutes).toContain("and(eq(authTokens.id, row.id), isNull(authTokens.usedAt))");
    expect(authRoutes).toContain('error: "This reset link is invalid or has expired."');
  });

  it("also revokes sessions on password-bearing reactivation and promotion", () => {
    const registration = authRoutes.slice(
      authRoutes.indexOf('app.post("/api/auth/register"'),
      authRoutes.indexOf('app.post("/api/auth/login"'),
    );
    const bootstrap = authRoutes.slice(
      authRoutes.indexOf("async function ensurePlatformAdmin"),
      authRoutes.indexOf('app.post("/api/admin/bootstrap"'),
    );
    expect(registration).toContain("await invalidateMemberSessions(member.id);");
    expect(bootstrap).toContain("await invalidateMemberSessions(byEmail.id);");
  });
});