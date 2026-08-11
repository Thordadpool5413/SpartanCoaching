/**
 * Data-driven related tools / resources / workflow recommendations (HSP-31).
 *
 * Single relationship graph for web + iOS — do not hard-code different link
 * lists per platform. Rank with optional context tags; filter clutter,
 * unavailable destinations, and entitlement-sensitive tools.
 */

import type { FieldKitTool, MobileDelivery } from "./index";

export const RELATED_RECS_VERSION = "related-recs-v1";

export type RelatedSourceKind = "tool" | "workflow" | "resource";

export type RelatedDestinationKind = "tool" | "resource" | "command" | "learn";

export type RelatedEdge = {
  /** Source tool id, workflow key, or resource id */
  fromId: string;
  fromKind: RelatedSourceKind;
  toKind: RelatedDestinationKind;
  /** Catalog tool id, resource slug, or command id */
  toId: string;
  label: string;
  webPath: string;
  /** Explicit mobile path when not derived from tool catalog */
  mobilePath?: string;
  /** Base score 1–100 */
  weight: number;
  /** Match against RecommendContext.contextTags for ranking boosts */
  tags: string[];
  /** Short product reason (not marketing cross-sell) */
  reason: string;
  /** Hide when user lacks Field Kit / HSP access */
  requiresFieldKit?: boolean;
};

export type RecommendContext = {
  platform: "web" | "ios";
  canUseFieldKit?: boolean;
  /** e.g. ["objection", "territory", "tracking", "prepare", "follow_up"] */
  contextTags?: string[];
  /** Max items after rank/filter (default 4 — avoid clutter) */
  limit?: number;
  /** Never recommend these destination ids (includes current tool) */
  excludeIds?: string[];
  /** Content retired / not published / permission denied */
  unavailableIds?: string[];
};

export type RelatedRecommendation = {
  id: string;
  kind: RelatedDestinationKind;
  label: string;
  /** Platform-resolved href */
  href: string;
  /** UI kind chip */
  kindLabel: string;
  score: number;
  reason: string;
  available: boolean;
  unavailableReason?: string;
};

/**
 * Shared edges. Prefer job continuity over cross-promotion.
 * Command Center uses fromId "sales-workflow" (tool + workflow spine).
 */
