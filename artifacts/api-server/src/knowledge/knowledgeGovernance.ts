/**
 * Knowledge governance: freshness, source authority, lifecycle (HSP-16 Slice A).
 *
 * Every knowledge item carries source authority metadata, versioning, review
 * cadence, and status. Retired / superseded items are never retrievable as
 * "current". Distinguishes Spartan methodology from regulation, Medicare
 * guidance, general hospice education, provider policy, and sales practice.
 *
 * In-memory store for Slice A (same pattern as HSP-15 provider registry).
 * Swap for Postgres in a later slice — API contracts stay stable.
 */

import { SPARTAN_CORPUS, type KnowledgeChunk } from "./spartanCorpus";

export const KNOWLEDGE_GOVERNANCE_VERSION = "knowledge-governance-v1";

/** Authority / domain classification (not the three-layer tenant model). */
export type KnowledgeSourceType =
  | "spartan_methodology"
  | "regulation"
  | "medicare_guidance"
  | "hospice_education"
  | "provider_policy"
  | "sales_practice";

export type KnowledgeItemStatus =
  | "draft"
  | "current"
  | "retired"
  | "superseded";

export type ConfidenceClassification =
  | "high"
  | "medium"
  | "low"
  | "provisional";

export type KnowledgeGovernanceRecord = {
  id: string;
  /** Stable lineage id across versions (defaults to first version id). */
  lineageId: string;
  title: string;
  body: string;
  sourceType: KnowledgeSourceType;
  /** Product org id for provider_policy; null for shared core. */
  sourceOrganizationId: number | null;
  sourceOrganizationName: string | null;
  sourceDocument: string | null;
  sourceLocation: string | null;
  publicationDate: string | null;
  effectiveDate: string | null;
  reviewedDate: string | null;
  reviewer: string | null;
  clinicalReviewer: string | null;
  complianceReviewer: string | null;
  version: string;
  jurisdiction: string | null;
  /** Days between required reviews. */
  reviewIntervalDays: number;
  status: KnowledgeItemStatus;
  supersededById: string | null;
  tags: string[];
  confidence: ConfidenceClassification;
  /** When clinical review is required for this source type. */
  requiresClinicalReview: boolean;
  requiresComplianceReview: boolean;
  createdAt: string;
  updatedAt: string;
  /** Optional category bridge to Spartan corpus. */
  corpusCategory?: string;
};

export type SourceDisplay = {
  sourceType: KnowledgeSourceType;
  sourceTypeLabel: string;
  sourceOrganizationName: string | null;
  sourceDocument: string | null;
  sourceLocation: string | null;
  version: string;
  status: KnowledgeItemStatus;
  confidence: ConfidenceClassification;
  jurisdiction: string | null;
  effectiveDate: string | null;
  reviewedDate: string | null;
  citationLine: string;
};

export type ReviewReminder = {
  id: string;
  title: string;
  sourceType: KnowledgeSourceType;
  reviewedDate: string | null;
  reviewIntervalDays: number;
  dueAt: string;
  overdue: boolean;
  daysUntilDue: number;
  requiresClinicalReview: boolean;
  requiresComplianceReview: boolean;
};

const SOURCE_TYPE_LABELS: Record<KnowledgeSourceType, string> = {
  spartan_methodology: "Spartan methodology",
  regulation: "Regulation",
  medicare_guidance: "Medicare guidance",
  hospice_education: "General hospice education",
  provider_policy: "Provider policy",
  sales_practice: "Sales practice",
};

/** In-memory governance store: id → record (all versions). */
const store = new Map<string, KnowledgeGovernanceRecord>();
/** lineageId → ordered version ids (oldest first). */
const lineageIndex = new Map<string, string[]>();

export function clearKnowledgeGovernanceStore(): void {
  store.clear();
  lineageIndex.clear();
  coreSeeded = false;
}

let coreSeeded = false;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

function requiresClinical(sourceType: KnowledgeSourceType): boolean {
  return (
    sourceType === "regulation" ||
    sourceType === "medicare_guidance" ||
    sourceType === "hospice_education"
  );
}

function requiresCompliance(sourceType: KnowledgeSourceType): boolean {
  return (
    sourceType === "regulation" ||
    sourceType === "medicare_guidance" ||
    sourceType === "provider_policy"
  );
}

