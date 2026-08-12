/**
 * Universal search ranking engine (HSP-36).
 *
 * Pure functions — route layer loads tenant-scoped documents and permissions.
 * Never put PHI or secrets into title/snippet; sanitize before indexing.
 */

export const UNIVERSAL_SEARCH_VERSION = "universal-search-v1";

export type SearchContentType =
  | "tool"
  | "resource"
  | "article"
  | "podcast"
  | "knowledge"
  | "saved_work"
  | "intent"
  | "provider_resource"
  | "account"
  | "recent";

export type SearchDocument = {
  id: string;
  type: SearchContentType;
  title: string;
  /** Safe public snippet only */
  snippet: string;
  href: string;
  mobileHref?: string;
  tags: string[];
  /** null/undefined = global catalog; set for tenant rows */
  organizationId?: number | null;
  /** Personal saved work */
  memberId?: number | null;
  /** Soft-deleted / archived — excluded by default */
  deleted?: boolean;
  /** Retired lifecycle */
  unavailable?: boolean;
  requiresAuth?: boolean;
  requiresFieldKit?: boolean;
  /** Extra tokens for intent matching */
  keywords?: string[];
};

export type SearchPermissions = {
  authenticated: boolean;
  canUseFieldKit: boolean;
  organizationId?: number;
  memberId?: number;
  role?: string;
};

export type SearchHit = {
  id: string;
  type: SearchContentType;
  title: string;
  snippet: string;
  href: string;
  mobileHref?: string;
  score: number;
  group: string;
};

export type SearchResponse = {
  version: typeof UNIVERSAL_SEARCH_VERSION;
  query: string;
  groups: Array<{
    type: SearchContentType;
    label: string;
    hits: SearchHit[];
  }>;
  total: number;
};

const GROUP_LABEL: Record<SearchContentType, string> = {
  tool: "Tools",
  resource: "Resources",
  article: "Articles",
  podcast: "Podcasts",
  knowledge: "Spartan methodology",
  saved_work: "Saved work",
  intent: "Jobs / intents",
  provider_resource: "Provider library",
  account: "Accounts",
  recent: "Recent",
};

/** Intent synonym boosts — multi-word jobs, not exact title only. */
const INTENT_SYNONYMS: Record<string, string[]> = {
  objection: ["pushback", "not ready", "preferred hospice", "handler", "talk track"],
  plan: ["weekly", "territory", "week", "monday"],
  command: ["workflow", "account", "call", "visit", "command center"],
  activity: ["target", "conversation", "calculator", "goal", "tracking"],
  research: ["facility", "territory", "cms", "intel"],
  email: ["follow up", "template", "outreach"],
  learn: ["article", "podcast", "drill", "method"],
  methodology: ["spartan", "discipline", "empathy", "strategy", "method"],
};

const PHI_PATTERNS: RegExp[] = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN-like
  /\bMRN[:\s#]*[A-Z0-9-]+\b/gi,
  /\bDOB[:\s]*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b(?:patient|resident)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
];

export function sanitizeSearchText(raw: string, maxLen = 160): string {
  let s = String(raw || "")
    .replace(/\s+/g, " ")
    .trim();
  for (const re of PHI_PATTERNS) {
    s = s.replace(re, "[redacted]");
  }
  if (s.length > maxLen) s = s.slice(0, maxLen - 1).trimEnd() + "…";
  return s;
}