export const RELATED_EDGES: RelatedEdge[] = [
  // —— Objection work → objection resources + practice ——
  {
    fromId: "objections",
    fromKind: "tool",
    toKind: "resource",
    toId: "objection-cards",
    label: "Objection cards",
    webPath: "/resources/objection-cards",
    mobilePath: "/(tabs)/learn",
    weight: 95,
    tags: ["objection", "practice", "visit"],
    reason: "Field cards for the same pushback lines.",
  },
  {
    fromId: "objections",
    fromKind: "tool",
    toKind: "tool",
    toId: "role-play",
    label: "Role-play",
    webPath: "/tools/role-play",
    weight: 88,
    tags: ["objection", "practice"],
    reason: "Practice the talk track before the visit.",
    requiresFieldKit: true,
  },
  {
    fromId: "objections",
    fromKind: "tool",
    toKind: "tool",
    toId: "playbooks",
    label: "Playbooks",
    webPath: "/tools/playbooks",
    weight: 72,
    tags: ["prepare", "visit"],
    reason: "Build the visit plan that surfaces the objection.",
    requiresFieldKit: true,
  },
  {
    fromId: "objections",
    fromKind: "tool",
    toKind: "command",
    toId: "sales-workflow",
    label: "Command Center",
    webPath: "/tools/sales-workflow",
    mobilePath: "/(tabs)/command",
    weight: 65,
    tags: ["follow_up", "account"],
    reason: "Log outcome and schedule the next step.",
    requiresFieldKit: true,
  },

  // —— Weekly planning → territory resources + tracking ——
  {
    fromId: "weekly-plan",
    fromKind: "tool",
    toKind: "resource",
    toId: "territory-template",
    label: "Territory template",
    webPath: "/resources/territory-template",
    mobilePath: "/(tabs)/learn",
    weight: 94,
    tags: ["territory", "plan", "week"],
    reason: "Territory layout to feed the week plan.",
  },
  {
    fromId: "weekly-plan",
    fromKind: "tool",
    toKind: "resource",
    toId: "activity-tracker",
    label: "Activity tracker",
    webPath: "/resources/activity-tracker",
    mobilePath: "/(tabs)/learn",
    weight: 86,
    tags: ["tracking", "week", "territory"],
    reason: "Track weekly activity against the plan.",
  },
  {
    fromId: "weekly-plan",
    fromKind: "tool",
    toKind: "tool",
    toId: "activity-calculator",
    label: "Activity Calculator",
    webPath: "/tools/activity-calculator",
    weight: 80,
    tags: ["tracking", "numbers", "week"],
    reason: "Convert goals into conversation targets.",
    requiresFieldKit: true,
  },
  {
    fromId: "weekly-plan",
    fromKind: "tool",
    toKind: "command",
    toId: "sales-workflow",
    label: "Command Center",
    webPath: "/tools/sales-workflow",
    mobilePath: "/(tabs)/command",
    weight: 70,
    tags: ["account", "week"],
    reason: "Schedule the accounts from the plan.",
    requiresFieldKit: true,
  },

  // —— Activity calculations → tracking tools ——
  {
    fromId: "activity-calculator",
    fromKind: "tool",
    toKind: "tool",
    toId: "weekly-plan",
    label: "Weekly Plan",
    webPath: "/tools/weekly-plan-builder",
    weight: 90,
    tags: ["tracking", "week", "plan"],
    reason: "Turn targets into a Monday–Friday sequence.",
    requiresFieldKit: true,
  },
  {
    fromId: "activity-calculator",
    fromKind: "tool",
    toKind: "resource",
    toId: "activity-tracker",
    label: "Activity tracker",
    webPath: "/resources/activity-tracker",
    mobilePath: "/(tabs)/learn",
    weight: 88,
    tags: ["tracking", "numbers"],
    reason: "Log actual conversations vs target.",
  },
  {
    fromId: "activity-calculator",
    fromKind: "tool",
    toKind: "resource",
    toId: "metrics-dashboard",
    label: "Metrics dashboard",
    webPath: "/resources/metrics-dashboard",
    mobilePath: "/(tabs)/learn",
    weight: 75,
    tags: ["tracking", "numbers", "leader"],
    reason: "See activity trends with leadership.",
  },
  {
    fromId: "activity-calculator",
    fromKind: "tool",
    toKind: "tool",
    toId: "rep-cost",
    label: "Rep Cost",
    webPath: "/tools/rep-cost-calculator",
    weight: 62,
    tags: ["numbers", "leader"],
    reason: "Connect activity math to rep economics.",
    requiresFieldKit: true,
  },

  // —— Command Center → preparation + follow-up ——
  {
    fromId: "sales-workflow",
    fromKind: "tool",
    toKind: "tool",
    toId: "playbooks",
    label: "Playbooks",
    webPath: "/tools/playbooks",
    weight: 92,
    tags: ["prepare", "visit", "account"],
    reason: "Pre-call play before the visit.",
    requiresFieldKit: true,
  },
  {
    fromId: "sales-workflow",
    fromKind: "tool",
    toKind: "tool",
    toId: "research",
    label: "Research",
    webPath: "/tools/research",
    weight: 85,
    tags: ["prepare", "account"],
    reason: "Account intel before you walk in.",
    requiresFieldKit: true,
  },
  {
    fromId: "sales-workflow",
    fromKind: "tool",
    toKind: "tool",
    toId: "objections",
    label: "Objection Handler",
    webPath: "/tools/objections",
    weight: 82,
    tags: ["prepare", "practice", "objection"],
    reason: "Prep talk tracks for expected pushback.",
    requiresFieldKit: true,
  },
  {
    fromId: "sales-workflow",
    fromKind: "tool",
    toKind: "tool",
    toId: "email-templates",
    label: "Email Templates",
    webPath: "/tools/email-templates",
    weight: 78,
    tags: ["follow_up", "outreach"],
    reason: "Follow up after the visit.",
    requiresFieldKit: true,
  },
  {
    fromId: "sales-workflow",
    fromKind: "workflow",
    toKind: "resource",
    toId: "quick-start",
    label: "Quick start guide",
    webPath: "/resources/quick-start-guide",
    mobilePath: "/(tabs)/learn",
    weight: 55,
    tags: ["prepare", "onboarding"],
    reason: "Workflow basics if you are new to Command.",
  },
];

const KIND_LABEL: Record<RelatedDestinationKind, string> = {
  tool: "Tool",
  resource: "Resource",
  command: "Workflow",
  learn: "Learn",
};

function mobileHrefForTool(tool: FieldKitTool | undefined, edge: RelatedEdge): string | null {
  if (edge.mobilePath) return edge.mobilePath;
  if (!tool) return null;
  if (tool.mobileToolTab) return `/tool/${tool.mobileToolTab}`;
  if (tool.mobileRoute) return tool.mobileRoute;
  if (tool.mobile === "webview" && tool.path) return tool.path;
  return null;
}

function resolveHref(
  edge: RelatedEdge,
  platform: "web" | "ios",
  tool: FieldKitTool | undefined,
): { href: string | null; available: boolean; unavailableReason?: string } {
  if (platform === "web") {
    return { href: edge.webPath, available: true };
  }
  // iOS
  if (edge.toKind === "tool" || edge.toKind === "command") {
    if (tool?.mobile === "missing" && !edge.mobilePath) {
      return {
        href: null,
        available: false,
        unavailableReason: "Web only on this device",
      };
    }
    const href = mobileHrefForTool(tool, edge);
    if (!href) {
      return {
        href: null,
        available: false,
        unavailableReason: "No mobile route",
      };
    }
    return { href, available: true };
  }
  // resource / learn
  const href = edge.mobilePath ?? "/(tabs)/learn";
  return { href, available: true };
}

/**
 * Rank and filter related destinations for a source.
 * Does not invent destinations outside RELATED_EDGES.
 */
