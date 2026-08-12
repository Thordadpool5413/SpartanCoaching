/**
 * Product outcome analytics contract (HSP-42).
 * Shared web + iOS names, privacy rules, and metric definitions.
 *
 * Rules:
 * - Prefer PRODUCT_OUTCOME event names for activation / retention.
 * - Never put free-text user input (objections, notes, PHI, emails) in metadata.
 * - Authenticated identity is always server-derived (session), never client-asserted.
 */

/** Canonical product outcome names — use as eventName with eventType PRODUCT_EVENT_TYPE. */
export const PRODUCT_OUTCOMES = [
  "first_account",
  "first_command_center_workflow",
  "workflow_completion",
  "next_action_confirmation",
  "tool_completion",
  "result_save",
  "resource_completion",
  "cross_device_continuation",
  "organization_invite_acceptance",
  "subscription_start",
  "evaluation_conversion",
  "cancellation",
  "return_usage",
] as const;

export type ProductOutcome = (typeof PRODUCT_OUTCOMES)[number];

export const PRODUCT_EVENT_TYPE = "product_outcome" as const;

/** Safe metadata keys only — short tokens, not prose. */
export const SAFE_METADATA_KEYS = [
  "toolId",
  "resourceId",
  "surface",
  "platform",
  "source",
  "stepId",
  "outcome",
  "plan",
  "role",
] as const;

export type SafeMetadataKey = (typeof SAFE_METADATA_KEYS)[number];

export type SafeProductMetadata = Partial<Record<SafeMetadataKey, string>>;

const SAFE_KEY_SET = new Set<string>(SAFE_METADATA_KEYS);
const PRODUCT_OUTCOME_SET = new Set<string>(PRODUCT_OUTCOMES);

/** Max length for a single metadata value (token-like). */
export const SAFE_METADATA_VALUE_MAX = 64;

/** Dedupe window for idempotent product outcomes (ms). */
export const PRODUCT_EVENT_DEDUPE_MS = 5 * 60 * 1000;

const IDEMPOTENT_OUTCOMES = new Set<ProductOutcome>([
  "first_account",
  "first_command_center_workflow",
  "subscription_start",
  "evaluation_conversion",
  "cancellation",
  "organization_invite_acceptance",
]);

export function isProductOutcome(name: string): name is ProductOutcome {
  return PRODUCT_OUTCOME_SET.has(name);
}

export function isIdempotentOutcome(name: string): boolean {
  return isProductOutcome(name) && IDEMPOTENT_OUTCOMES.has(name);
}

/**
 * Strip free text and non-allowlisted keys.
 * Accepts object, JSON string, or legacy free-text string (returns null for prose).
 */
export function sanitizeAnalyticsMetadata(
  input: unknown,
): string | null {
  if (input == null || input === "") return null;

  let obj: Record<string, unknown> | null = null;

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;
    // Short token labels (legacy) → { source }
    if (
      trimmed.length <= SAFE_METADATA_VALUE_MAX &&
      !/\s/.test(trimmed) &&
      /^[a-zA-Z0-9_.:-]+$/.test(trimmed) &&
      !trimmed.startsWith("{")
    ) {
      return JSON.stringify({ source: trimmed });
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        obj = parsed as Record<string, unknown>;
      } else {
        return null;
      }
    } catch {
      // Free-text prose is never stored.
      return null;
    }
  } else if (typeof input === "object" && !Array.isArray(input)) {
    obj = input as Record<string, unknown>;
  } else {
    return null;
  }

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!SAFE_KEY_SET.has(k)) continue;
    if (v == null) continue;
    const s = String(v).trim();
    if (!s || s.length > SAFE_METADATA_VALUE_MAX) continue;
    // Reject free-text / email / multi-word phrases
    if (/\s/.test(s) || s.includes("@") || /[<>]/.test(s)) continue;
    if (!/^[a-zA-Z0-9_.:-]+$/.test(s)) continue;
    out[k] = s;
  }

  return Object.keys(out).length ? JSON.stringify(out) : null;
}

export function productEventPayload(
  outcome: ProductOutcome,
  metadata?: SafeProductMetadata | null,
): { eventType: typeof PRODUCT_EVENT_TYPE; eventName: ProductOutcome; metadata: string | null } {
  return {
    eventType: PRODUCT_EVENT_TYPE,
    eventName: outcome,
    metadata: sanitizeAnalyticsMetadata(metadata ?? null),
  };
}

/** Client dedupe key — never includes free text. */
export function productEventDedupeKey(
  eventType: string,
  eventName: string,
  metadata: string | null,
  memberHint?: string | number | null,
): string {
  return [memberHint ?? "anon", eventType, eventName, metadata ?? ""].join("|");
}

/**
 * Metric definitions for reporting (derived from product_outcome event names).
 * Implementations query event_tracking; these are the contracts only.
 */
export const PRODUCT_METRICS = {
  activation: {
    id: "activation",
    description:
      "Member completed first meaningful product action: first_account plus first_command_center_workflow or tool_completion within 7 days of account.",
    eventNames: [
      "first_account",
      "first_command_center_workflow",
      "tool_completion",
    ] as const,
  },
  engagement: {
    id: "engagement",
    description:
      "Ongoing use: tool_completion, workflow_completion, next_action_confirmation, result_save, resource_completion in a rolling 7-day window.",
    eventNames: [
      "tool_completion",
      "workflow_completion",
      "next_action_confirmation",
      "result_save",
      "resource_completion",
    ] as const,
  },
  retention: {
    id: "retention",
    description:
      "return_usage or any engagement event on day N after first_account (classic D1/D7/D30).",
    eventNames: ["return_usage", "tool_completion", "workflow_completion"] as const,
  },
  organizationAdoption: {
    id: "organization_adoption",
    description:
      "organization_invite_acceptance plus seat-level engagement among company members.",
    eventNames: ["organization_invite_acceptance", "tool_completion"] as const,
  },
  featureValue: {
    id: "feature_value",
    description:
      "Per toolId/resourceId: tool_completion, result_save, resource_completion counts (safe ids only).",
    eventNames: ["tool_completion", "result_save", "resource_completion"] as const,
  },
  monetization: {
    id: "monetization",
    description: "subscription_start, evaluation_conversion, cancellation.",
    eventNames: ["subscription_start", "evaluation_conversion", "cancellation"] as const,
  },
} as const;

export type ProductMetricId = keyof typeof PRODUCT_METRICS;
