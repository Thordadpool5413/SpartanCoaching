/**
 * Operational readiness catalog (HSP-45).
 * Recovery objectives, critical assets, incident severities, support workflows.
 * No secrets, no production hostnames, no PHI.
 */

/** Recovery time / recovery point objectives appropriate to Hospice Sales Pro SaaS. */
export const RECOVERY_OBJECTIVES = {
  /** Target max data loss for primary Postgres (logical backup cadence + WAL if available). */
  databaseRpoMinutes: 60,
  /** Target max downtime for membership API after declared major incident. */
  databaseRtoMinutes: 240,
  /** Object storage (PDFs, provider files) — rehydrate from primary + versioned bucket. */
  storageRpoMinutes: 24 * 60,
  storageRtoMinutes: 24 * 60,
  /** Stripe / auth secrets restore from vault — config only. */
  configRtoMinutes: 60,
  /** Customer-facing status update after Sev-1 declared. */
  statusCommMinutes: 30,
} as const;

export type CriticalAsset = {
  id: string;
  category: "database" | "storage" | "config" | "provider_content" | "billing";
  description: string;
  backupMethod: string;
  retention: string;
  restoreProcedure: string;
  owner: "platform_ops" | "api" | "billing";
};

export const CRITICAL_ASSETS: CriticalAsset[] = [
  {
    id: "postgres_primary",
    category: "database",
    description:
      "Primary application Postgres (auth, orgs, billing columns, tools metadata, personalization, notifications).",
    backupMethod:
      "Logical dump via pg_dump (or host managed snapshot). Pre-migration dump required for data_backfill/destructive plans.",
    retention: "Minimum 14 days daily logical dumps; longer if host plan provides PITR.",
    restoreProcedure:
      "Restore into a non-production database first (restore drill). Point app DATABASE_URL only after integrity checks pass. Never restore over production without a freeze window.",
    owner: "platform_ops",
  },
  {
    id: "object_storage",
    category: "storage",
    description: "Uploaded PDFs / object entities used by admin resources and tools.",
    backupMethod: "Cloud object storage versioning / cross-bucket replication when enabled on host.",
    retention: "Align with storage provider lifecycle (default: 30 days noncurrent versions when enabled).",
    restoreProcedure:
      "Re-enable bucket access; restore prior object version or copy from replica bucket. Re-link admin metadata if object keys diverge.",
    owner: "platform_ops",
  },
  {
    id: "provider_resource_libraries",
    category: "provider_content",
    description: "Tenant-scoped provider resource library rows + linked storage objects.",
    backupMethod: "Contained in Postgres logical dump + object storage for blobs.",
    retention: "Same as postgres_primary + object storage.",
    restoreProcedure:
      "Restore tenant rows from dump; restore missing blobs by object key. Verify organization_id isolation post-restore.",
    owner: "api",
  },
  {
    id: "critical_configuration",
    category: "config",
    description:
      "DATABASE_URL, Stripe keys, session secrets, AI keys, BAA flags — stored in host secret manager, not git.",
    backupMethod: "Secret manager export / documented runbook inventory (names only in repo).",
    retention: "Until rotated; keep previous version for one rotation cycle.",
    restoreProcedure:
      "Re-inject secrets from vault; redeploy; run smoke-health and billing webhook health. Rotate any secret that may have leaked in the incident.",
    owner: "platform_ops",
  },
  {
    id: "stripe_billing_state",
    category: "billing",
    description: "Subscription and invoice truth lives in Stripe; local columns are a cache.",
    backupMethod: "Stripe Dashboard + API; local columns restored via webhook replay / subscription sync.",
    retention: "Stripe retention per Stripe plan.",
    restoreProcedure:
      "Do not invent local billing truth. After DB restore, run subscription sync / wait for webhooks; verify /api/admin/stripe-webhook-health.",
    owner: "billing",
  },
];

export type IncidentSeverity = {
  level: "SEV1" | "SEV2" | "SEV3" | "SEV4";
  name: string;
  criteria: string;
  responseMinutes: number;
  customerComms: "required" | "if_customer_impact" | "internal_only";
};

export const INCIDENT_SEVERITIES: IncidentSeverity[] = [
  {
    level: "SEV1",
    name: "Critical outage / data risk",
    criteria:
      "Auth or membership tools fully down for all customers, confirmed data loss, or active security breach involving customer data.",
    responseMinutes: 15,
    customerComms: "required",
  },
  {
    level: "SEV2",
    name: "Major degradation",
    criteria:
      "Large portion of customers cannot complete primary workflows (login, checkout, Command Center, tool generation) or billing webhooks failing broadly.",
    responseMinutes: 60,
    customerComms: "if_customer_impact",
  },
  {
    level: "SEV3",
    name: "Limited impact",
    criteria: "Single feature broken for a subset of users; workaround exists; no data loss.",
    responseMinutes: 4 * 60,
    customerComms: "if_customer_impact",
  },
  {
    level: "SEV4",
    name: "Minor / cosmetic",
    criteria: "Low urgency defect, copy, or non-blocking UX issue.",
    responseMinutes: 2 * 24 * 60,
    customerComms: "internal_only",
  },
];

