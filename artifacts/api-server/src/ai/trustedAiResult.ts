/**
 * Trusted AI Result Architecture (HSP-21 Slice A).
 *
 * Shared semantic contract for Hospice Sales Pro AI outputs. Tools keep their
 * own visual presentation; this envelope standardizes meaning so clients can
 * render recommendation, wording, sources, boundaries, and actions consistently.
 *
 * NEVER fabricate source authority. Empty citations → empty sourceBasis (or
 * explicit model_generated with disclaimer). Clinical/policy snapshots only
 * appear when a real snapshot/document id is provided.
 */

export const TRUSTED_AI_RESULT_VERSION = "trusted-ai-result-v1";

export const TRUSTED_AI_TRUST_NOTICE =
  "Coaching aid only. Not clinical advice, not an admission decision, and not a substitute for physician judgment. Do not enter PHI.";

export const DEFAULT_PROFESSIONAL_BOUNDARY =
  "Do not enter patient names, MRNs, dates of birth, SSNs, or other identifiers. Educate and equip referral sources; physicians determine eligibility and care decisions.";

/** Known provenance only — do not invent CMS/policy authority. */
export type SourceAuthority =
  | "spartan_methodology"
  | "provider_approved"
  | "cms_policy_snapshot"
  | "user_supplied_context"
  | "model_generated"
  | "unknown";

export type TrustedSourceBasis = {
  id: string;
  title: string;
  authority: SourceAuthority;
  kind?: string;
  sourceUrl?: string;
  snapshotId?: string;
  documentId?: string;
  /** Shown when authority is weak or model-only. */
  disclaimer?: string;
};

export type TrustedAiActions = {
  canSave: boolean;
  canCopy: boolean;
  canShare: boolean;
};

export type TrustedAiRetention =
  | "ephemeral"
  | "member_saved"
  | "run_persisted"
  | "clinical_ephemeral";

export type TrustedAiResult = {
  schemaVersion: typeof TRUSTED_AI_RESULT_VERSION;
  toolId: string;
  toolLabel?: string;
  recommendation?: string;
  suggestedWording?: string;
  whyThisFits?: string;
  nextMove?: string;
  professionalBoundary: string;
  sourceBasis: TrustedSourceBasis[];
  spartanMethodologyBasis: string[];
  providerGuidance?: string;
  uncertainty?: string;
  relatedToolIds: string[];
  relatedResourceIds: string[];
  feedback: {
    enabled: boolean;
    hint?: string;
  };
  actions: TrustedAiActions;
  /** Flattened readable text for copy/share and long-answer accessibility. */
  plainText: string;
  retention: TrustedAiRetention;
  recoverable: boolean;
  trustNotice: string;
  createdAt: string;
};

export type CitationLike = {
  id?: string;
  title?: string;
  category?: string;
  kind?: string;
  source?: string;
  sourceUrl?: string;
  snapshotId?: string;
  documentId?: string;
  version?: string;
  contentHash?: string;
};

export type AssembleTrustedAiResultInput = {
  toolId: string;
  toolLabel?: string;
  /** Primary body (talk track, answer, summary). */
  primaryText?: string;
  recommendation?: string;
  suggestedWording?: string;
  whyThisFits?: string;
  nextMove?: string;
  professionalBoundary?: string;
  providerGuidance?: string;
  uncertainty?: string;
  citations?: CitationLike[];
  /** Only pass when a real coverage/policy snapshot was used. */
  coveragePolicy?: {
    snapshotId?: string;
    documentId?: string;
    version?: string;
    contentHash?: string;
    sourceUrl?: string;
    source?: string;
  } | null;
  spartanMethodologyHints?: string[];
  relatedToolIds?: string[];
  relatedResourceIds?: string[];
  retention?: TrustedAiRetention;
  recoverable?: boolean;
  canSave?: boolean;
  canCopy?: boolean;
  canShare?: boolean;
  feedbackEnabled?: boolean;
  createdAt?: string;
};

