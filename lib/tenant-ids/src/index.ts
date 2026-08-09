/**
 * Canonical tenant ID adapter for SpartanCoaching.
 *
 * Product auth/billing use serial integer IDs:
 *   client_organizations.id, client_members.id
 *
 * Sales Command Center (hospice-sales-runtime) stores UUID organizationId
 * and actor userId. This module is the **only** allowed mapping between them.
 *
 * Format (stable, deterministic — do not change without a data migration):
 *   organization → 00000000-0000-5000-8000-{12-hex-of-id}
 *   member       → 00000000-0000-5000-9000-{12-hex-of-id}
 *
 * Never invent alternate UUID schemes for workflow tenants.
 */

export type TenantEntityKind = "organization" | "member";

const UUID_RE =
  /^00000000-0000-5000-([89])000-([0-9a-f]{12})$/i;

function assertPositiveInt(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1 || value > Number.MAX_SAFE_INTEGER) {
    throw new Error(`${label} must be a positive integer (got ${String(value)})`);
  }
  return value;
}

function toHexSuffix(value: number): string {
  return value.toString(16).padStart(12, "0").slice(-12);
}

function fromHexSuffix(hex: string): number {
  const n = Number.parseInt(hex, 16);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Invalid tenant id hex suffix: ${hex}`);
  }
  return n;
}

/** Map client_organizations.id → workflow organization UUID. */
export function organizationIdToWorkflowUuid(organizationId: number): string {
  const id = assertPositiveInt(organizationId, "organizationId");
  return `00000000-0000-5000-8000-${toHexSuffix(id)}`;
}

/** Map client_members.id → workflow actor user UUID. */
export function memberIdToWorkflowUuid(memberId: number): string {
  const id = assertPositiveInt(memberId, "memberId");
  return `00000000-0000-5000-9000-${toHexSuffix(id)}`;
}

/**
 * Generic encoder used by UI layers that pass kind + value.
 * Prefer the typed helpers for new call sites.
 */
export function toWorkflowUuid(kind: TenantEntityKind, value: number): string {
  return kind === "organization"
    ? organizationIdToWorkflowUuid(value)
    : memberIdToWorkflowUuid(value);
}

export type ParsedWorkflowTenantId =
  | { kind: "organization"; id: number; uuid: string }
  | { kind: "member"; id: number; uuid: string };

/**
 * Reverse a synthetic workflow UUID produced by this module.
 * Returns null for non-synthetic UUIDs (e.g. random entity ids).
 */
export function parseWorkflowTenantUuid(uuid: string): ParsedWorkflowTenantId | null {
  if (typeof uuid !== "string") return null;
  const match = UUID_RE.exec(uuid.trim());
  if (!match) return null;
  const variant = match[1];
  const hex = match[2]!.toLowerCase();
  try {
    const id = fromHexSuffix(hex);
    if (variant === "8") {
      return { kind: "organization", id, uuid: organizationIdToWorkflowUuid(id) };
    }
    return { kind: "member", id, uuid: memberIdToWorkflowUuid(id) };
  } catch {
    return null;
  }
}

export function workflowUuidToOrganizationId(uuid: string): number | null {
  const parsed = parseWorkflowTenantUuid(uuid);
  return parsed?.kind === "organization" ? parsed.id : null;
}

export function workflowUuidToMemberId(uuid: string): number | null {
  const parsed = parseWorkflowTenantUuid(uuid);
  return parsed?.kind === "member" ? parsed.id : null;
}

/** True when two workflow org UUIDs denote the same tenant. */
export function sameWorkflowOrganization(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  if (!left || !right) return false;
  return left.toLowerCase() === right.toLowerCase();
}

/**
 * Build the actor identity fields Command Center expects from product auth IDs.
 * Role mapping (member → rep, org_admin/platform_admin → manager) stays at the
 * call site so auth policy remains in the API layer.
 */
export function workflowIdentityFromMember(input: {
  memberId: number;
  organizationId: number;
}): { organizationId: string; userId: string } {
  return {
    organizationId: organizationIdToWorkflowUuid(input.organizationId),
    userId: memberIdToWorkflowUuid(input.memberId),
  };
}

// Domain object inventory (Slice A — types only; no schema changes)
export {
  HSP_DOMAIN_OBJECTS,
  getDomainObject,
  forbiddenParallelTableObjects,
  notModeledDomainObjects,
  workflowEntityDomainObjects,
  assertNoForbiddenParallelTable,
  tenantKeyFor,
  type DomainObjectId,
  type DomainObjectSpec,
  type DomainStorageKind,
  type TenantKeyStyle,
} from "./domain-map";