function categoryToSourceType(
  category: KnowledgeChunk["category"],
): KnowledgeSourceType {
  if (category === "method" || category === "operations")
    return "spartan_methodology";
  if (category === "eligibility") return "medicare_guidance";
  if (category === "ethics") return "regulation";
  if (category === "objection" || category === "territory")
    return "sales_practice";
  return "hospice_education";
}

/**
 * True when item may be returned as current authoritative knowledge.
 * Draft, retired, and superseded are excluded.
 */
export function isRetrievableAsCurrent(
  item: KnowledgeGovernanceRecord,
  nowIso: string = new Date().toISOString(),
): boolean {
  if (item.status !== "current") return false;
  const now = Date.parse(nowIso);
  if (Number.isNaN(now)) return item.status === "current";
  const effective = parseDate(item.effectiveDate);
  if (effective !== null && effective > now) return false;
  return true;
}

/**
 * Review due date = reviewedDate (or effectiveDate/publicationDate) + interval.
 */
export function reviewDueAt(
  item: KnowledgeGovernanceRecord,
): string | null {
  const base =
    parseDate(item.reviewedDate) ??
    parseDate(item.effectiveDate) ??
    parseDate(item.publicationDate);
  if (base === null) return null;
  const due = new Date(base + item.reviewIntervalDays * 86_400_000);
  return due.toISOString();
}

export function needsReview(
  item: KnowledgeGovernanceRecord,
  nowIso: string = new Date().toISOString(),
): boolean {
  if (item.status !== "current" && item.status !== "draft") return false;
  const due = reviewDueAt(item);
  if (!due) return true;
  return Date.parse(nowIso) >= Date.parse(due);
}

export function buildSourceDisplay(
  item: KnowledgeGovernanceRecord,
): SourceDisplay {
  const typeLabel = SOURCE_TYPE_LABELS[item.sourceType];
  const parts = [
    typeLabel,
    item.sourceOrganizationName,
    item.sourceDocument,
    item.version ? `v${item.version}` : null,
    item.jurisdiction,
    item.status !== "current" ? `(${item.status})` : null,
  ].filter(Boolean);
  return {
    sourceType: item.sourceType,
    sourceTypeLabel: typeLabel,
    sourceOrganizationName: item.sourceOrganizationName,
    sourceDocument: item.sourceDocument,
    sourceLocation: item.sourceLocation,
    version: item.version,
    status: item.status,
    confidence: item.confidence,
    jurisdiction: item.jurisdiction,
    effectiveDate: item.effectiveDate,
    reviewedDate: item.reviewedDate,
    citationLine: parts.join(" · "),
  };
}