const MODEL_GENERATED_DISCLAIMER =
  "Generated wording — not a citable policy or Spartan corpus excerpt. Review before use in the field.";

/**
 * Map known citation provenance to authority. Unknown or missing → unknown
 * (never upgrade to cms_policy_snapshot without snapshot ids).
 */
export function authorityFromCitation(c: CitationLike): SourceAuthority {
  if (c.snapshotId || c.documentId) {
    return "cms_policy_snapshot";
  }
  const source = (c.source || "").toUpperCase();
  if (source.includes("CMS") || source.includes("MCD") || source.includes("LCD")) {
    // Named CMS without snapshot still cannot claim verified snapshot authority.
    return "unknown";
  }
  const category = (c.category || c.kind || "").toLowerCase();
  if (
    category === "method" ||
    category === "ethics" ||
    category === "objection" ||
    category === "eligibility" ||
    category === "territory" ||
    category === "operations"
  ) {
    return "spartan_methodology";
  }
  if (category === "provider" || category === "company") {
    return "provider_approved";
  }
  if (c.id?.startsWith("method-") || c.id?.startsWith("ethics-") || c.id?.startsWith("objection-")) {
    return "spartan_methodology";
  }
  if (c.id || c.title) {
    return "unknown";
  }
  return "unknown";
}

export function sourcesFromCitations(
  citations: CitationLike[] | undefined,
): TrustedSourceBasis[] {
  if (!citations?.length) return [];
  const out: TrustedSourceBasis[] = [];
  for (const c of citations) {
    const id = (c.id || c.snapshotId || c.documentId || "").trim();
    const title = (c.title || c.documentId || c.source || "").trim();
    if (!id && !title) continue;
    const authority = authorityFromCitation(c);
    const entry: TrustedSourceBasis = {
      id: id || `source-${out.length + 1}`,
      title: title || id || "Unnamed source",
      authority,
      kind: c.category || c.kind,
    };
    if (c.sourceUrl) entry.sourceUrl = c.sourceUrl;
    if (c.snapshotId) entry.snapshotId = c.snapshotId;
    if (c.documentId) entry.documentId = c.documentId;
    if (authority === "unknown") {
      entry.disclaimer =
        "Source listed without verified authority class. Do not treat as policy citation.";
    }
    if (authority === "cms_policy_snapshot" && !c.snapshotId && !c.documentId) {
      // Defensive: never emit cms without ids (authorityFromCitation already gates).
      entry.authority = "unknown";
      entry.disclaimer =
        "Policy-like label without snapshot id — authority not claimed.";
    }
    out.push(entry);
  }
  return out;
}

function coverageSource(
  coverage: AssembleTrustedAiResultInput["coveragePolicy"],
): TrustedSourceBasis | null {
  if (!coverage?.snapshotId && !coverage?.documentId) return null;
  return {
    id: coverage.snapshotId || coverage.documentId || "coverage",
    title: coverage.documentId
      ? `Coverage policy ${coverage.documentId}${coverage.version ? ` v${coverage.version}` : ""}`
      : "Coverage policy snapshot",
    authority: "cms_policy_snapshot",
    kind: "coverage_policy",
    snapshotId: coverage.snapshotId,
    documentId: coverage.documentId,
    sourceUrl: coverage.sourceUrl,
  };
}

function buildPlainText(r: Omit<TrustedAiResult, "plainText">): string {
  const parts: string[] = [];
  if (r.recommendation) parts.push(`Recommendation\n${r.recommendation}`);
  if (r.suggestedWording) parts.push(`Suggested wording\n${r.suggestedWording}`);
  if (r.whyThisFits) parts.push(`Why this fits\n${r.whyThisFits}`);
  if (r.nextMove) parts.push(`Next move\n${r.nextMove}`);
  if (r.providerGuidance) parts.push(`Provider guidance\n${r.providerGuidance}`);
  if (r.spartanMethodologyBasis.length) {
    parts.push(
      `Spartan methodology basis\n${r.spartanMethodologyBasis.map((s) => `• ${s}`).join("\n")}`,
    );
  }
  if (r.sourceBasis.length) {
    parts.push(
      `Source basis\n${r.sourceBasis
        .map((s) => `• ${s.title} (${s.authority})${s.disclaimer ? ` — ${s.disclaimer}` : ""}`)
        .join("\n")}`,
    );
  }
  if (r.uncertainty) parts.push(`Uncertainty\n${r.uncertainty}`);
  parts.push(`Professional boundary\n${r.professionalBoundary}`);
  parts.push(r.trustNotice);
  return parts.join("\n\n");
}

