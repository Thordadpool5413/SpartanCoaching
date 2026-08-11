/**
 * Explainable personalization engine (HSP-37).
 * Pure functions — no opaque ranking; every recommendation has a `why`.
 */

import {
  emptyPersonalizationPayload,
  type PersonalizationPayload,
  type PersonalizationRecentItem,
} from "@workspace/db";

export const PERSONALIZATION_VERSION = "personalization-v1";

export type ContinueItem = {
  id: string;
  kind: PersonalizationRecentItem["kind"] | "draft" | "workflow";
  title: string;
  href: string;
  why: string;
};

export type RecommendedItem = {
  id: string;
  title: string;
  href: string;
  why: string;
  source: "favorite" | "pinned" | "starter" | "recent" | "draft";
};

export type PersonalizationView = {
  version: typeof PERSONALIZATION_VERSION;
  payload: PersonalizationPayload;
  continueItems: ContinueItem[];
  recommendedToday: RecommendedItem[];
  emptyHistory: boolean;
};

const STARTER_FOR_ROLE: Record<
  string,
  Array<{ id: string; title: string; href: string; why: string }>
> = {
  rep: [
    {
      id: "starter-objections",
      title: "Objection Handler",
      href: "/tools/objections",
      why: "Starter for new reps — practice one live pushback line today.",
    },
    {
      id: "starter-command",
      title: "Command Center",
      href: "/tools/sales-workflow",
      why: "Starter spine — open one account and plan the next visit.",
    },
    {
      id: "starter-weekly",
      title: "Weekly Plan Builder",
      href: "/tools/weekly-plan-builder",
      why: "Starter rhythm — structure Monday–Friday before the week runs you.",
    },
  ],
  director: [
    {
      id: "starter-activity",
      title: "Activity Calculator",
      href: "/tools/activity-calculator",
      why: "Leader starter — turn goals into daily conversation targets.",
    },
    {
      id: "starter-command",
      title: "Command Center",
      href: "/tools/sales-workflow",
      why: "See team day structure from the same spine reps use.",
    },
  ],
  default: [
    {
      id: "starter-portal",
      title: "Portal home",
      href: "/portal",
      why: "New workspace — start from your next action checklist.",
    },
    {
      id: "starter-objections",
      title: "Objection Handler",
      href: "/tools/objections",
      why: "Common first tool — field-ready talk tracks without PHI.",
    },
  ],
};

export function normalizePayload(
  raw: unknown,
): PersonalizationPayload {
  const base = emptyPersonalizationPayload();
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Partial<PersonalizationPayload>;
  return {
    schemaVersion: 1,
    favorites: {
      tools: uniqStrings(p.favorites?.tools ?? [], 40),
      resources: uniqStrings(p.favorites?.resources ?? [], 40),
    },
    pinnedTools: uniqStrings(p.pinnedTools ?? [], 20),
    pinnedResources: uniqStrings(p.pinnedResources ?? [], 20),
    recent: Array.isArray(p.recent)
      ? p.recent
          .filter(
            (r) =>
              r &&
              typeof r === "object" &&
              typeof r.id === "string" &&
              typeof r.title === "string" &&
              typeof r.href === "string",
          )
          .slice(0, 40)
          .map((r) => ({
            kind: (r as PersonalizationRecentItem).kind || "page",
            id: String((r as PersonalizationRecentItem).id).slice(0, 200),
            title: String((r as PersonalizationRecentItem).title).slice(0, 300),
            href: String((r as PersonalizationRecentItem).href).slice(0, 500),
            at: String((r as PersonalizationRecentItem).at || new Date().toISOString()).slice(
              0,
              40,
            ),
          }))
      : [],
    dismissedRecommendationIds: uniqStrings(p.dismissedRecommendationIds ?? [], 50),
  };
}

function uniqStrings(arr: string[], max: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of arr) {
    const s = String(x || "").trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s.slice(0, 120));
    if (out.length >= max) break;
  }
  return out;
}

export function pushRecent(
  payload: PersonalizationPayload,
  item: Omit<PersonalizationRecentItem, "at"> & { at?: string },
): PersonalizationPayload {
  const next = normalizePayload(payload);
  const entry: PersonalizationRecentItem = {
    kind: item.kind,
    id: item.id,
    title: item.title,
    href: item.href,
    at: item.at || new Date().toISOString(),
  };
  next.recent = [entry, ...next.recent.filter((r) => !(r.kind === entry.kind && r.id === entry.id))].slice(
    0,
    30,
  );
  return next;
}

export function toggleList(
  list: string[],
  id: string,
  on: boolean,
  max = 20,
): string[] {
  const cleaned = uniqStrings(list, max);
  if (on) {
    if (cleaned.includes(id)) return cleaned;
    return [id, ...cleaned].slice(0, max);
  }
  return cleaned.filter((x) => x !== id);
}