export function sanitizeGovernanceInput(
  raw: Partial<KnowledgeGovernanceRecord> & {
    title: string;
    body: string;
    sourceType: KnowledgeSourceType;
  },
  opts: { id: string; nowIso: string; existing?: KnowledgeGovernanceRecord },
): KnowledgeGovernanceRecord {
  const now = opts.nowIso;
  const sourceType = raw.sourceType;
  const reviewIntervalDays = Math.min(
    Math.max(
      typeof raw.reviewIntervalDays === "number"
        ? raw.reviewIntervalDays
        : 365,
      30,
    ),
    3650,
  );
  const status = (raw.status ?? "draft") as KnowledgeItemStatus;
  if (!["draft", "current", "retired", "superseded"].includes(status)) {
    throw Object.assign(new Error("Invalid status"), {
      code: "INVALID_STATUS",
      status: 400,
    });
  }
  if (
    status === "current" &&
    requiresClinical(sourceType) &&
    !raw.clinicalReviewer &&
    !opts.existing?.clinicalReviewer
  ) {
    throw Object.assign(
      new Error("Clinical reviewer is required before publishing this source type"),
      { code: "CLINICAL_REVIEW_REQUIRED", status: 400 },
    );
  }
  if (
    status === "current" &&
    requiresCompliance(sourceType) &&
    !raw.complianceReviewer &&
    !opts.existing?.complianceReviewer
  ) {
    throw Object.assign(
      new Error(
        "Compliance reviewer is required before publishing this source type",
      ),
      { code: "COMPLIANCE_REVIEW_REQUIRED", status: 400 },
    );
  }

  const orgId =
    sourceType === "provider_policy"
      ? raw.sourceOrganizationId ?? opts.existing?.sourceOrganizationId ?? null
      : null;

  return {
    id: opts.id,
    lineageId: raw.lineageId ?? opts.existing?.lineageId ?? opts.id,
    title: String(raw.title).trim().slice(0, 200),
    body: String(raw.body).trim().slice(0, 8000),
    sourceType,
    sourceOrganizationId: orgId,
    sourceOrganizationName:
      raw.sourceOrganizationName?.trim().slice(0, 200) ??
      opts.existing?.sourceOrganizationName ??
      null,
    sourceDocument:
      raw.sourceDocument?.trim().slice(0, 300) ??
      opts.existing?.sourceDocument ??
      null,
    sourceLocation:
      raw.sourceLocation?.trim().slice(0, 500) ??
      opts.existing?.sourceLocation ??
      null,
    publicationDate: raw.publicationDate ?? opts.existing?.publicationDate ?? null,
    effectiveDate: raw.effectiveDate ?? opts.existing?.effectiveDate ?? null,
    reviewedDate: raw.reviewedDate ?? opts.existing?.reviewedDate ?? null,
    reviewer: raw.reviewer?.trim().slice(0, 120) ?? opts.existing?.reviewer ?? null,
    clinicalReviewer:
      raw.clinicalReviewer?.trim().slice(0, 120) ??
      opts.existing?.clinicalReviewer ??
      null,
    complianceReviewer:
      raw.complianceReviewer?.trim().slice(0, 120) ??
      opts.existing?.complianceReviewer ??
      null,
    version: String(raw.version ?? opts.existing?.version ?? "1").slice(0, 40),
    jurisdiction:
      raw.jurisdiction?.trim().slice(0, 80) ??
      opts.existing?.jurisdiction ??
      null,
    reviewIntervalDays,
    status,
    supersededById:
      raw.supersededById ?? opts.existing?.supersededById ?? null,
    tags: (raw.tags ?? opts.existing?.tags ?? [])
      .filter((t) => typeof t === "string")
      .map((t) => t.slice(0, 40))
      .slice(0, 30),
    confidence: (raw.confidence ??
      opts.existing?.confidence ??
      "medium") as ConfidenceClassification,
    requiresClinicalReview: requiresClinical(sourceType),
    requiresComplianceReview: requiresCompliance(sourceType),
    createdAt: opts.existing?.createdAt ?? now,
    updatedAt: now,
    corpusCategory: raw.corpusCategory ?? opts.existing?.corpusCategory,
  };
}

function indexLineage(record: KnowledgeGovernanceRecord): void {
  const list = lineageIndex.get(record.lineageId) ?? [];
  if (!list.includes(record.id)) list.push(record.id);
  lineageIndex.set(record.lineageId, list);
}

export function upsertGovernedItem(
  record: KnowledgeGovernanceRecord,
): KnowledgeGovernanceRecord {
  store.set(record.id, record);
  indexLineage(record);
  return record;
}

export function getGovernedItem(
  id: string,
): KnowledgeGovernanceRecord | undefined {
  ensureCoreSeeded();
  return store.get(id);
}