/**
 * Assemble a trusted result envelope. Does not invent sources or upgrade
 * authority. Safe to call on every AI tool response path.
 */
export function assembleTrustedAiResult(
  input: AssembleTrustedAiResultInput,
): TrustedAiResult {
  const primary = (input.primaryText || input.suggestedWording || "").trim();
  const suggestedWording =
    (input.suggestedWording || input.primaryText || "").trim() || undefined;
  const recommendation =
    (input.recommendation || "").trim() ||
    (suggestedWording
      ? "Use this wording as a field talk track; adapt to the room."
      : undefined);

  const fromCitations = sourcesFromCitations(input.citations);
  const coverage = coverageSource(input.coveragePolicy ?? null);
  const sourceBasis: TrustedSourceBasis[] = coverage
    ? [
        coverage,
        ...fromCitations.filter(
          (s) => s.snapshotId !== coverage.snapshotId && s.id !== coverage.id,
        ),
      ]
    : [...fromCitations];

  // If the model produced wording but nothing is citable, say so — do not invent corpus hits.
  if (!sourceBasis.length && primary) {
    sourceBasis.push({
      id: "model-output",
      title: "Model-generated field wording",
      authority: "model_generated",
      disclaimer: MODEL_GENERATED_DISCLAIMER,
    });
  }

  const spartanMethodologyBasis = [
    ...(input.spartanMethodologyHints || []),
    ...sourceBasis
      .filter((s) => s.authority === "spartan_methodology")
      .map((s) => s.title),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  const retention = input.retention ?? "ephemeral";
  const canSave = input.canSave ?? retention !== "clinical_ephemeral";

  const base: Omit<TrustedAiResult, "plainText"> = {
    schemaVersion: TRUSTED_AI_RESULT_VERSION,
    toolId: input.toolId,
    toolLabel: input.toolLabel,
    recommendation,
    suggestedWording,
    whyThisFits: input.whyThisFits?.trim() || undefined,
    nextMove: input.nextMove?.trim() || undefined,
    professionalBoundary:
      input.professionalBoundary?.trim() || DEFAULT_PROFESSIONAL_BOUNDARY,
    sourceBasis,
    spartanMethodologyBasis,
    providerGuidance: input.providerGuidance?.trim() || undefined,
    uncertainty:
      input.uncertainty?.trim() ||
      (sourceBasis.every((s) => s.authority === "model_generated")
        ? "No verified corpus or policy citations accompany this answer. Treat as practice wording only."
        : undefined),
    relatedToolIds: input.relatedToolIds ?? [],
    relatedResourceIds: input.relatedResourceIds ?? [],
    feedback: {
      enabled: input.feedbackEnabled ?? true,
      hint: "Rate usefulness after a real visit — feedback improves coaching quality, not clinical claims.",
    },
    actions: {
      canSave,
      canCopy: input.canCopy ?? true,
      canShare: input.canShare ?? true,
    },
    retention,
    recoverable: input.recoverable ?? false,
    trustNotice: TRUSTED_AI_TRUST_NOTICE,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  return {
    ...base,
    plainText: buildPlainText(base),
  };
}

/** Classic Field objection handler → trusted envelope. */
export function assembleFromObjectionResponse(params: {
  response: string;
  citations?: Array<{ id: string; title: string; category: string }>;
}): TrustedAiResult {
  return assembleTrustedAiResult({
    toolId: "objection",
    toolLabel: "Objection Handler",
    primaryText: params.response,
    suggestedWording: params.response,
    whyThisFits:
      "Addresses the spoken concern with empathy, then offers a disciplined next step aligned with the Spartan Method (Discipline, Empathy, Strategy).",
    nextMove:
      "Confirm understanding, offer one specific educational follow-up, and schedule the next conversation — do not pressure for an admission decision.",
    citations: params.citations,
    spartanMethodologyHints: ["Discipline", "Empathy", "Strategy"],
    relatedToolIds: ["roleplay", "playbooks", "email-templates"],
    relatedResourceIds: [],
    retention: "ephemeral",
    recoverable: false,
    canSave: true,
  });
}

/** Classic Field playbook → trusted envelope. */
export function assembleFromPlaybookResponse(params: {
  playbook: string;
  scenario?: string;
}): TrustedAiResult {
  return assembleTrustedAiResult({
    toolId: "playbooks",
    toolLabel: "Playbook Builder",
    primaryText: params.playbook,
    recommendation: params.scenario
      ? `Playbook for: ${params.scenario.slice(0, 160)}`
      : "Use this playbook as a structured visit plan.",
    suggestedWording: params.playbook,
    whyThisFits:
      "Structures preparation, talking points, and action steps so Tuesday behavior is clear.",
    nextMove: "Pick one account, complete the first action step this week, then debrief.",
    // No citations invented for free-form playbooks.
    retention: "ephemeral",
    recoverable: false,
    canSave: true,
    relatedToolIds: ["objection", "weekly-planner"],
  });
}

/** Advanced AI ephemeral/run expose helper input. */
export function assembleFromAdvancedAiExpose(params: {
  toolId: string;
  output: unknown;
  warnings?: string[];
  evidenceCitations?: unknown[];
  coveragePolicy?: AssembleTrustedAiResultInput["coveragePolicy"];
  retention?: TrustedAiRetention;
  recoverable?: boolean;
  clinical?: boolean;
}): TrustedAiResult {
  const output =
    params.output && typeof params.output === "object"
      ? (params.output as Record<string, unknown>)
      : null;

  const primary =
    (typeof output?.summary === "string" && output.summary) ||
    (typeof output?.recommendation === "string" && output.recommendation) ||
    (typeof output?.response === "string" && output.response) ||
    (typeof output?.body === "string" && output.body) ||
    (typeof params.output === "string" ? params.output : "") ||
    JSON.stringify(params.output ?? {}, null, 0).slice(0, 4_000);

  const rawCitations = Array.isArray(params.evidenceCitations)
    ? params.evidenceCitations
    : Array.isArray(output?.citations)
      ? output.citations
      : [];

  const citations: CitationLike[] = rawCitations
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .map((c) => ({
      id: typeof c.id === "string" ? c.id : typeof c.snapshotId === "string" ? c.snapshotId : undefined,
      title:
        typeof c.title === "string"
          ? c.title
          : typeof c.source === "string"
            ? c.source
            : undefined,
      category: typeof c.category === "string" ? c.category : undefined,
      kind: typeof c.kind === "string" ? c.kind : undefined,
      source: typeof c.source === "string" ? c.source : undefined,
      sourceUrl: typeof c.sourceUrl === "string" ? c.sourceUrl : undefined,
      snapshotId: typeof c.snapshotId === "string" ? c.snapshotId : undefined,
      documentId: typeof c.documentId === "string" ? c.documentId : undefined,
    }));

  const clinical = params.clinical === true;
  return assembleTrustedAiResult({
    toolId: params.toolId,
    primaryText: primary,
    recommendation:
      typeof output?.recommendation === "string" ? output.recommendation : undefined,
    suggestedWording:
      typeof output?.suggestedWording === "string"
        ? output.suggestedWording
        : typeof output?.body === "string"
          ? output.body
          : undefined,
    whyThisFits:
      typeof output?.rationale === "string" ? output.rationale : undefined,
    nextMove:
      typeof output?.nextStep === "string"
        ? output.nextStep
        : typeof output?.nextMove === "string"
          ? output.nextMove
          : undefined,
    uncertainty: params.warnings?.length
      ? params.warnings.join(" ")
      : undefined,
    citations,
    coveragePolicy: params.coveragePolicy,
    retention:
      params.retention ??
      (clinical ? "clinical_ephemeral" : "ephemeral"),
    recoverable: params.recoverable ?? false,
    canSave: !clinical,
  });
}

// ── Tenant-scoped in-memory save store (Slice A; durable DB is a later slice) ─

export type SavedTrustedAiResultRecord = {
  id: string;
  organizationId: number;
  memberId: number;
  title: string;
  toolId: string;
  result: TrustedAiResult;
  savedAt: string;
};

const savedByOrg = new Map<number, SavedTrustedAiResultRecord[]>();
const MAX_SAVED_PER_MEMBER = 40;

function newId(): string {
  return `tar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function saveTrustedAiResult(params: {
  organizationId: number;
  memberId: number;
  title: string;
  result: TrustedAiResult;
}): SavedTrustedAiResultRecord {
  const { organizationId, memberId } = params;
  if (!organizationId || organizationId < 1) {
    const err = new Error("organizationId is required") as Error & {
      code?: string;
      status?: number;
    };
    err.code = "INVALID_TENANT";
    err.status = 400;
    throw err;
  }
  if (params.result.retention === "clinical_ephemeral") {
    const err = new Error(
      "Clinical ephemeral results cannot be saved to member history.",
    ) as Error & { code?: string; status?: number };
    err.code = "CLINICAL_SAVE_FORBIDDEN";
    err.status = 403;
    throw err;
  }
  if (!params.result.actions.canSave) {
    const err = new Error("This result is not eligible to save.") as Error & {
      code?: string;
      status?: number;
    };
    err.code = "SAVE_NOT_ALLOWED";
    err.status = 403;
    throw err;
  }

  const title = params.title.trim().slice(0, 200) || params.result.toolLabel || params.result.toolId;
  const record: SavedTrustedAiResultRecord = {
    id: newId(),
    organizationId,
    memberId,
    title,
    toolId: params.result.toolId,
    result: {
      ...params.result,
      retention: "member_saved",
      recoverable: true,
      actions: { ...params.result.actions, canSave: true },
    },
    savedAt: new Date().toISOString(),
  };

  const list = savedByOrg.get(organizationId) ?? [];
  const withNew = [record, ...list];
  // Evict oldest for this member only when over cap.
  const memberItems = withNew.filter((r) => r.memberId === memberId);
  let pruned = withNew;
  if (memberItems.length > MAX_SAVED_PER_MEMBER) {
    const keepIds = new Set(
      memberItems
        .slice()
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
        .slice(0, MAX_SAVED_PER_MEMBER)
        .map((r) => r.id),
    );
    pruned = withNew.filter(
      (r) => r.memberId !== memberId || keepIds.has(r.id),
    );
  }
  savedByOrg.set(organizationId, pruned);
  return record;
}

export function listSavedTrustedAiResults(params: {
  organizationId: number;
  memberId: number;
  toolId?: string;
}): SavedTrustedAiResultRecord[] {
  const list = savedByOrg.get(params.organizationId) ?? [];
  return list.filter(
    (r) =>
      r.memberId === params.memberId &&
      (!params.toolId || r.toolId === params.toolId),
  );
}

export function deleteSavedTrustedAiResult(params: {
  organizationId: number;
  memberId: number;
  id: string;
}): boolean {
  const list = savedByOrg.get(params.organizationId) ?? [];
  const next = list.filter(
    (r) =>
      !(
        r.id === params.id &&
        r.memberId === params.memberId &&
        r.organizationId === params.organizationId
      ),
  );
  if (next.length === list.length) return false;
  savedByOrg.set(params.organizationId, next);
  return true;
}

/** Test/helper: clear all in-memory saves. */
export function clearTrustedAiResultStoreForTests(): void {
  savedByOrg.clear();
}