export type DraftHint = {
  resourceKey: string;
  title: string;
  href: string;
  status: string;
};

/**
 * Build continue + recommended today from prefs + optional draft hints.
 * All `why` strings are human-readable (no opaque scores).
 */
export function buildPersonalizationView(input: {
  payload: PersonalizationPayload;
  jobRole?: string | null;
  drafts?: DraftHint[];
  toolTitleById?: Record<string, string>;
}): PersonalizationView {
  const payload = normalizePayload(input.payload);
  const dismissed = new Set(payload.dismissedRecommendationIds);
  const emptyHistory =
    payload.recent.length === 0 &&
    payload.favorites.tools.length === 0 &&
    payload.pinnedTools.length === 0 &&
    payload.favorites.resources.length === 0 &&
    payload.pinnedResources.length === 0 &&
    !(input.drafts && input.drafts.length > 0);

  const continueItems: ContinueItem[] = [];

  for (const d of input.drafts || []) {
    if (d.status !== "draft") continue;
    continueItems.push({
      id: `draft:${d.resourceKey}`,
      kind: "draft",
      title: d.title || d.resourceKey,
      href: d.href,
      why: "Continue draft — you have unsaved or in-progress resource work.",
    });
  }

  const workflowRecent = payload.recent.find(
    (r) => r.kind === "workflow" || r.id === "sales-workflow" || r.href.includes("sales-workflow"),
  );
  if (workflowRecent) {
    continueItems.push({
      id: `continue-workflow:${workflowRecent.id}`,
      kind: "workflow",
      title: workflowRecent.title,
      href: workflowRecent.href,
      why: "Continue workflow — you opened Command Center recently.",
    });
  }

  for (const r of payload.recent.slice(0, 5)) {
    if (continueItems.some((c) => c.href === r.href)) continue;
    if (r.kind === "tool" || r.kind === "page" || r.kind === "resource") {
      continueItems.push({
        id: `continue-recent:${r.kind}:${r.id}`,
        kind: r.kind,
        title: r.title,
        href: r.href,
        why: "Continue where you left off — recent open on this account.",
      });
    }
    if (continueItems.length >= 6) break;
  }

  const recommendedToday: RecommendedItem[] = [];
  const titles = input.toolTitleById || {};

  for (const id of payload.pinnedTools) {
    if (dismissed.has(`pin-tool:${id}`)) continue;
    recommendedToday.push({
      id: `pin-tool:${id}`,
      title: titles[id] || id,
      href: toolHref(id),
      why: "Pinned by you — always shown in Recommended today.",
      source: "pinned",
    });
  }

  for (const id of payload.favorites.tools) {
    if (dismissed.has(`fav-tool:${id}`)) continue;
    if (recommendedToday.some((r) => r.href === toolHref(id))) continue;
    recommendedToday.push({
      id: `fav-tool:${id}`,
      title: titles[id] || id,
      href: toolHref(id),
      why: "Favorite tool — you marked this for quick access.",
      source: "favorite",
    });
  }

  for (const id of payload.pinnedResources) {
    if (dismissed.has(`pin-res:${id}`)) continue;
    recommendedToday.push({
      id: `pin-res:${id}`,
      title: id,
      href: resourceHref(id),
      why: "Pinned resource — saved for field use.",
      source: "pinned",
    });
  }

  if (emptyHistory) {
    const roleKey =
      input.jobRole && STARTER_FOR_ROLE[input.jobRole]
        ? input.jobRole
        : "default";
    for (const s of STARTER_FOR_ROLE[roleKey] || STARTER_FOR_ROLE.default!) {
      if (dismissed.has(s.id)) continue;
      recommendedToday.push({
        id: s.id,
        title: s.title,
        href: s.href,
        why: s.why,
        source: "starter",
      });
    }
  }

  return {
    version: PERSONALIZATION_VERSION,
    payload,
    continueItems: continueItems.slice(0, 8),
    recommendedToday: recommendedToday.slice(0, 10),
    emptyHistory,
  };
}

function toolHref(toolId: string): string {
  const map: Record<string, string> = {
    objections: "/tools/objections",
    "sales-workflow": "/tools/sales-workflow",
    "weekly-plan": "/tools/weekly-plan-builder",
    "role-play": "/tools/role-play",
    "activity-calculator": "/tools/activity-calculator",
    playbooks: "/tools/playbooks",
    research: "/tools/research",
    "email-templates": "/tools/email-templates",
    "cold-call": "/tools/cold-call-script",
  };
  return map[toolId] || `/tools`;
}

function resourceHref(id: string): string {
  if (id.startsWith("/")) return id;
  return `/resources/${id}`;
}