export type SupportCategory = {
  id: string;
  label: string;
  intake: string;
  slaHours: number;
  escalatesTo: string;
};

export const SUPPORT_CATEGORIES: SupportCategory[] = [
  {
    id: "billing",
    label: "Billing & subscription",
    intake: "Account → Manage billing, or Contact with subject Billing. Never ask for full card numbers in chat.",
    slaHours: 24,
    escalatesTo: "billing + platform_ops (Stripe dashboard, webhook health)",
  },
  {
    id: "account_access",
    label: "Account access",
    intake: "Credential reset / magic link / invite accept. Verify email ownership before changing org membership.",
    slaHours: 8,
    escalatesTo: "platform_ops (session revoke, member status)",
  },
  {
    id: "product_defect",
    label: "Product defect",
    intake: "Repro steps, tool id, approximate time, web vs iOS. No PHI in tickets or screenshots.",
    slaHours: 48,
    escalatesTo: "api/web engineering",
  },
  {
    id: "trust_privacy",
    label: "Trust / privacy / PHI concern",
    intake:
      "Treat as security-sensitive. Capture report without storing alleged PHI. Escalate immediately; do not debate clinical content in public channels.",
    slaHours: 4,
    escalatesTo: "platform_ops security response (SEV1 if breach likely)",
  },
];

/** Short customer-safe status templates (no internal details). */
export const STATUS_TEMPLATES = {
  investigating:
    "We are investigating an issue affecting Hospice Sales Pro access or tools. We will post an update within 30 minutes.",
  identified:
    "We have identified the issue and are applying a fix. Some members may still see errors.",
  monitoring:
    "A fix has been deployed. We are monitoring recovery. Please retry sign-in or the affected tool.",
  resolved:
    "This incident is resolved. If you still see problems, sign out/in or contact support with the time you last saw the issue.",
} as const;

export type InternalResponseStep = {
  order: number;
  phase: "detect" | "triage" | "mitigate" | "communicate" | "recover" | "review";
  action: string;
};

export const INCIDENT_RESPONSE_STEPS: InternalResponseStep[] = [
  { order: 1, phase: "detect", action: "Confirm via /api/healthz, /api/healthz/reliability, Stripe webhook health, and error logs (no PHI/bodies)." },
  { order: 2, phase: "triage", action: "Assign SEV level from INCIDENT_SEVERITIES; name incident commander (platform_ops)." },
  { order: 3, phase: "mitigate", action: "Stop the bleeding: feature flags, rollback deploy, scale, or disable failing integration." },
  { order: 4, phase: "communicate", action: "Post status using STATUS_TEMPLATES; notify known impacted org admins for SEV1/SEV2." },
  { order: 5, phase: "recover", action: "Restore service; if data restore needed, use non-prod restore drill procedure first." },
  { order: 6, phase: "review", action: "Within 5 business days: timeline, root cause, customer impact, action items, backup/drill gaps." },
];

export type OpsReadinessSnapshot = {
  recoveryObjectives: typeof RECOVERY_OBJECTIVES;
  criticalAssets: CriticalAsset[];
  incidentSeverities: IncidentSeverity[];
  supportCategories: SupportCategory[];
  statusTemplates: typeof STATUS_TEMPLATES;
  responseSteps: InternalResponseStep[];
  restoreDrill: {
    command: string;
    requires: string;
    lastResultEnv: string;
    note: string;
  };
};

export function buildOpsReadinessSnapshot(): OpsReadinessSnapshot {
  return {
    recoveryObjectives: RECOVERY_OBJECTIVES,
    criticalAssets: CRITICAL_ASSETS,
    incidentSeverities: INCIDENT_SEVERITIES,
    supportCategories: SUPPORT_CATEGORIES,
    statusTemplates: STATUS_TEMPLATES,
    responseSteps: INCIDENT_RESPONSE_STEPS,
    restoreDrill: {
      command: "pnpm --filter @workspace/db run backup-restore-drill",
      requires: "DATABASE_URL to a non-production database (CI or staging). Never point at production for destructive drills.",
      lastResultEnv: "OPS_LAST_RESTORE_DRILL_ISO (optional host-set after successful drill)",
      note: "Drill writes only ephemeral schema restore_drill_* and drops it. Proves backup snapshot + restore path without assuming host snapshots work.",
    },
  };
}
