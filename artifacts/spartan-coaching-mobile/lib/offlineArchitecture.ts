/**
 * Offline / weak-network architecture for Hospice Sales Pro iOS.
 *
 * Classifies workflows so UI never pretends AI generation works offline.
 * Device storage is limited to cache, drafts, and allowlisted retry queues
 * (see offlineQueue.ts + toolDraftCache.ts).
 */

export type OfflineCapability =
  /** Full local work without network (view + edit local only). */
  | "offline_capable"
  /** Show last cached server/device data; no new writes without network. */
  | "read_only_cached"
  /** Safe write may be stored and replayed later with idempotency. */
  | "queued_write"
  /** Must have network; block or show clear online-required messaging. */
  | "online_required";

export type OfflineWorkflowId =
  | "classic_field_generate"
  | "tool_draft_and_last_result"
  | "offline_generate_queue"
  | "saved_responses_view"
  | "saved_responses_write"
  | "command_center"
  | "advanced_ai_tools"
  | "clinical_vault"
  | "billing_checkout"
  | "auth_login"
  | "org_admin"
  | "account_profile";

export type OfflineWorkflowSpec = {
  id: OfflineWorkflowId;
  label: string;
  capability: OfflineCapability;
  /** If true, UI may claim generation works without network (must stay false for AI). */
  aiWorksOffline: boolean;
  notes: string;
};

/** Sensitive tool identifiers that must never be persisted in device drafts or retry queues. */
export const OFFLINE_STORAGE_BLOCKED_TOOL_IDS = [
  "admission-eligibility",
  "documentation-gap-analyzer",
  "lcd-policy-sales-playbook",
  "medicare-lcd-advisor",
  "medical-record-lcd-verifier",
  "family-meeting-simulator",
  "transcribe",
  "sales-workflow",
] as const;

/**
 * Authoritative matrix for important native workflows.
 * Product code should consult this (or offlineQueue allowlists) before enqueue/UI copy.
 */
export const OFFLINE_WORKFLOW_MATRIX: readonly OfflineWorkflowSpec[] = [
  {
    id: "classic_field_generate",
    label: "Classic Field AI generate (objection, playbook, email, …)",
    capability: "queued_write",
    aiWorksOffline: false,
    notes:
      "Requires network to run. On transport/5xx, enqueue allowlisted paths only; replay with Idempotency-Key. Never claim offline AI.",
  },
  {
    id: "tool_draft_and_last_result",
    label: "Tool form drafts + last result cache",
    capability: "offline_capable",
    aiWorksOffline: false,
    notes: "Local drafts and last successful text only; clinical tools blocked from device storage.",
  },
  {
    id: "offline_generate_queue",
    label: "Durable generate retry queue",
    capability: "queued_write",
    aiWorksOffline: false,
    notes: "AsyncStorage queue with de-dupe, max attempts, mutex flush, PHI allowlist.",
  },
  {
    id: "saved_responses_view",
    label: "View saved talk tracks / results",
    capability: "read_only_cached",
    aiWorksOffline: false,
    notes: "Show device cache when offline; server is source of truth when online.",
  },
  {
    id: "saved_responses_write",
    label: "Save talk track to account",
    capability: "online_required",
    aiWorksOffline: false,
    notes: "Workspace PUT needs auth + network (or fails closed; local cache optional).",
  },
  {
    id: "command_center",
    label: "Field Planner",
    capability: "online_required",
    aiWorksOffline: false,
    notes: "Never offline-queue; may contain sensitive field notes.",
  },
  {
    id: "advanced_ai_tools",
    label: "Advanced / Spartan AI tools",
    capability: "online_required",
    aiWorksOffline: false,
    notes: "Online only; not in offline generate allowlist.",
  },
  {
    id: "clinical_vault",
    label: "Clinical / vault tools",
    capability: "online_required",
    aiWorksOffline: false,
    notes: "Never device-queue or draft-cache clinical content.",
  },
  {
    id: "billing_checkout",
    label: "Apple subscription purchase and management",
    capability: "online_required",
    aiWorksOffline: false,
    notes: "Requires a secure connection and the installed iPhone app. StoreKit remains the source of truth.",
  },
  {
    id: "auth_login",
    label: "Sign in / session refresh",
    capability: "online_required",
    aiWorksOffline: false,
    notes: "Expired auth stops queue flush until re-login; 401 does not drop queued generates.",
  },
  {
    id: "org_admin",
    label: "Org invites / member admin",
    capability: "online_required",
    aiWorksOffline: false,
    notes: "Server-authoritative; no offline queue.",
  },
  {
    id: "account_profile",
    label: "Account / onboarding profile",
    capability: "online_required",
    aiWorksOffline: false,
    notes: "Profile PATCH requires network; local UI may keep form state in memory only.",
  },
] as const;

export function getOfflineWorkflow(
  id: OfflineWorkflowId,
): OfflineWorkflowSpec | undefined {
  return OFFLINE_WORKFLOW_MATRIX.find((w) => w.id === id);
}

export function isAiGenerationOfflineClaimAllowed(id: OfflineWorkflowId): boolean {
  const w = getOfflineWorkflow(id);
  return Boolean(w?.aiWorksOffline);
}

/** User-facing copy when an online_required flow is attempted offline. */
export function onlineRequiredMessage(id: OfflineWorkflowId): string {
  const w = getOfflineWorkflow(id);
  if (!w) return "This action needs a network connection.";
  if (w.capability === "queued_write") {
    return "AI generation needs a network connection. If it fails after you try, it may be queued and retried when you are back online.";
  }
  if (w.capability === "read_only_cached") {
    return "Showing last saved data on this device. Connect to refresh from your account.";
  }
  if (w.capability === "offline_capable") {
    return "You can keep working on this device. Sync when you are online.";
  }
  return `${w.label} requires a network connection.`;
}

/**
 * Map tool path/id → offline capability for generate actions.
 * Clinical / advanced → online_required; classic Field → queued_write.
 */
export function classifyGenerateAttempt(input: {
  path: string;
  toolId?: string;
  queueIsAllowed: boolean;
}): OfflineCapability {
  if (!input.queueIsAllowed) return "online_required";
  return "queued_write";
}
