/**
 * Three-layer knowledge architecture (HSP-15 Slice A).
 *
 * Layer 1 — Core (Hospice Sales Pro): Spartan methodology + approved
 *           authoritative hospice knowledge (shared, not tenant-owned).
 * Layer 2 — Provider: org-approved services, policies, capabilities,
 *           terminology, claims, resources, processes. TENANT-ISOLATED.
 * Layer 3 — User context: permitted territory, account, interaction, goals.
 *           Context only — never overrides clinical/ethical core claims.
 *
 * Precedence: core authoritative > provider policy/ops > provider marketing
 * claims > user context. Conflicts are recorded and resolved deterministically.
 */

import {
  SPARTAN_CORPUS,
  searchSpartanKnowledge,
  type KnowledgeChunk,
} from "./spartanCorpus";

export const THREE_LAYER_KNOWLEDGE_VERSION = "three-layer-knowledge-v1";

export type KnowledgeLayerId = "core" | "provider" | "user_context";

export type ProviderKnowledgeKind =
  | "service"
  | "policy"
  | "capability"
  | "terminology"
  | "claim"
  | "resource"
  | "process";

export type ProviderKnowledgeDoc = {
  id: string;
  /** Integer product organization id — required for isolation. */
  organizationId: number;
  title: string;
  kind: ProviderKnowledgeKind;
  body: string;
  tags: string[];
  /** Marketing claims yield to core on conflict; policy/process may annotate. */
  claimStrength?: "marketing" | "operational" | "policy";
};

export type UserContextFacts = {
  territoryHint?: string;
  accountName?: string;
  accountType?: string;
  relationshipStage?: string;
  currentObjective?: string;
  lastInteractionSummary?: string;
  nextAction?: string;
  goals?: string[];
};

export type LayeredKnowledgeHit = {
  id: string;
  title: string;
  body: string;
  layer: KnowledgeLayerId;
  /** Human-visible source layer for AI citations / UI. */
  layerLabel: string;
  categoryOrKind: string;
  score: number;
  /** Present only for provider hits; always matches requesting org. */
  organizationId: number | null;
  /** Lower rank = higher authority when composing prompts. */
  precedenceRank: number;
  tags: string[];
};

export type KnowledgeConflict = {
  coreHitId: string;
  providerHitId: string;
  resolution:
    | "prefer_core"
    | "prefer_provider_operational_annotation"
    | "flag_only";
  reason: string;
  /** Guidance text for the model / product. */
  guidance: string;
};

export type ThreeLayerRetrieveInput = {
  query: string;
  /** Authenticated organization — required for any provider layer access. */
  organizationId: number;
  userContext?: UserContextFacts | null;
  /** Optional provider docs for this org (from store or DB). */
  providerDocs?: ProviderKnowledgeDoc[];
  maxCore?: number;
  maxProvider?: number;
  includeUserContext?: boolean;
};

export type ThreeLayerRetrieveResult = {
  version: string;
  query: string;
  organizationId: number;
  hits: LayeredKnowledgeHit[];
  conflicts: KnowledgeConflict[];
  layersPresent: KnowledgeLayerId[];
  /** Ordered prompt blocks with layer labels. */
  promptBlocks: Array<{
    layer: KnowledgeLayerId;
    layerLabel: string;
    text: string;
  }>;
  compositionNotes: string[];
};

const LAYER_LABELS: Record<KnowledgeLayerId, string> = {
  core: "Hospice Sales Pro Core",
  provider: "Provider Knowledge",
  user_context: "User Context",
};

/** In-memory provider registry (org → docs). Not a parallel CRM; swap for DB later. */
const providerRegistry = new Map<number, ProviderKnowledgeDoc[]>();

export function clearProviderKnowledgeRegistry(): void {
  providerRegistry.clear();
}

export function setProviderKnowledgeForOrg(
  organizationId: number,
  docs: ProviderKnowledgeDoc[],
): void {
  if (!Number.isInteger(organizationId) || organizationId < 1) {
    throw new Error("organizationId must be a positive integer");
  }
  const safe = docs
    .filter((d) => d.organizationId === organizationId)
    .map((d) => sanitizeProviderDoc(d, organizationId));
  providerRegistry.set(organizationId, safe);
}

