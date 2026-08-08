/**
 * Classic Field tool API surface (Stack A) — paths under /api/* used by
 * membership Tools / mobile tabs. Kept here so inventory tests can detect
 * drift without importing the Express monolith.
 *
 * Advanced AI tools live in @workspace/spartan-ai-tools (Stack B).
 * Command Center lives under /api/v1/sales-workflow (Stack C).
 */

export type ClassicFieldToolRoute = {
  /** Catalog tool id when applicable */
  catalogId?: string;
  method: "GET" | "POST";
  path: string;
  /** requireFieldKit (entitled) */
  gated: true;
};

/** Representative classic tool endpoints shared by web + mobile clients. */
export const CLASSIC_FIELD_TOOL_ROUTES: readonly ClassicFieldToolRoute[] = [
  { catalogId: "playbooks", method: "POST", path: "/api/playbooks", gated: true },
  { catalogId: "objections", method: "POST", path: "/api/objections", gated: true },
  { catalogId: "research", method: "POST", path: "/api/research", gated: true },
  { catalogId: "email-templates", method: "POST", path: "/api/email-templates", gated: true },
  { catalogId: "cold-call", method: "POST", path: "/api/cold-call-script", gated: true },
  { catalogId: "weekly-plan", method: "POST", path: "/api/weekly-plan-builder", gated: true },
  { catalogId: "role-play", method: "POST", path: "/api/roleplay/sessions", gated: true },
  { catalogId: "transcribe", method: "POST", path: "/api/transcribe", gated: true },
  // Calculators: activity/ROI/rep-cost are primarily client-side; branch uses API
  { catalogId: "branch", method: "POST", path: "/api/branch-profitability/calculate", gated: true },
] as const;

/** Stack labels for docs and tests */
export const TOOL_STACKS = {
  classic: "A",
  advanced: "B",
  commandCenter: "C",
} as const;
