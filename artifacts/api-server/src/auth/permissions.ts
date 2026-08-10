/**
 * Formal permission model for Hospice Sales Pro (Slice A).
 *
 * Authorization roles stored on client_members.role (only these three exist):
 *   - member
 *   - org_admin
 *   - platform_admin
 *
 * Profile job titles (job_role: rep | director | vp | owner | other) are NOT
 * authorization roles — they must never gate API access.
 *
 * All checks are pure and unit-testable. Express middleware wraps hasPermission
 * + tenant scope. Client UI must not substitute for these gates.
 */

import type { NextFunction, Response } from "express";
import type { AuthedRequest } from "./middleware";

/** Roles that exist in the database and authorize APIs. */
export const AUTH_ROLES = ["member", "org_admin", "platform_admin"] as const;
export type AuthRole = (typeof AUTH_ROLES)[number];

/**
 * Suggested capability labels from product language. Mapped onto AUTH_ROLES —
 * not stored as separate role columns.
 */
export const CAPABILITY_ALIASES = {
  rep: "member",
  manager: "member", // no distinct manager role in DB yet
  director: "member", // job_role only
  executive: "member", // job_role only
  organization_administrator: "org_admin",
  billing_administrator: "org_admin", // org_admin owns org billing today
  content_administrator: "platform_admin", // CMS is platform-scoped
  platform_administrator: "platform_admin",
} as const;

/** Protected objects in the product surface. */
export const PERMISSION_OBJECTS = [
  "account_self",
  "org_members",
  "org_invites",
  "org_billing",
  "org_usage",
  "sales_workflow",
  "cms_content",
  "platform_ops",
  "data_export",
  "audit_log",
] as const;
export type PermissionObject = (typeof PERMISSION_OBJECTS)[number];

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "assign",
  "export",
  "administer",
] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export type Permission = `${PermissionObject}:${PermissionAction}`;

/** Matrix: which auth roles may perform each permission. */
export const PERMISSION_MATRIX: Record<Permission, readonly AuthRole[]> = {
  // Self-service membership account
  "account_self:view": ["member", "org_admin", "platform_admin"],
  "account_self:edit": ["member", "org_admin", "platform_admin"],
  "account_self:delete": ["member", "org_admin", "platform_admin"],
  "account_self:create": [],
  "account_self:assign": [],
  "account_self:export": ["member", "org_admin", "platform_admin"],
  "account_self:administer": [],

  // Org roster
  "org_members:view": ["org_admin", "platform_admin"],
  "org_members:create": ["org_admin", "platform_admin"],
  "org_members:edit": ["org_admin", "platform_admin"],
  "org_members:delete": ["org_admin", "platform_admin"],
  "org_members:assign": ["org_admin", "platform_admin"],
  "org_members:export": ["org_admin", "platform_admin"],
  "org_members:administer": ["org_admin", "platform_admin"],

  // Invitations
  "org_invites:view": ["org_admin", "platform_admin"],
  "org_invites:create": ["org_admin", "platform_admin"],
  "org_invites:edit": ["org_admin", "platform_admin"],
  "org_invites:delete": ["org_admin", "platform_admin"],
  "org_invites:assign": ["org_admin", "platform_admin"],
  "org_invites:export": ["org_admin", "platform_admin"],
  "org_invites:administer": ["org_admin", "platform_admin"],

  // Billing (org-level; Stripe portal / corporate)
  "org_billing:view": ["org_admin", "platform_admin"],
  "org_billing:create": ["org_admin", "platform_admin"],
  "org_billing:edit": ["org_admin", "platform_admin"],
  "org_billing:delete": ["platform_admin"],
  "org_billing:assign": ["platform_admin"],
  "org_billing:export": ["org_admin", "platform_admin"],
  "org_billing:administer": ["platform_admin"],

  "org_usage:view": ["org_admin", "platform_admin"],
  "org_usage:create": [],
  "org_usage:edit": [],
  "org_usage:delete": [],
  "org_usage:assign": [],
  "org_usage:export": ["org_admin", "platform_admin"],
  "org_usage:administer": [],

  // Field workflow (tenant-scoped; any entitled member)
  "sales_workflow:view": ["member", "org_admin", "platform_admin"],
  "sales_workflow:create": ["member", "org_admin", "platform_admin"],
  "sales_workflow:edit": ["member", "org_admin", "platform_admin"],
  "sales_workflow:delete": ["member", "org_admin", "platform_admin"],
  "sales_workflow:assign": ["org_admin", "platform_admin"],
  "sales_workflow:export": ["org_admin", "platform_admin"],
  "sales_workflow:administer": ["org_admin", "platform_admin"],

  // Public CMS marketing content — platform only
  "cms_content:view": ["member", "org_admin", "platform_admin"],
  "cms_content:create": ["platform_admin"],
  "cms_content:edit": ["platform_admin"],
  "cms_content:delete": ["platform_admin"],
  "cms_content:assign": ["platform_admin"],
  "cms_content:export": ["platform_admin"],
  "cms_content:administer": ["platform_admin"],

  // Access desk / platform ops
  "platform_ops:view": ["platform_admin"],
  "platform_ops:create": ["platform_admin"],
  "platform_ops:edit": ["platform_admin"],
  "platform_ops:delete": ["platform_admin"],
  "platform_ops:assign": ["platform_admin"],
  "platform_ops:export": ["platform_admin"],
  "platform_ops:administer": ["platform_admin"],

  // Data export (membership export is self; org-wide is admin)
  "data_export:view": ["member", "org_admin", "platform_admin"],
  "data_export:create": ["member", "org_admin", "platform_admin"],
  "data_export:edit": [],
  "data_export:delete": [],
  "data_export:assign": [],
  "data_export:export": ["member", "org_admin", "platform_admin"],
  "data_export:administer": ["platform_admin"],

  "audit_log:view": ["org_admin", "platform_admin"],
  "audit_log:create": ["member", "org_admin", "platform_admin"],
  "audit_log:edit": [],
  "audit_log:delete": ["platform_admin"],
  "audit_log:assign": [],
  "audit_log:export": ["platform_admin"],
  "audit_log:administer": ["platform_admin"],
};

