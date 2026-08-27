/**
 * Provider-owned resource library rules (HSP-28 Slice A).
 *
 * Pure isolation + presentation helpers. Core (global) resources stay on
 * `resources`; provider private items use `provider_resources` only.
 */

import { getToolById } from "@workspace/field-kit-catalog";
import type { ProviderResourceWorkflowMeta } from "@workspace/db";
import { findPotentialIdentifiers } from "../clinical/deidentification";

export const PROVIDER_RESOURCE_LIBRARY_VERSION = "provider-resource-library-v1";

export const CORE_OWNERSHIP_LABEL = "Hospice Sales Pro Core";
export const PROVIDER_OWNERSHIP_LABEL = "Provider organization";

export const PROVIDER_RESOURCE_KINDS = [
  "script",
  "coverage_map",
  "referral_process",
  "escalation_guide",
  "service_reference",
  "onboarding",
  "sales_process",
  "form",
  "scorecard",
  "brand_material",
  "policy",
  "other",
] as const;

export type ProviderResourceKindId = (typeof PROVIDER_RESOURCE_KINDS)[number];

export type ProviderResourceStatusId =
  | "draft"
  | "in_review"
  | "published"
  | "archived"
  | "deleted";

const WORKFLOW_TEXT_MAX = 500;
const WORKFLOW_KEYS = new Set([
  "job",
  "expectedOutput",
  "reviewCheckpoint",
  "nextToolId",
]);

export type ProviderWorkflowValidation =
  | { ok: true; value: ProviderResourceWorkflowMeta | null }
  | { ok: false; code: string; message: string };

/**
 * Validate the small, static workflow contract stored with a provider item.
 * A catalog ID is required instead of accepting arbitrary URLs or member
 * context, so clients can only link to a real Field Kit destination.
 */
export function validateWorkflowMetadata(input: unknown): ProviderWorkflowValidation {
  if (input === undefined || input === null) return { ok: true, value: null };
  if (typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      code: "INVALID_WORKFLOW",
      message: "workflow must be an object.",
    };
  }

  const raw = input as Record<string, unknown>;
  for (const key of Object.keys(raw)) {
    if (!WORKFLOW_KEYS.has(key)) {
      return {
        ok: false,
        code: "INVALID_WORKFLOW",
        message: `workflow.${key} is not supported.`,
      };
    }
  }

  const value: ProviderResourceWorkflowMeta = {};
  for (const key of ["job", "expectedOutput", "reviewCheckpoint"] as const) {
    const rawValue = raw[key];
    if (rawValue === undefined || rawValue === null || rawValue === "") continue;
    if (typeof rawValue !== "string" || rawValue.trim().length > WORKFLOW_TEXT_MAX) {
      return {
        ok: false,
        code: "INVALID_WORKFLOW",
        message: `workflow.${key} must be text no longer than ${WORKFLOW_TEXT_MAX} characters.`,
      };
    }
    const trimmed = rawValue.trim();
    if (trimmed) value[key] = trimmed;
  }

  const nextToolId = raw.nextToolId;
  if (nextToolId !== undefined && nextToolId !== null && nextToolId !== "") {
    if (
      typeof nextToolId !== "string" ||
      !nextToolId.trim() ||
      !getToolById(nextToolId.trim())
    ) {
      return {
        ok: false,
        code: "INVALID_NEXT_TOOL",
        message: "workflow.nextToolId must reference a Field Kit catalog tool.",
      };
    }
    value.nextToolId = nextToolId.trim();
  }

  if (findPotentialIdentifiers(value).length) {
    return {
      ok: false,
      code: "POTENTIAL_PHI_DETECTED",
      message:
        "Remove patient identifiers and member contact details before saving workflow guidance.",
    };
  }

  return { ok: true, value: Object.keys(value).length ? value : null };
}

export type ProviderResourceRow = {
  id: number;
  organizationId: number;
  title: string;
  description: string | null;
  fileUrl: string;
  kind: string;
  status: string;
  ownership: string;
  meta: Record<string, unknown> | null;
  createdByMemberId: number;
  updatedByMemberId: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  archivedAt: Date | string | null;
  deletedAt: Date | string | null;
};

const KIND_SET = new Set<string>(PROVIDER_RESOURCE_KINDS);
const STATUS_SET = new Set<string>([
  "draft",
  "in_review",
  "published",
  "archived",
  "deleted",
]);

export function isProviderResourceKind(v: string): v is ProviderResourceKindId {
  return KIND_SET.has(v);
}

export function normalizeKind(v: unknown): ProviderResourceKindId {
  const s = String(v || "other").trim().toLowerCase();
  return isProviderResourceKind(s) ? s : "other";
}

export function normalizeStatus(v: unknown): ProviderResourceStatusId {
  const s = String(v || "draft").trim().toLowerCase();
  return STATUS_SET.has(s) ? (s as ProviderResourceStatusId) : "draft";
}

