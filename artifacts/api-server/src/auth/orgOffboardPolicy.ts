/**
 * Pure org offboarding rules (HSP-41 Slice D / pass 10).
 * Does not invent PHI export — only seat disable + invite revoke + audit facts.
 */

export type OffboardStepId =
  | "disable_member"
  | "revoke_pending_invites"
  | "clear_sessions"
  | "audit_entry"
  | "retention_note";

export const OFFBOARD_CHECKLIST: readonly {
  id: OffboardStepId;
  label: string;
  automated: boolean;
}[] = [
  { id: "disable_member", label: "Disable member seat", automated: true },
  {
    id: "revoke_pending_invites",
    label: "Revoke pending invites for email",
    automated: true,
  },
  { id: "clear_sessions", label: "Drop active sessions", automated: true },
  { id: "audit_entry", label: "Write org admin audit event", automated: true },
  {
    id: "retention_note",
    label: "Optional org data-retention note (no mass export)",
    automated: false,
  },
] as const;

export type OffboardGate =
  | { ok: true }
  | { ok: false; status: number; error: string; code?: string };

export function evaluateOffboardTarget(input: {
  targetId: number;
  actorId: number;
  targetRole: string;
  targetStatus: string;
}): OffboardGate {
  if (input.targetId === input.actorId) {
    return {
      ok: false,
      status: 400,
      error: "You cannot offboard your own account",
      code: "SELF_OFFBOARD",
    };
  }
  if (input.targetRole === "platform_admin") {
    return {
      ok: false,
      status: 400,
      error: "Cannot offboard platform admin",
      code: "PLATFORM_ADMIN",
    };
  }
  if (input.targetStatus === "disabled") {
    return {
      ok: false,
      status: 400,
      error: "Member is already disabled",
      code: "ALREADY_DISABLED",
    };
  }
  return { ok: true };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isOptionalContactEmail(value: string | null | undefined): boolean {
  if (value == null || value.trim() === "") return true;
  return EMAIL_RE.test(value.trim()) && value.trim().length <= 320;
}

export function normalizeContactEmail(
  value: string | null | undefined,
): string | null {
  if (value == null || value.trim() === "") return null;
  return value.trim().toLowerCase();
}

export function normalizeContactName(
  value: string | null | undefined,
): string | null {
  if (value == null || value.trim() === "") return null;
  return value.trim().slice(0, 255);
}

export function validateContactsPatch(input: {
  billingContactEmail?: string | null;
  securityContactEmail?: string | null;
}): string | null {
  if (
    input.billingContactEmail !== undefined &&
    !isOptionalContactEmail(input.billingContactEmail)
  ) {
    return "Invalid billing contact email";
  }
  if (
    input.securityContactEmail !== undefined &&
    !isOptionalContactEmail(input.securityContactEmail)
  ) {
    return "Invalid security contact email";
  }
  return null;
}