export function normalizeAuthRole(role: string | null | undefined): AuthRole | null {
  if (!role) return null;
  if ((AUTH_ROLES as readonly string[]).includes(role)) return role as AuthRole;
  return null;
}

export function hasPermission(
  role: string | null | undefined,
  permission: Permission,
): boolean {
  const normalized = normalizeAuthRole(role);
  if (!normalized) return false;
  const allowed = PERMISSION_MATRIX[permission];
  if (!allowed) return false;
  return allowed.includes(normalized);
}

export function listPermissionsForRole(role: string | null | undefined): Permission[] {
  const normalized = normalizeAuthRole(role);
  if (!normalized) return [];
  return (Object.keys(PERMISSION_MATRIX) as Permission[]).filter((p) =>
    PERMISSION_MATRIX[p].includes(normalized),
  );
}

/**
 * Tenant isolation: actor may only touch resources in their organization
 * unless they are platform_admin.
 */
export function assertSameTenant(input: {
  actorRole: string | null | undefined;
  actorOrganizationId: number | null | undefined;
  resourceOrganizationId: number | null | undefined;
}): { ok: true } | { ok: false; code: "TENANT_MISMATCH" | "MISSING_ORG" } {
  if (normalizeAuthRole(input.actorRole) === "platform_admin") {
    return { ok: true };
  }
  if (
    input.actorOrganizationId == null ||
    input.resourceOrganizationId == null
  ) {
    return { ok: false, code: "MISSING_ORG" };
  }
  if (input.actorOrganizationId !== input.resourceOrganizationId) {
    return { ok: false, code: "TENANT_MISMATCH" };
  }
  return { ok: true };
}

/** Cross-tenant API attempt result (for tests and handlers). */
export function evaluateCrossTenantAccess(input: {
  actorRole: string;
  actorOrganizationId: number;
  targetOrganizationId: number;
  permission: Permission;
}): {
  allowed: boolean;
  code: "OK" | "PERMISSION_DENIED" | "TENANT_MISMATCH";
} {
  if (!hasPermission(input.actorRole, input.permission)) {
    return { allowed: false, code: "PERMISSION_DENIED" };
  }
  const tenant = assertSameTenant({
    actorRole: input.actorRole,
    actorOrganizationId: input.actorOrganizationId,
    resourceOrganizationId: input.targetOrganizationId,
  });
  if (!tenant.ok) {
    return { allowed: false, code: "TENANT_MISMATCH" };
  }
  return { allowed: true, code: "OK" };
}

/**
 * Express gate: permission required. Does not replace requireAuth / requireFieldKit.
 * Use after requireAuth (and requireFieldKit when product access is needed).
 */
export function requirePermission(permission: Permission) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const role = req.fieldKit?.member?.role;
    if (!req.clientMemberId || !req.fieldKit?.member) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHENTICATED",
      });
    }
    if (!hasPermission(role, permission)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        code: "PERMISSION_DENIED",
        permission,
      });
    }
    next();
  };
}

/**
 * Express gate: permission + same-tenant as req.params.orgId or body.organizationId.
 */
export function requirePermissionInTenant(
  permission: Permission,
  resolveOrgId: (req: AuthedRequest) => number | null,
) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const member = req.fieldKit?.member;
    if (!req.clientMemberId || !member) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHENTICATED",
      });
    }
    if (!hasPermission(member.role, permission)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        code: "PERMISSION_DENIED",
        permission,
      });
    }
    const resourceOrgId = resolveOrgId(req);
    const tenant = assertSameTenant({
      actorRole: member.role,
      actorOrganizationId: member.organizationId,
      resourceOrganizationId: resourceOrgId,
    });
    if (!tenant.ok) {
      return res.status(403).json({
        error: "Cross-tenant access denied",
        code: tenant.code,
      });
    }
    next();
  };
}