/**
 * Tenant isolation: row must belong to session organization.
 * Never trust client-supplied organizationId for authorization.
 */
export function assertProviderResourceOrgAccess(
  rowOrgId: number,
  sessionOrgId: number,
): { ok: true } | { ok: false; code: string; message: string } {
  if (
    !Number.isFinite(rowOrgId) ||
    !Number.isFinite(sessionOrgId) ||
    rowOrgId < 1 ||
    sessionOrgId < 1
  ) {
    return {
      ok: false,
      code: "INVALID_TENANT",
      message: "Organization context is required.",
    };
  }
  if (rowOrgId !== sessionOrgId) {
    return {
      ok: false,
      code: "TENANT_ISOLATION",
      message: "Provider resource is not available for this organization.",
    };
  }
  return { ok: true };
}

/** Members see published only; org admins see non-deleted. */
export function canViewProviderResource(
  status: string,
  isOrgAdmin: boolean,
): boolean {
  const s = normalizeStatus(status);
  if (s === "deleted") return false;
  if (isOrgAdmin) return true;
  return s === "published";
}

export function canManageProviderLibrary(isOrgAdmin: boolean): boolean {
  return isOrgAdmin;
}

export function sanitizeFileUrl(url: unknown): string | null {
  const s = String(url || "").trim().slice(0, 1000);
  if (!s) return null;
  // Allow app object paths and https only (no javascript: etc.)
  if (s.startsWith("/objects/") || s.startsWith("/resources/files/")) return s;
  if (/^https:\/\//i.test(s)) return s;
  return null;
}

export function sanitizeMeta(
  input: unknown,
): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (Array.isArray(raw.tags)) {
    out.tags = raw.tags
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 20);
  }
  if (Array.isArray(raw.audience)) {
    out.audience = raw.audience
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 10);
  }
  if (typeof raw.whenToUse === "string" && raw.whenToUse.trim()) {
    out.whenToUse = raw.whenToUse.trim().slice(0, 1000);
  }
  if (typeof raw.reviewer === "string" && raw.reviewer.trim()) {
    out.reviewer = raw.reviewer.trim().slice(0, 200);
  }
  if (typeof raw.reviewDueAt === "string") {
    out.reviewDueAt = raw.reviewDueAt.trim().slice(0, 64) || null;
  }
  if (typeof raw.versionLabel === "string" && raw.versionLabel.trim()) {
    out.versionLabel = raw.versionLabel.trim().slice(0, 32);
  }
  const workflow = validateWorkflowMetadata(raw.workflow);
  if (workflow.ok && workflow.value) {
    out.workflow = workflow.value;
  }
  return Object.keys(out).length ? out : null;
}

export function presentProviderResource(row: ProviderResourceRow) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    description: row.description,
    fileUrl: row.fileUrl,
    kind: normalizeKind(row.kind),
    status: normalizeStatus(row.status),
    ownership: "provider" as const,
    ownershipLabel: PROVIDER_OWNERSHIP_LABEL,
    /** Explicit contrast with Core library. */
    isProviderOwned: true,
    isCore: false,
    // Normalize old JSONB on every read. A malformed or identifier-bearing
    // legacy workflow must fall back to the catalog guide, never reach a UI.
    meta: sanitizeMeta(row.meta),
    createdByMemberId: row.createdByMemberId,
    updatedByMemberId: row.updatedByMemberId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    archivedAt: row.archivedAt,
    deletedAt: row.deletedAt,
  };
}

/** Label Core (global) resources for mixed UIs. */
export function presentCoreResourceLabel<T extends Record<string, unknown>>(
  resource: T,
): T & {
  ownership: "core";
  ownershipLabel: typeof CORE_OWNERSHIP_LABEL;
  isProviderOwned: false;
  isCore: true;
} {
  return {
    ...resource,
    ownership: "core",
    ownershipLabel: CORE_OWNERSHIP_LABEL,
    isProviderOwned: false,
    isCore: true,
  };
}

export function matchesSearch(
  row: { title: string; description: string | null; kind: string; meta: Record<string, unknown> | null },
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const tags = Array.isArray(row.meta?.tags)
    ? (row.meta!.tags as string[]).join(" ")
    : "";
  const blob = `${row.title} ${row.description || ""} ${row.kind} ${tags}`.toLowerCase();
  return blob.includes(needle);
}

export function allowedTransitions(
  from: ProviderResourceStatusId,
): ProviderResourceStatusId[] {
  switch (from) {
    case "draft":
      return ["in_review", "published", "archived", "deleted"];
    case "in_review":
      return ["draft", "published", "archived", "deleted"];
    case "published":
      return ["archived", "in_review", "deleted"];
    case "archived":
      return ["draft", "published", "deleted"];
    case "deleted":
      return [];
    default:
      return ["draft"];
  }
}
