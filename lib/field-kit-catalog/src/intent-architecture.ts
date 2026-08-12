/**
 * Intent-first discovery architecture (HSP-29).
 *
 * Primary navigation is what the rep is trying to do — not internal stack names.
 * Secondary categories (Prepare, Practice, Plan, Measure) remain as a fallback lens.
 *
 * Surface placement (deliberate):
 * - **Tools** = interactive work
 * - **Field resources** = work aids (templates/scripts) — peer surface, not Learn-only
 * - **Learn** = articles, podcasts, fundamentals
 * Same names/meaning on web and iOS; layouts stay platform-native.
 */

import type { FieldKitCategory, FieldKitTool } from "./index";

export const DISCOVERY_IA_VERSION = "discovery-ia-v1";

export type ProductSurface = "tools" | "field_resources" | "learn" | "command";

export type DiscoveryDestinationKind =
  | "tool"
  | "resource"
  | "learn"
  | "command";

export type DiscoveryDestination = {
  kind: DiscoveryDestinationKind;
  id: string;
  label: string;
  webPath: string;
  mobilePath?: string;
  surface: ProductSurface;
};

export type DiscoveryIntentId =
  | "prepare_visit"
  | "handle_objection"
  | "follow_up"
  | "plan_week"
  | "open_account"
  | "develop_account"
  | "coach_rep"
  | "run_numbers"
  | "improve_territory"
  | "learn_fundamentals";

export type DiscoveryIntent = {
  id: DiscoveryIntentId;
  title: string;
  description: string;
  secondaryCategory?: FieldKitCategory;
  destinations: DiscoveryDestination[];
};

/** Intent destination stubs — tool ids resolved against catalog in buildDiscoveryIntents. */
export type IntentDestinationSpec =
  | { kind: "tool" | "command"; toolId: string; label?: string }
  | {
      kind: "resource" | "learn";
      id: string;
      label: string;
      webPath: string;
      surface: ProductSurface;
    };

export type DiscoveryIntentSpec = {
  id: DiscoveryIntentId;
  title: string;
  description: string;
  secondaryCategory?: FieldKitCategory;
  destinations: IntentDestinationSpec[];
};

export const PRODUCT_SURFACE_PLACEMENT = {
  tools: {
    id: "tools" as const,
    label: "Tools",
    meaning: "Interactive work: Command Center, practice, plans, calculators.",
    webPath: "/tools",
    mobileTab: "tools",
  },
  field_resources: {
    id: "field_resources" as const,
    label: "Field resources",
    meaning:
      "Templates, scripts, checklists, and provider library — work aids, not only study material.",
    webPath: "/resources",
    mobileTab: "learn",
    mobileResourcesTab: "resources",
  },
  learn: {
    id: "learn" as const,
    label: "Learn",
    meaning: "Articles, podcasts, drills, and hospice fundamentals.",
    webPath: "/articles",
    mobileTab: "learn",
  },
  command: {
    id: "command" as const,
    label: "Command Center",
    meaning: "Daily account workflow spine.",
    webPath: "/tools/sales-workflow",
    mobileTab: "command",
  },
} as const;

/**
 * Primary professional entry points — intent language first.
 */