export function listVersionHistory(
  lineageId: string,
): KnowledgeGovernanceRecord[] {
  ensureCoreSeeded();
  const ids = lineageIndex.get(lineageId) ?? [];
  return ids
    .map((id) => store.get(id))
    .filter((r): r is KnowledgeGovernanceRecord => Boolean(r))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Replace current item with a new version: old → superseded, new → current/draft.
 */
export function supersedeKnowledgeItem(
  oldId: string,
  replacement: Omit<
    Partial<KnowledgeGovernanceRecord> & {
      title: string;
      body: string;
      sourceType: KnowledgeSourceType;
    },
    "id" | "supersededById" | "status"
  > & { status?: KnowledgeItemStatus; version?: string },
  nowIso: string = new Date().toISOString(),
): { previous: KnowledgeGovernanceRecord; next: KnowledgeGovernanceRecord } {
  ensureCoreSeeded();
  const previous = store.get(oldId);
  if (!previous) {
    throw Object.assign(new Error("Knowledge item not found"), {
      code: "NOT_FOUND",
      status: 404,
    });
  }
  const nextId = `${previous.lineageId}-v${Date.now().toString(36)}`;
  const next = sanitizeGovernanceInput(
    {
      ...previous,
      ...replacement,
      lineageId: previous.lineageId,
      version:
        replacement.version ??
        String(Number.parseInt(previous.version, 10) + 1 || previous.version + ".1"),
      status: replacement.status ?? "current",
      supersededById: null,
    },
    { id: nextId, nowIso, existing: previous },
  );
  const prevUpdated: KnowledgeGovernanceRecord = {
    ...previous,
    status: "superseded",
    supersededById: next.id,
    updatedAt: nowIso,
  };
  store.set(previous.id, prevUpdated);
  store.set(next.id, next);
  indexLineage(next);
  return { previous: prevUpdated, next };
}

export function retireKnowledgeItem(
  id: string,
  nowIso: string = new Date().toISOString(),
): KnowledgeGovernanceRecord {
  ensureCoreSeeded();
  const item = store.get(id);
  if (!item) {
    throw Object.assign(new Error("Knowledge item not found"), {
      code: "NOT_FOUND",
      status: 404,
    });
  }
  const retired = { ...item, status: "retired" as const, updatedAt: nowIso };
  store.set(id, retired);
  return retired;
}

/**
 * Items eligible for current retrieval (status + effective date).
 * Optionally scoped to organization (provider_policy only for that org + shared core).
 */
export function listCurrentRetrievable(opts?: {
  organizationId?: number | null;
  sourceTypes?: KnowledgeSourceType[];
  nowIso?: string;
}): KnowledgeGovernanceRecord[] {
  ensureCoreSeeded();
  const now = opts?.nowIso ?? new Date().toISOString();
  const orgId = opts?.organizationId;
  return [...store.values()].filter((item) => {
    if (!isRetrievableAsCurrent(item, now)) return false;
    if (opts?.sourceTypes && !opts.sourceTypes.includes(item.sourceType)) {
      return false;
    }
    if (item.sourceType === "provider_policy") {
      if (orgId == null) return false;
      return item.sourceOrganizationId === orgId;
    }
    // Shared core types never carry a foreign org
    return item.sourceOrganizationId == null;
  });
}

/** Prevent retired/superseded ids from retrieval sets. */
export function filterOutNonCurrentIds(
  ids: string[],
  nowIso?: string,
): string[] {
  ensureCoreSeeded();
  const now = nowIso ?? new Date().toISOString();
  return ids.filter((id) => {
    const item = store.get(id);
    if (!item) return true; // unknown ids left to underlying corpus
    return isRetrievableAsCurrent(item, now);
  });
}

export function listReviewReminders(opts?: {
  organizationId?: number | null;
  nowIso?: string;
  includeOverdueOnly?: boolean;
}): ReviewReminder[] {
  ensureCoreSeeded();
  const nowIso = opts?.nowIso ?? new Date().toISOString();
  const now = Date.parse(nowIso);
  const reminders: ReviewReminder[] = [];

  for (const item of store.values()) {
    if (item.status !== "current" && item.status !== "draft") continue;
    if (
      item.sourceType === "provider_policy" &&
      opts?.organizationId != null &&
      item.sourceOrganizationId !== opts.organizationId
    ) {
      continue;
    }
    if (
      item.sourceType === "provider_policy" &&
      opts?.organizationId == null
    ) {
      continue;
    }
    if (!needsReview(item, nowIso) && opts?.includeOverdueOnly) continue;
    if (!needsReview(item, nowIso) && !opts?.includeOverdueOnly) {
      // still include upcoming within 30 days
      const due = reviewDueAt(item);
      if (!due) continue;
      const days = Math.ceil((Date.parse(due) - now) / 86_400_000);
      if (days > 30) continue;
    }
    const dueAt = reviewDueAt(item) ?? nowIso;
    const daysUntilDue = Math.ceil((Date.parse(dueAt) - now) / 86_400_000);
    reminders.push({
      id: item.id,
      title: item.title,
      sourceType: item.sourceType,
      reviewedDate: item.reviewedDate,
      reviewIntervalDays: item.reviewIntervalDays,
      dueAt,
      overdue: daysUntilDue <= 0,
      daysUntilDue,
      requiresClinicalReview: item.requiresClinicalReview,
      requiresComplianceReview: item.requiresComplianceReview,
    });
  }
  return reminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

export function listGovernedItems(opts?: {
  organizationId?: number | null;
  status?: KnowledgeItemStatus;
  sourceType?: KnowledgeSourceType;
  includeSharedCore?: boolean;
}): KnowledgeGovernanceRecord[] {
  ensureCoreSeeded();
  return [...store.values()]
    .filter((item) => {
      if (opts?.status && item.status !== opts.status) return false;
      if (opts?.sourceType && item.sourceType !== opts.sourceType) return false;
      if (item.sourceType === "provider_policy") {
        if (opts?.organizationId == null) return false;
        return item.sourceOrganizationId === opts.organizationId;
      }
      return opts?.includeSharedCore !== false;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Seed governance metadata for Spartan corpus (idempotent).
 */
export function ensureCoreSeeded(
  nowIso: string = "2026-01-01T00:00:00.000Z",
): void {
  if (coreSeeded && store.size > 0) return;
  for (const chunk of SPARTAN_CORPUS) {
    if (store.has(chunk.id)) continue;
    const sourceType = categoryToSourceType(chunk.category);
    const record: KnowledgeGovernanceRecord = {
      id: chunk.id,
      lineageId: chunk.id,
      title: chunk.title,
      body: chunk.body,
      sourceType,
      sourceOrganizationId: null,
      sourceOrganizationName: "Hospice Sales Pro / Spartan Coaching",
      sourceDocument: "Spartan Method corpus v1",
      sourceLocation: `corpus://${chunk.id}`,
      publicationDate: "2025-01-01",
      effectiveDate: "2025-01-01",
      reviewedDate: "2025-06-01",
      reviewer: "spartan-core-editorial",
      clinicalReviewer:
        requiresClinical(sourceType) ? "spartan-clinical-review" : null,
      complianceReviewer:
        requiresCompliance(sourceType) ? "spartan-compliance-review" : null,
      version: "1",
      jurisdiction: "US",
      reviewIntervalDays: sourceType === "medicare_guidance" ? 180 : 365,
      status: "current",
      supersededById: null,
      tags: chunk.tags,
      confidence: sourceType === "spartan_methodology" ? "high" : "medium",
      requiresClinicalReview: requiresClinical(sourceType),
      requiresComplianceReview: requiresCompliance(sourceType),
      createdAt: nowIso,
      updatedAt: nowIso,
      corpusCategory: chunk.category,
    };
    store.set(record.id, record);
    indexLineage(record);
  }
  coreSeeded = true;
}

/** Register a provider-policy governed item for an org (tenant isolated). */
export function upsertProviderGovernedItem(
  organizationId: number,
  input: {
    id: string;
    title: string;
    body: string;
    sourceDocument?: string;
    sourceLocation?: string;
    version?: string;
    status?: KnowledgeItemStatus;
    tags?: string[];
    confidence?: ConfidenceClassification;
    reviewer?: string;
    clinicalReviewer?: string;
    complianceReviewer?: string;
    reviewedDate?: string;
    effectiveDate?: string;
    publicationDate?: string;
    jurisdiction?: string;
    reviewIntervalDays?: number;
    sourceOrganizationName?: string;
  },
  nowIso: string = new Date().toISOString(),
): KnowledgeGovernanceRecord {
  if (!Number.isInteger(organizationId) || organizationId < 1) {
    throw Object.assign(new Error("Valid organizationId required"), {
      code: "INVALID_ORGANIZATION",
      status: 400,
    });
  }
  const existing = store.get(input.id);
  if (
    existing &&
    existing.sourceOrganizationId != null &&
    existing.sourceOrganizationId !== organizationId
  ) {
    throw Object.assign(new Error("Knowledge item belongs to another organization"), {
      code: "FORBIDDEN",
      status: 403,
    });
  }
  const record = sanitizeGovernanceInput(
    {
      ...input,
      sourceType: "provider_policy",
      sourceOrganizationId: organizationId,
      sourceOrganizationName:
        input.sourceOrganizationName ?? `Organization ${organizationId}`,
    },
    { id: input.id, nowIso, existing },
  );
  return upsertGovernedItem(record);
}

export { SOURCE_TYPE_LABELS };
