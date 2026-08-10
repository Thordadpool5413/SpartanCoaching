/**
 * Sensitive administrative audit records (auth_events).
 * Never log secrets, tokens, passwords, or PHI payloads — ids and action codes only.
 */

import { authEvents } from "@workspace/db";
import { db } from "../db";

/** Stable event type strings for admin-sensitive actions. */
export const SENSITIVE_AUDIT_TYPES = {
  org_invite_sent: "admin.org_invite_sent",
  org_member_disabled: "admin.org_member_disabled",
  org_member_role_changed: "admin.org_member_role_changed",
  org_seats_changed: "admin.org_seats_changed",
  org_billing_portal: "admin.org_billing_portal",
  cms_content_published: "admin.cms_content_published",
  cms_content_edited: "admin.cms_content_edited",
  data_export: "admin.data_export",
  platform_access_approved: "admin.platform_access_approved",
  platform_access_rejected: "admin.platform_access_rejected",
  provider_knowledge_edited: "admin.provider_knowledge_edited",
} as const;

export type SensitiveAuditType =
  (typeof SENSITIVE_AUDIT_TYPES)[keyof typeof SENSITIVE_AUDIT_TYPES];

export type SensitiveAuditRecord = {
  type: SensitiveAuditType | string;
  actorMemberId: number | null;
  organizationId?: number | null;
  targetMemberId?: number | null;
  targetEmail?: string | null;
  meta?: Record<string, unknown> | null;
};

/** Pure builder for audit rows (unit-tested; no secrets). */
export function buildSensitiveAuditInsert(input: SensitiveAuditRecord) {
  const meta: Record<string, unknown> = {
    ...(input.meta && typeof input.meta === "object" ? input.meta : {}),
  };
  if (input.organizationId != null) meta.organizationId = input.organizationId;
  if (input.targetMemberId != null) meta.targetMemberId = input.targetMemberId;
  if (input.targetEmail) {
    // Store domain-only hint optional — keep email for admin invite audits (ops need it).
    meta.targetEmail = String(input.targetEmail).toLowerCase().slice(0, 320);
  }
  // Strip accidental secret-like keys
  for (const key of Object.keys(meta)) {
    if (/password|token|secret|authorization|cookie/i.test(key)) {
      delete meta[key];
    }
  }
  return {
    memberId: input.actorMemberId,
    type: String(input.type).slice(0, 64),
    meta: Object.keys(meta).length ? meta : null,
  };
}

export async function recordSensitiveAdminAction(
  input: SensitiveAuditRecord,
): Promise<void> {
  try {
    const row = buildSensitiveAuditInsert(input);
    await db.insert(authEvents).values(row);
  } catch {
    // Audit must not break primary action; failures are non-fatal.
  }
}