export const DISCOVERY_INTENT_SPECS: DiscoveryIntentSpec[] = [
  {
    id: "prepare_visit",
    title: "Prepare for a visit",
    description: "Walk in with a plan, talk track, and clear ask.",
    secondaryCategory: "Prepare",
    destinations: [
      { kind: "command", toolId: "sales-workflow", label: "Open account in Command Center" },
      { kind: "tool", toolId: "playbooks" },
      { kind: "tool", toolId: "research" },
      {
        kind: "resource",
        id: "territory-template",
        label: "Territory template",
        webPath: "/resources/territory-template",
        surface: "field_resources",
      },
    ],
  },
  {
    id: "handle_objection",
    title: "Handle an objection",
    description: "Turn pushback into education without pressure.",
    secondaryCategory: "Practice",
    destinations: [
      { kind: "tool", toolId: "objections" },
      { kind: "tool", toolId: "role-play" },
      {
        kind: "resource",
        id: "objection-cards",
        label: "Objection cards",
        webPath: "/resources/objection-cards",
        surface: "field_resources",
      },
    ],
  },
  {
    id: "follow_up",
    title: "Follow up",
    description: "Keep the thread warm after the visit.",
    secondaryCategory: "Outreach",
    destinations: [
      { kind: "tool", toolId: "email-templates" },
      { kind: "tool", toolId: "cold-call" },
      { kind: "command", toolId: "sales-workflow", label: "Log outcome & next step" },
    ],
  },
  {
    id: "plan_week",
    title: "Plan my week",
    description: "Structure the week before Monday pressure hits.",
    secondaryCategory: "Plan",
    destinations: [
      { kind: "tool", toolId: "weekly-plan" },
      {
        kind: "resource",
        id: "weekly-plan-template",
        label: "Weekly plan template",
        webPath: "/resources/weekly-plan",
        surface: "field_resources",
      },
      {
        kind: "resource",
        id: "activity-tracker",
        label: "Activity tracker",
        webPath: "/resources/activity-tracker",
        surface: "field_resources",
      },
    ],
  },
  {
    id: "open_account",
    title: "Open an account",
    description: "Start a new relationship in the Command Center spine.",
    secondaryCategory: "Plan",
    destinations: [
      { kind: "command", toolId: "sales-workflow", label: "Sales Command Center" },
      { kind: "tool", toolId: "cold-call" },
      {
        kind: "resource",
        id: "quick-start",
        label: "Quick start guide",
        webPath: "/resources/quick-start-guide",
        surface: "field_resources",
      },
    ],
  },
  {
    id: "develop_account",
    title: "Develop an account",
    description: "Deepen the relationship and move referrals.",
    secondaryCategory: "Prepare",
    destinations: [
      { kind: "command", toolId: "sales-workflow", label: "Continue account workflow" },
      { kind: "tool", toolId: "playbooks" },
      { kind: "tool", toolId: "research" },
    ],
  },
  {
    id: "coach_rep",
    title: "Coach a rep",
    description: "Leader tools for scorecards, cost, and field behavior.",
    secondaryCategory: "Measure",
    destinations: [
      { kind: "tool", toolId: "activity-calculator" },
      { kind: "tool", toolId: "rep-cost" },
      { kind: "tool", toolId: "roi" },
      { kind: "tool", toolId: "role-play" },
    ],
  },
  {
    id: "run_numbers",
    title: "Run the numbers",
    description: "Economics, activity math, and branch health.",
    secondaryCategory: "Measure",
    destinations: [
      { kind: "tool", toolId: "activity-calculator" },
      { kind: "tool", toolId: "roi" },
      { kind: "tool", toolId: "rep-cost" },
      { kind: "tool", toolId: "branch" },
      {
        kind: "resource",
        id: "metrics-dashboard",
        label: "Metrics dashboard",
        webPath: "/resources/metrics-dashboard",
        surface: "field_resources",
      },
    ],
  },
  {
    id: "improve_territory",
    title: "Improve a territory",
    description: "Research, prioritization, and route discipline.",
    secondaryCategory: "Prepare",
    destinations: [
      { kind: "tool", toolId: "research" },
      { kind: "tool", toolId: "weekly-plan" },
      {
        kind: "resource",
        id: "territory-template",
        label: "Territory planning template",
        webPath: "/resources/territory-template",
        surface: "field_resources",
      },
    ],
  },
  {
    id: "learn_fundamentals",
    title: "Learn hospice fundamentals",
    description: "Articles, method, drills — study between visits.",
    secondaryCategory: "Learn",
    destinations: [
      {
        kind: "learn",
        id: "articles",
        label: "Articles",
        webPath: "/articles",
        surface: "learn",
      },
      {
        kind: "learn",
        id: "method",
        label: "The Spartan Method",
        webPath: "/method",
        surface: "learn",
      },
      {
        kind: "learn",
        id: "drills",
        label: "Daily drills",
        webPath: "/drills",
        surface: "learn",
      },
      {
        kind: "learn",
        id: "knowledge",
        label: "Knowledge base",
        webPath: "/learn/knowledge-base",
        surface: "learn",
      },
      {
        kind: "learn",
        id: "podcasts",
        label: "Podcasts",
        webPath: "/podcasts",
        surface: "learn",
      },
    ],
  },
];

export function buildDiscoveryIntents(
  getTool: (id: string) => FieldKitTool | undefined,
): DiscoveryIntent[] {
  return DISCOVERY_INTENT_SPECS.map((spec) => ({
    id: spec.id,
    title: spec.title,
    description: spec.description,
    secondaryCategory: spec.secondaryCategory,
    destinations: spec.destinations
      .map((d): DiscoveryDestination | null => {
        if (d.kind === "tool" || d.kind === "command") {
          const t = getTool(d.toolId);
          if (!t) return null;
          return {
            kind: d.kind,
            id: t.id,
            label: d.label || t.title,
            webPath: t.path,
            mobilePath: t.mobileRoute || t.path,
            surface: d.kind === "command" ? "command" : "tools",
          };
        }
        if (d.kind === "resource" || d.kind === "learn") {
          return {
            kind: d.kind,
            id: d.id,
            label: d.label,
            webPath: d.webPath,
            mobilePath: d.webPath,
            surface: d.surface,
          };
        }
        return null;
      })
      .filter((x): x is DiscoveryDestination => x !== null),
  }));
}

export function secondaryCategoriesStillSupported(): FieldKitCategory[] {
  return ["Prepare", "Practice", "Plan", "Measure", "Outreach"];
}

export function filterIntentsByQuery(
  intents: DiscoveryIntent[],
  q: string,
): DiscoveryIntent[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return intents;
  return intents.filter((intent) => {
    if (
      intent.title.toLowerCase().includes(needle) ||
      intent.description.toLowerCase().includes(needle)
    ) {
      return true;
    }
    return intent.destinations.some(
      (d) =>
        d.label.toLowerCase().includes(needle) ||
        d.id.toLowerCase().includes(needle),
    );
  });
}

export function assertIntentToolReferences(
  getTool: (id: string) => FieldKitTool | undefined,
): string[] {
  const missing: string[] = [];
  for (const spec of DISCOVERY_INTENT_SPECS) {
    for (const d of spec.destinations) {
      if (d.kind === "tool" || d.kind === "command") {
        if (!getTool(d.toolId)) missing.push(`${spec.id}:${d.toolId}`);
      }
    }
  }
  return missing;
}