export function getProviderKnowledgeForOrg(
  organizationId: number,
): ProviderKnowledgeDoc[] {
  if (!Number.isInteger(organizationId) || organizationId < 1) return [];
  return [...(providerRegistry.get(organizationId) ?? [])];
}

/**
 * Tenant isolation hard gate: never return another org's docs even if
 * caller passes a mixed list.
 */
export function filterProviderDocsForOrg(
  docs: ProviderKnowledgeDoc[] | undefined,
  organizationId: number,
): ProviderKnowledgeDoc[] {
  if (!docs?.length) return getProviderKnowledgeForOrg(organizationId);
  return docs
    .filter((d) => d.organizationId === organizationId)
    .map((d) => sanitizeProviderDoc(d, organizationId));
}

function sanitizeProviderDoc(
  doc: ProviderKnowledgeDoc,
  organizationId: number,
): ProviderKnowledgeDoc {
  return {
    id: String(doc.id).slice(0, 80),
    organizationId,
    title: String(doc.title).trim().slice(0, 200),
    kind: doc.kind,
    body: String(doc.body).trim().slice(0, 4000),
    tags: (doc.tags ?? [])
      .filter((t) => typeof t === "string")
      .map((t) => t.slice(0, 40))
      .slice(0, 20),
    claimStrength: doc.claimStrength,
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreText(
  title: string,
  body: string,
  tags: string[],
  queryTokens: string[],
): number {
  if (queryTokens.length === 0) return 0;
  const hay = tokenize(`${title} ${body} ${tags.join(" ")}`);
  const set = new Set(hay);
  let score = 0;
  for (const t of queryTokens) {
    if (set.has(t)) score += 2;
    if (tags.some((tag) => tag.includes(t) || t.includes(tag))) score += 1.5;
    if (title.toLowerCase().includes(t)) score += 1;
  }
  return score;
}

function corePrecedenceRank(category: KnowledgeChunk["category"]): number {
  if (category === "ethics" || category === "eligibility") return 0;
  if (category === "method") return 1;
  return 2;
}

function providerPrecedenceRank(doc: ProviderKnowledgeDoc): number {
  if (doc.kind === "policy" || doc.claimStrength === "policy") return 3;
  if (doc.kind === "process" || doc.kind === "service" || doc.kind === "capability")
    return 4;
  if (doc.kind === "resource" || doc.kind === "terminology") return 5;
  // marketing claims lowest among knowledge (still above user context)
  return 6;
}

function userContextHit(facts: UserContextFacts): LayeredKnowledgeHit | null {
  const lines: string[] = [];
  if (facts.territoryHint) lines.push(`territory: ${facts.territoryHint}`);
  if (facts.accountName) lines.push(`account: ${facts.accountName}`);
  if (facts.accountType) lines.push(`accountType: ${facts.accountType}`);
  if (facts.relationshipStage)
    lines.push(`relationshipStage: ${facts.relationshipStage}`);
  if (facts.currentObjective)
    lines.push(`currentObjective: ${facts.currentObjective}`);
  if (facts.lastInteractionSummary)
    lines.push(`lastInteraction: ${facts.lastInteractionSummary}`);
  if (facts.nextAction) lines.push(`nextAction: ${facts.nextAction}`);
  if (facts.goals?.length) lines.push(`goals: ${facts.goals.join("; ")}`);
  if (!lines.length) return null;
  return {
    id: "user-context",
    title: "Permitted user / territory context",
    body: lines.join("\n").slice(0, 2000),
    layer: "user_context",
    layerLabel: LAYER_LABELS.user_context,
    categoryOrKind: "context",
    score: 1,
    organizationId: null,
    precedenceRank: 10,
    tags: ["user_context"],
  };
}

/**
 * Detect provider vs core conflicts (deterministic heuristics).
 * Clinical/ethics core always wins over marketing claims.
 */
export function detectKnowledgeConflicts(
  coreHits: LayeredKnowledgeHit[],
  providerHits: LayeredKnowledgeHit[],
  providerDocs: ProviderKnowledgeDoc[],
): KnowledgeConflict[] {
  const conflicts: KnowledgeConflict[] = [];
  const docById = new Map(providerDocs.map((d) => [d.id, d]));

  for (const core of coreHits) {
    if (
      core.categoryOrKind !== "ethics" &&
      core.categoryOrKind !== "eligibility"
    ) {
      continue;
    }
    const coreTokens = new Set(tokenize(core.body + " " + core.title));
    for (const prov of providerHits) {
      const doc = docById.get(prov.id);
      if (!doc) continue;
      const isMarketing =
        doc.kind === "claim" || doc.claimStrength === "marketing";
      const provTokens = tokenize(prov.body + " " + prov.title);
      const overlap = provTokens.filter((t) => coreTokens.has(t)).length;
      // Shared topical tokens + marketing claim against ethics/eligibility → conflict
      if (overlap < 3) continue;

      if (isMarketing) {
        conflicts.push({
          coreHitId: core.id,
          providerHitId: prov.id,
          resolution: "prefer_core",
          reason:
            "Provider marketing claim overlaps authoritative core ethics/eligibility guidance",
          guidance:
            "Prefer Hospice Sales Pro Core for clinical and ethical claims. Do not let provider marketing override eligibility, PHI, or ethics guidance. Provider text may describe local services only.",
        });
      } else if (doc.kind === "policy" || doc.claimStrength === "policy") {
        conflicts.push({
          coreHitId: core.id,
          providerHitId: prov.id,
          resolution: "prefer_provider_operational_annotation",
          reason:
            "Provider policy overlaps core topic — annotate, do not replace core",
          guidance:
            "Keep Core as the ethical/clinical baseline. Surface provider policy as organization-specific process that must remain consistent with Core.",
        });
      } else {
        conflicts.push({
          coreHitId: core.id,
          providerHitId: prov.id,
          resolution: "flag_only",
          reason: "Topical overlap between core and provider knowledge",
          guidance:
            "Cite both layers; if claims diverge, Core controls eligibility and ethics; Provider controls local services and process.",
        });
      }
    }
  }
  return conflicts;
}

/**
 * Retrieve three knowledge layers with tenant isolation and conflict rules.
 */
export function retrieveThreeLayerKnowledge(
  input: ThreeLayerRetrieveInput,
): ThreeLayerRetrieveResult {
  const query = input.query.trim();
  const organizationId = input.organizationId;
  if (!Number.isInteger(organizationId) || organizationId < 1) {
    throw Object.assign(new Error("Valid organizationId is required"), {
      code: "INVALID_ORGANIZATION",
      status: 400,
    });
  }

  const maxCore = Math.min(Math.max(input.maxCore ?? 4, 0), 10);
  const maxProvider = Math.min(Math.max(input.maxProvider ?? 4, 0), 10);
  const tokens = tokenize(query);

  // Layer 1 — Core (shared)
  const coreRaw =
    query.length >= 2
      ? searchSpartanKnowledge(query, maxCore)
      : SPARTAN_CORPUS.slice(0, 0);
  const coreHits: LayeredKnowledgeHit[] = coreRaw.map((c) => ({
    id: c.id,
    title: c.title,
    body: c.body,
    layer: "core" as const,
    layerLabel: LAYER_LABELS.core,
    categoryOrKind: c.category,
    score: "score" in c && typeof c.score === "number" ? c.score : 0,
    organizationId: null,
    precedenceRank: corePrecedenceRank(c.category),
    tags: c.tags,
  }));

  // Layer 2 — Provider (org-scoped only)
  const providerDocs = filterProviderDocsForOrg(
    input.providerDocs,
    organizationId,
  );
  // Defense in depth: drop any doc that somehow has wrong org id
  const isolated = providerDocs.filter(
    (d) => d.organizationId === organizationId,
  );
  const providerScored = isolated
    .map((d) => ({
      doc: d,
      score: scoreText(d.title, d.body, d.tags, tokens),
    }))
    .filter((x) => x.score > 0 || query.length < 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxProvider);

  const providerHits: LayeredKnowledgeHit[] = providerScored.map(
    ({ doc, score }) => ({
      id: doc.id,
      title: doc.title,
      body: doc.body,
      layer: "provider" as const,
      layerLabel: LAYER_LABELS.provider,
      categoryOrKind: doc.kind,
      score,
      organizationId: organizationId,
      precedenceRank: providerPrecedenceRank(doc),
      tags: doc.tags,
    }),
  );

  // Layer 3 — User context
  const userHit =
    input.includeUserContext === false
      ? null
      : input.userContext
        ? userContextHit(input.userContext)
        : null;

  const conflicts = detectKnowledgeConflicts(
    coreHits,
    providerHits,
    isolated,
  );

  const hits = [
    ...coreHits,
    ...providerHits,
    ...(userHit ? [userHit] : []),
  ].sort((a, b) => {
    if (a.precedenceRank !== b.precedenceRank)
      return a.precedenceRank - b.precedenceRank;
    return b.score - a.score;
  });

  const layersPresent = Array.from(
    new Set(hits.map((h) => h.layer)),
  ) as KnowledgeLayerId[];

  const compositionNotes: string[] = [
    "Compose prompts by layer: Core first (authoritative), then Provider (org-only), then User Context (situational).",
    "Never apply provider knowledge from another organization.",
    "User context is not an authority on eligibility, ethics, or clinical claims.",
  ];
  if (conflicts.length) {
    compositionNotes.push(
      `${conflicts.length} conflict(s) detected — see conflicts[].guidance`,
    );
  }
  if (!providerHits.length) {
    compositionNotes.push(
      "No provider knowledge matched for this organization/query.",
    );
  }

  const promptBlocks = buildPromptBlocks(hits, conflicts);

  return {
    version: THREE_LAYER_KNOWLEDGE_VERSION,
    query,
    organizationId,
    hits,
    conflicts,
    layersPresent,
    promptBlocks,
    compositionNotes,
  };
}

function buildPromptBlocks(
  hits: LayeredKnowledgeHit[],
  conflicts: KnowledgeConflict[],
): ThreeLayerRetrieveResult["promptBlocks"] {
  const byLayer: Record<KnowledgeLayerId, LayeredKnowledgeHit[]> = {
    core: [],
    provider: [],
    user_context: [],
  };
  for (const h of hits) byLayer[h.layer].push(h);

  const blocks: ThreeLayerRetrieveResult["promptBlocks"] = [];
  const order: KnowledgeLayerId[] = ["core", "provider", "user_context"];
  for (const layer of order) {
    const layerHits = byLayer[layer];
    if (!layerHits.length) continue;
    const lines = layerHits.map(
      (h, i) =>
        `[${LAYER_LABELS[layer]} #${i + 1} | id=${h.id} | ${h.categoryOrKind}]\n${h.body}`,
    );
    if (layer === "core" && conflicts.some((c) => c.resolution === "prefer_core")) {
      lines.push(
        "[conflict_rule] Prefer this Core layer over provider marketing when eligibility or ethics conflict.",
      );
    }
    if (layer === "provider") {
      lines.unshift(
        "[tenant_scope] Provider knowledge is for the authenticated organization only. Do not generalize as universal hospice policy.",
      );
    }
    if (layer === "user_context") {
      lines.unshift(
        "[context_only] User context is situational. It does not override Core or Provider policy.",
      );
    }
    blocks.push({
      layer,
      layerLabel: LAYER_LABELS[layer],
      text: lines.join("\n\n"),
    });
  }
  return blocks;
}

/** Citation shape for AI result payloads (source layer always visible). */
export function citationsFromThreeLayer(
  result: ThreeLayerRetrieveResult,
): Array<{
  id: string;
  title: string;
  layer: KnowledgeLayerId;
  layerLabel: string;
  categoryOrKind: string;
  organizationId: number | null;
}> {
  return result.hits
    .filter((h) => h.layer !== "user_context")
    .map((h) => ({
      id: h.id,
      title: h.title,
      layer: h.layer,
      layerLabel: h.layerLabel,
      categoryOrKind: h.categoryOrKind,
      organizationId: h.organizationId,
    }));
}
