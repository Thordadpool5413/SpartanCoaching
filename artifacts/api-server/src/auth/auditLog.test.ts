import { describe, expect, it } from "vitest";
import {
  SENSITIVE_AUDIT_TYPES,
  buildSensitiveAuditInsert,
} from "./auditLog";

describe("sensitive audit records", () => {
  it("covers invitation, seat, role, content, export actions", () => {
    expect(SENSITIVE_AUDIT_TYPES.org_invite_sent).toBe("admin.org_invite_sent");
    expect(SENSITIVE_AUDIT_TYPES.org_seats_changed).toBe("admin.org_seats_changed");
    expect(SENSITIVE_AUDIT_TYPES.org_member_role_changed).toBe(
      "admin.org_member_role_changed",
    );
    expect(SENSITIVE_AUDIT_TYPES.cms_content_published).toBe(
      "admin.cms_content_published",
    );
    expect(SENSITIVE_AUDIT_TYPES.data_export).toBe("admin.data_export");
  });

  it("builds insert without password/token fields", () => {
    const row = buildSensitiveAuditInsert({
      type: SENSITIVE_AUDIT_TYPES.org_invite_sent,
      actorMemberId: 7,
      organizationId: 3,
      targetEmail: "new.rep@example.com",
      meta: {
        role: "member",
        password: "should-strip",
        token: "should-strip",
        seats: 5,
      },
    });
    expect(row.memberId).toBe(7);
    expect(row.type).toBe("admin.org_invite_sent");
    expect(row.meta).toMatchObject({
      organizationId: 3,
      targetEmail: "new.rep@example.com",
      role: "member",
      seats: 5,
    });
    expect(row.meta).not.toHaveProperty("password");
    expect(row.meta).not.toHaveProperty("token");
  });
});