export function recommendRelated(
  sourceId: string,
  ctx: RecommendContext,
  getToolById: (id: string) => FieldKitTool | undefined = () => undefined,
): RelatedRecommendation[] {
  const limit = ctx.limit ?? 4;
  const exclude = new Set(ctx.excludeIds ?? [sourceId]);
  const unavailable = new Set(ctx.unavailableIds ?? []);
  const tags = (ctx.contextTags ?? []).map((t) => t.toLowerCase());

  const candidates: RelatedRecommendation[] = [];

  for (const edge of RELATED_EDGES) {
    if (edge.fromId !== sourceId) continue;
    if (exclude.has(edge.toId)) continue;

    const tool =
      edge.toKind === "tool" || edge.toKind === "command"
        ? getToolById(edge.toId)
        : undefined;

    // Catalog tool missing entirely
    if ((edge.toKind === "tool" || edge.toKind === "command") && !tool && edge.toId) {
      // command sales-workflow is also a tool in catalog — if missing, skip
      if (edge.toKind === "tool") {
        candidates.push({
          id: edge.toId,
          kind: edge.toKind,
          label: edge.label,
          href: edge.webPath,
          kindLabel: KIND_LABEL[edge.toKind],
          score: 0,
          reason: edge.reason,
          available: false,
          unavailableReason: "Unknown tool",
        });
        continue;
      }
    }

    let available = true;
    let unavailableReason: string | undefined;

    if (unavailable.has(edge.toId)) {
      available = false;
      unavailableReason = "Unavailable content";
    }
    if (edge.requiresFieldKit && ctx.canUseFieldKit === false) {
      available = false;
      unavailableReason = "Requires Hospice Sales Pro access";
    }

    const resolved = resolveHref(edge, ctx.platform, tool);
    if (!resolved.available) {
      available = false;
      unavailableReason = resolved.unavailableReason ?? "Unavailable on this platform";
    }

    let score = edge.weight;
    for (const tag of edge.tags) {
      if (tags.includes(tag.toLowerCase())) score += 12;
    }
    // Prefer native mobile tools slightly when on iOS
    if (ctx.platform === "ios" && tool?.mobile === "native") score += 4;
    if (ctx.platform === "ios" && tool?.mobile === "missing") score -= 20;

    candidates.push({
      id: edge.toId,
      kind: edge.toKind,
      label: edge.label,
      href: resolved.href ?? edge.webPath,
      kindLabel: KIND_LABEL[edge.toKind],
      score,
      reason: edge.reason,
      available,
      unavailableReason,
    });
  }

  // Sort by score desc; available first; then drop unavailable for UI clutter
  candidates.sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1;
    return b.score - a.score;
  });

  return candidates.filter((c) => c.available).slice(0, limit);
}

/**
 * All candidates including unavailable — for tests and gated UI diagnostics.
 */
export function recommendRelatedIncludingUnavailable(
  sourceId: string,
  ctx: RecommendContext,
  getToolById: (id: string) => FieldKitTool | undefined = () => undefined,
): RelatedRecommendation[] {
  const limit = ctx.limit ?? 20;
  const exclude = new Set(ctx.excludeIds ?? [sourceId]);
  const unavailable = new Set(ctx.unavailableIds ?? []);
  const tags = (ctx.contextTags ?? []).map((t) => t.toLowerCase());
  const out: RelatedRecommendation[] = [];

  for (const edge of RELATED_EDGES) {
    if (edge.fromId !== sourceId) continue;
    if (exclude.has(edge.toId)) continue;
    const tool =
      edge.toKind === "tool" || edge.toKind === "command"
        ? getToolById(edge.toId)
        : undefined;
    const resolved = resolveHref(edge, ctx.platform, tool);
    let available = resolved.available && !unavailable.has(edge.toId);
    let unavailableReason = resolved.unavailableReason;
    if (unavailable.has(edge.toId)) {
      available = false;
      unavailableReason = "Unavailable content";
    }
    if (edge.requiresFieldKit && ctx.canUseFieldKit === false) {
      available = false;
      unavailableReason = "Requires Hospice Sales Pro access";
    }
    let score = edge.weight;
    for (const tag of edge.tags) {
      if (tags.includes(tag.toLowerCase())) score += 12;
    }
    out.push({
      id: edge.toId,
      kind: edge.toKind,
      label: edge.label,
      href: resolved.href ?? edge.webPath,
      kindLabel: KIND_LABEL[edge.toKind],
      score,
      reason: edge.reason,
      available,
      unavailableReason,
    });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

/** Map to ToolAnatomyRelated item shape (web + iOS). */
export function relatedToAnatomyItems(
  recs: RelatedRecommendation[],
): { href: string; label: string; kind?: string }[] {
  return recs.map((r) => ({
    href: r.href,
    label: r.label,
    kind: r.kindLabel,
  }));
}

/** Sources that must have at least one available edge (product contract). */
export const REQUIRED_RELATED_SOURCES = [
  "objections",
  "weekly-plan",
  "activity-calculator",
  "sales-workflow",
] as const;

export type RequiredRelatedSource = (typeof REQUIRED_RELATED_SOURCES)[number];

/** For tests: mobile delivery type re-export convenience */
export type { MobileDelivery };