export function tokenizeQuery(q: string): string[] {
  return String(q || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function expandTokens(tokens: string[]): Set<string> {
  const out = new Set(tokens);
  for (const t of tokens) {
    for (const [intent, syns] of Object.entries(INTENT_SYNONYMS)) {
      if (t === intent || syns.some((s) => s.includes(t) || t.includes(s.split(" ")[0]!))) {
        out.add(intent);
        for (const s of syns) {
          for (const w of s.split(/\s+/)) {
            if (w.length >= 3) out.add(w);
          }
        }
      }
    }
  }
  return out;
}

export function canSeeDocument(
  doc: SearchDocument,
  perms: SearchPermissions,
): boolean {
  if (doc.deleted || doc.unavailable) return false;

  // Tenant isolation: org-scoped docs only for that org
  if (doc.organizationId != null) {
    if (!perms.authenticated || perms.organizationId !== doc.organizationId) {
      return false;
    }
  }

  // Personal saved work
  if (doc.memberId != null) {
    if (!perms.authenticated || perms.memberId !== doc.memberId) {
      return false;
    }
  }

  if (doc.requiresAuth && !perms.authenticated) return false;
  if (doc.requiresFieldKit && !perms.canUseFieldKit) return false;

  return true;
}

export function scoreDocument(
  doc: SearchDocument,
  tokens: string[],
  expanded: Set<string>,
): number {
  if (!tokens.length) return 0;
  const title = doc.title.toLowerCase();
  const snippet = doc.snippet.toLowerCase();
  const tagBlob = doc.tags.join(" ").toLowerCase();
  const kwBlob = (doc.keywords || []).join(" ").toLowerCase();
  let score = 0;

  for (const t of tokens) {
    if (title === t) score += 40;
    else if (title.startsWith(t)) score += 28;
    else if (title.includes(t)) score += 18;
    if (tagBlob.includes(t)) score += 12;
    if (kwBlob.includes(t)) score += 10;
    if (snippet.includes(t)) score += 6;
  }

  // Intent expansion (secondary relevance)
  for (const t of expanded) {
    if (tokens.includes(t)) continue;
    if (title.includes(t) || tagBlob.includes(t) || kwBlob.includes(t)) {
      score += 4;
    }
  }

  // Prefer multi-type diversity is handled at group level; slight boost for tools on action verbs
  if (doc.type === "tool" && tokens.some((t) => ["handle", "generate", "plan", "run"].includes(t))) {
    score += 3;
  }

  return score;
}

export function runUniversalSearch(
  documents: SearchDocument[],
  query: string,
  perms: SearchPermissions,
  options?: { limit?: number; perGroup?: number },
): SearchResponse {
  const q = String(query || "").trim();
  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 40);
  const perGroup = Math.min(Math.max(options?.perGroup ?? 6, 1), 12);
  const tokens = tokenizeQuery(q);
  const expanded = expandTokens(tokens);

  if (tokens.length === 0) {
    return {
      version: UNIVERSAL_SEARCH_VERSION,
      query: q,
      groups: [],
      total: 0,
    };
  }

  const hits: SearchHit[] = [];
  for (const doc of documents) {
    if (!canSeeDocument(doc, perms)) continue;
    const score = scoreDocument(doc, tokens, expanded);
    if (score <= 0) continue;
    hits.push({
      id: doc.id,
      type: doc.type,
      title: sanitizeSearchText(doc.title, 120),
      snippet: sanitizeSearchText(doc.snippet, 160),
      href: doc.href,
      mobileHref: doc.mobileHref,
      score,
      group: GROUP_LABEL[doc.type],
    });
  }

  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  const byType = new Map<SearchContentType, SearchHit[]>();
  for (const hit of hits) {
    const list = byType.get(hit.type) ?? [];
    if (list.length < perGroup) list.push(hit);
    byType.set(hit.type, list);
  }

  // Group order by best score in group
  const groups = [...byType.entries()]
    .map(([type, typeHits]) => ({
      type,
      label: GROUP_LABEL[type],
      hits: typeHits,
      best: typeHits[0]?.score ?? 0,
    }))
    .sort((a, b) => b.best - a.best)
    .map(({ type, label, hits: h }) => ({ type, label, hits: h }));

  let total = 0;
  const capped: typeof groups = [];
  for (const g of groups) {
    if (total >= limit) break;
    const room = limit - total;
    const slice = g.hits.slice(0, room);
    total += slice.length;
    capped.push({ ...g, hits: slice });
  }

  return {
    version: UNIVERSAL_SEARCH_VERSION,
    query: q,
    groups: capped,
    total,
  };
}

/** Build catalog tool documents from field-kit-style tool records. */
export function documentsFromTools(
  tools: Array<{
    id: string;
    title: string;
    description: string;
    path: string;
    whenToUse?: string;
    category?: string;
    mobileToolTab?: string;
  }>,
): SearchDocument[] {
  return tools.map((t) => ({
    id: `tool:${t.id}`,
    type: "tool" as const,
    title: t.title,
    snippet: sanitizeSearchText(t.description || t.whenToUse || "", 160),
    href: t.path,
    mobileHref: t.mobileToolTab ? `/tool/${t.mobileToolTab}` : undefined,
    tags: [t.category || "tool", t.id, "tool"].filter(Boolean) as string[],
    keywords: [t.whenToUse || "", t.id.replace(/-/g, " ")],
    requiresFieldKit: true,
    requiresAuth: true,
  }));
}

export function documentsFromIntents(
  intents: Array<{
    id: string;
    title: string;
    description: string;
    destinations?: Array<{ webPath?: string; kind?: string }>;
  }>,
): SearchDocument[] {
  return intents.map((i) => {
    const first = i.destinations?.find((d) => d.webPath)?.webPath || "/tools";
    return {
      id: `intent:${i.id}`,
      type: "intent" as const,
      title: i.title,
      snippet: sanitizeSearchText(i.description, 160),
      href: first,
      tags: ["intent", i.id],
      keywords: [i.id.replace(/_/g, " "), i.title],
      requiresAuth: true,
    };
  });
}
