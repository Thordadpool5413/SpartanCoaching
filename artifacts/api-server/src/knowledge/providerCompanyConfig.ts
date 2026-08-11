/**
 * Provider-specific company configuration (HSP-17 Slice A).
 *
 * Structured, versioned org knowledge for services, coverage, claims,
 * terminology, processes, brand voice, and resources. Tenant-isolated.
 * Syncs into three-layer provider registry for AI retrieval with
 * explicit "PROVIDER-SOURCED" labels.
 *
 * In-memory store (same pattern as HSP-15/16). Swap for Postgres later.
 */

import {
  setProviderKnowledgeForOrg,
  type ProviderKnowledgeDoc,
  type ProviderKnowledgeKind,
} from "./threeLayerKnowledge";

export const PROVIDER_COMPANY_CONFIG_VERSION = "provider-company-config-v1";

export const PROVIDER_SOURCE_LABEL = "PROVIDER-SOURCED";
export const PROVIDER_SOURCE_LAYER_LABEL = "Provider Knowledge (your organization)";

/** Structured company profile maintained by org admins. */
export type ProviderCompanyConfig = {
  organizationId: number;
  version: number;
  updatedAt: string;
  updatedByMemberId: number | null;
  /** Human-readable hospice / agency name. */
  organizationDisplayName: string | null;
  serviceAreas: string[];
  branches: string[];
  programs: string[];
  coverageNotes: string[];
  afterHoursCapabilities: string[];
  admissionResponseStandards: string[];
  approvedDifferentiators: string[];
  approvedClaims: string[];
  prohibitedClaims: string[];
  preferredTerminology: Array<{ term: string; preferred: string; notes?: string }>;
  escalationContacts: Array<{
    role: string;
    name?: string;
    channel?: string;
    notes?: string;
  }>;
  referralProcesses: string[];
  payerNotes: string[];
  brandVoice: string | null;
  approvedScripts: Array<{ id: string; title: string; body: string }>;
  companyResources: Array<{ label: string; url?: string; description?: string }>;
};

export type ProviderCompanyConfigPatch = Partial<
  Omit<ProviderCompanyConfig, "organizationId" | "version" | "updatedAt" | "updatedByMemberId">
>;

export type ProviderAiContextPackage = {
  organizationId: number;
  configVersion: number;
  sourceLabel: typeof PROVIDER_SOURCE_LABEL;
  layerLabel: typeof PROVIDER_SOURCE_LAYER_LABEL;
  /** Sections with explicit provider labeling for prompts / UI. */
  sections: Array<{
    key: string;
    title: string;
    items: string[];
    sourceLabel: typeof PROVIDER_SOURCE_LABEL;
  }>;
  /** Flat prompt block for AI tools. */
  promptBlock: string;
  /** Document ids synced into three-layer provider registry. */
  providerDocumentIds: string[];
  disclaimer: string;
};

type StoredConfig = {
  current: ProviderCompanyConfig;
  history: ProviderCompanyConfig[];
};

const store = new Map<number, StoredConfig>();

export function clearProviderCompanyConfigStore(): void {
  store.clear();
}

function emptyConfig(organizationId: number, nowIso: string): ProviderCompanyConfig {
  return {
    organizationId,
    version: 0,
    updatedAt: nowIso,
    updatedByMemberId: null,
    organizationDisplayName: null,
    serviceAreas: [],
    branches: [],
    programs: [],
    coverageNotes: [],
    afterHoursCapabilities: [],
    admissionResponseStandards: [],
    approvedDifferentiators: [],
    approvedClaims: [],
    prohibitedClaims: [],
    preferredTerminology: [],
    escalationContacts: [],
    referralProcesses: [],
    payerNotes: [],
    brandVoice: null,
    approvedScripts: [],
    companyResources: [],
  };
}

function clampStr(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  if (!t) return null;
  return t.slice(0, max);
}

function clampStringArray(raw: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function sanitizeCompanyConfigPatch(
  patch: ProviderCompanyConfigPatch,
): ProviderCompanyConfigPatch {
  const out: ProviderCompanyConfigPatch = {};
  if (patch.organizationDisplayName !== undefined) {
    out.organizationDisplayName = clampStr(patch.organizationDisplayName, 200);
  }
  const listFields: Array<keyof ProviderCompanyConfigPatch> = [
    "serviceAreas",
    "branches",
    "programs",
    "coverageNotes",
    "afterHoursCapabilities",
    "admissionResponseStandards",
    "approvedDifferentiators",
    "approvedClaims",
    "prohibitedClaims",
    "referralProcesses",
    "payerNotes",
  ];
  for (const key of listFields) {
    if (patch[key] !== undefined) {
      (out as Record<string, unknown>)[key] = clampStringArray(patch[key], 40, 500);
    }
  }
  if (patch.preferredTerminology !== undefined) {
    out.preferredTerminology = (Array.isArray(patch.preferredTerminology)
      ? patch.preferredTerminology
      : []
    )
      .slice(0, 40)
      .map((row) => ({
        term: clampStr(row?.term, 80) ?? "",
        preferred: clampStr(row?.preferred, 120) ?? "",
        notes: clampStr(row?.notes, 300) ?? undefined,
      }))
      .filter((r) => r.term && r.preferred);
  }
  if (patch.escalationContacts !== undefined) {
    out.escalationContacts = (Array.isArray(patch.escalationContacts)
      ? patch.escalationContacts
      : []
    )
      .slice(0, 20)
      .map((c) => ({
        role: clampStr(c?.role, 80) ?? "contact",
        name: clampStr(c?.name, 120) ?? undefined,
        channel: clampStr(c?.channel, 200) ?? undefined,
        notes: clampStr(c?.notes, 300) ?? undefined,
      }))
      .filter((c) => c.role);
  }
  if (patch.brandVoice !== undefined) {
    out.brandVoice = clampStr(patch.brandVoice, 2000);
  }
  if (patch.approvedScripts !== undefined) {
    out.approvedScripts = (Array.isArray(patch.approvedScripts)
      ? patch.approvedScripts
      : []
    )
      .slice(0, 25)
      .map((s, i) => ({
        id: clampStr(s?.id, 80) ?? `script-${i + 1}`,
        title: clampStr(s?.title, 200) ?? "Script",
        body: clampStr(s?.body, 4000) ?? "",
      }))
      .filter((s) => s.body);
  }
  if (patch.companyResources !== undefined) {
    out.companyResources = (Array.isArray(patch.companyResources)
      ? patch.companyResources
      : []
    )
      .slice(0, 30)
      .map((r) => ({
        label: clampStr(r?.label, 200) ?? "Resource",
        url: clampStr(r?.url, 500) ?? undefined,
        description: clampStr(r?.description, 500) ?? undefined,
      }))
      .filter((r) => r.label);
  }
  return out;
}

/**
 * Get current company config for an org (never leaks other orgs).
 */
export function getProviderCompanyConfig(
  organizationId: number,
): ProviderCompanyConfig | null {
  if (!Number.isInteger(organizationId) || organizationId < 1) return null;
  const entry = store.get(organizationId);
  return entry ? { ...entry.current, preferredTerminology: [...entry.current.preferredTerminology], approvedScripts: [...entry.current.approvedScripts], companyResources: [...entry.current.companyResources], escalationContacts: [...entry.current.escalationContacts] } : null;
}

export function listProviderCompanyConfigVersions(
  organizationId: number,
): Array<{ version: number; updatedAt: string; updatedByMemberId: number | null }> {
  const entry = store.get(organizationId);
  if (!entry) return [];
  return [...entry.history, entry.current]
    .map((c) => ({
      version: c.version,
      updatedAt: c.updatedAt,
      updatedByMemberId: c.updatedByMemberId,
    }))
    .sort((a, b) => b.version - a.version);
}

/**
 * Upsert company config for organization only. Creates a new version snapshot.
 * Syncs flattened docs into three-layer provider registry.
 */
export function upsertProviderCompanyConfig(
  organizationId: number,
  patch: ProviderCompanyConfigPatch,
  opts?: { memberId?: number | null; nowIso?: string },
): ProviderCompanyConfig {
  if (!Number.isInteger(organizationId) || organizationId < 1) {
    throw Object.assign(new Error("Valid organizationId is required"), {
      code: "INVALID_ORGANIZATION",
      status: 400,
    });
  }
  const nowIso = opts?.nowIso ?? new Date().toISOString();
  const clean = sanitizeCompanyConfigPatch(patch);
  const existing = store.get(organizationId);
  const base = existing?.current ?? emptyConfig(organizationId, nowIso);
  const next: ProviderCompanyConfig = {
    ...base,
    ...clean,
    organizationId, // never accept client override
    version: base.version + 1,
    updatedAt: nowIso,
    updatedByMemberId: opts?.memberId ?? null,
  };

  const history = existing
    ? [...existing.history, existing.current].slice(-49)
    : [];
  store.set(organizationId, { current: next, history });

  // Keep three-layer provider registry in sync for this org only.
  setProviderKnowledgeForOrg(organizationId, companyConfigToProviderDocs(next));

  return next;
}

/**
 * Flatten structured company config into provider knowledge documents.
 */
export function companyConfigToProviderDocs(
  config: ProviderCompanyConfig,
): ProviderKnowledgeDoc[] {
  const org = config.organizationId;
  const docs: ProviderKnowledgeDoc[] = [];
  const push = (
    id: string,
    kind: ProviderKnowledgeKind,
    title: string,
    body: string,
    claimStrength?: ProviderKnowledgeDoc["claimStrength"],
    tags: string[] = [],
  ) => {
    if (!body.trim()) return;
    docs.push({
      id: `org-${org}-${id}`,
      organizationId: org,
      title,
      kind,
      body: body.slice(0, 4000),
      tags: ["company_config", ...tags].slice(0, 20),
      claimStrength,
    });
  };

  if (config.organizationDisplayName) {
    push(
      "identity",
      "service",
      "Organization identity",
      `Display name: ${config.organizationDisplayName}`,
      "operational",
      ["identity"],
    );
  }
  if (config.serviceAreas.length) {
    push(
      "service-areas",
      "service",
      "Service areas",
      config.serviceAreas.map((s) => `• ${s}`).join("\n"),
      "operational",
      ["service_areas"],
    );
  }
  if (config.branches.length) {
    push(
      "branches",
      "service",
      "Branches",
      config.branches.map((s) => `• ${s}`).join("\n"),
      "operational",
      ["branches"],
    );
  }
  if (config.programs.length) {
    push(
      "programs",
      "capability",
      "Programs",
      config.programs.map((s) => `• ${s}`).join("\n"),
      "operational",
      ["programs"],
    );
  }
  if (config.coverageNotes.length) {
    push(
      "coverage",
      "policy",
      "Coverage notes",
      config.coverageNotes.map((s) => `• ${s}`).join("\n"),
      "policy",
      ["coverage"],
    );
  }
  if (config.afterHoursCapabilities.length) {
    push(
      "after-hours",
      "capability",
      "After-hours capabilities",
      config.afterHoursCapabilities.map((s) => `• ${s}`).join("\n"),
      "operational",
      ["after_hours"],
    );
  }
  if (config.admissionResponseStandards.length) {
    push(
      "admission-response",
      "process",
      "Admission response standards",
      config.admissionResponseStandards.map((s) => `• ${s}`).join("\n"),
      "policy",
      ["admission"],
    );
  }
  if (config.approvedDifferentiators.length) {
    push(
      "differentiators",
      "claim",
      "Approved differentiators",
      config.approvedDifferentiators.map((s) => `• ${s}`).join("\n"),
      "operational",
      ["differentiators"],
    );
  }
  if (config.approvedClaims.length) {
    push(
      "approved-claims",
      "claim",
      "Approved claims",
      config.approvedClaims.map((s) => `• ${s}`).join("\n"),
      "marketing",
      ["claims", "approved"],
    );
  }
  if (config.prohibitedClaims.length) {
    push(
      "prohibited-claims",
      "policy",
      "Prohibited claims",
      `Do NOT use the following claims:\n${config.prohibitedClaims.map((s) => `• ${s}`).join("\n")}`,
      "policy",
      ["claims", "prohibited"],
    );
  }
  if (config.preferredTerminology.length) {
    push(
      "terminology",
      "terminology",
      "Preferred terminology",
      config.preferredTerminology
        .map(
          (t) =>
            `• Prefer "${t.preferred}" over "${t.term}"${t.notes ? ` (${t.notes})` : ""}`,
        )
        .join("\n"),
      "operational",
      ["terminology"],
    );
  }
  if (config.escalationContacts.length) {
    push(
      "escalation",
      "process",
      "Escalation contacts",
      config.escalationContacts
        .map(
          (c) =>
            `• ${c.role}${c.name ? `: ${c.name}` : ""}${c.channel ? ` via ${c.channel}` : ""}${c.notes ? ` — ${c.notes}` : ""}`,
        )
        .join("\n"),
      "operational",
      ["escalation"],
    );
  }
  if (config.referralProcesses.length) {
    push(
      "referral-process",
      "process",
      "Referral processes",
      config.referralProcesses.map((s) => `• ${s}`).join("\n"),
      "policy",
      ["referral"],
    );
  }
  if (config.payerNotes.length) {
    push(
      "payer-notes",
      "policy",
      "Payer notes",
      config.payerNotes.map((s) => `• ${s}`).join("\n"),
      "policy",
      ["payer"],
    );
  }
  if (config.brandVoice) {
    push(
      "brand-voice",
      "terminology",
      "Brand voice",
      config.brandVoice,
      "operational",
      ["brand"],
    );
  }
  for (const script of config.approvedScripts) {
    push(
      `script-${script.id}`,
      "resource",
      `Approved script: ${script.title}`,
      script.body,
      "operational",
      ["script"],
    );
  }
  if (config.companyResources.length) {
    push(
      "resources",
      "resource",
      "Company resources",
      config.companyResources
        .map(
          (r) =>
            `• ${r.label}${r.url ? ` — ${r.url}` : ""}${r.description ? `: ${r.description}` : ""}`,
        )
        .join("\n"),
      "operational",
      ["resources"],
    );
  }
  return docs;
}

/**
 * Build AI-ready package with explicit provider labels for authorized members only.
 * Caller must pass authenticated organizationId from session.
 */
export function buildProviderAiContext(
  organizationId: number,
): ProviderAiContextPackage | null {
  const config = getProviderCompanyConfig(organizationId);
  if (!config || config.version < 1) return null;

  const sections: ProviderAiContextPackage["sections"] = [];
  const add = (key: string, title: string, items: string[]) => {
    if (!items.length) return;
    sections.push({
      key,
      title,
      items,
      sourceLabel: PROVIDER_SOURCE_LABEL,
    });
  };

  if (config.organizationDisplayName) {
    add("identity", "Organization", [config.organizationDisplayName]);
  }
  add("serviceAreas", "Service areas", config.serviceAreas);
  add("branches", "Branches", config.branches);
  add("programs", "Programs", config.programs);
  add("coverage", "Coverage", config.coverageNotes);
  add("afterHours", "After-hours capabilities", config.afterHoursCapabilities);
  add(
    "admissionResponse",
    "Admission response standards",
    config.admissionResponseStandards,
  );
  add("differentiators", "Approved differentiators", config.approvedDifferentiators);
  add("approvedClaims", "Approved claims", config.approvedClaims);
  add("prohibitedClaims", "Prohibited claims (never use)", config.prohibitedClaims);
  add(
    "terminology",
    "Preferred terminology",
    config.preferredTerminology.map(
      (t) => `Prefer "${t.preferred}" instead of "${t.term}"`,
    ),
  );
  add(
    "escalation",
    "Escalation contacts",
    config.escalationContacts.map(
      (c) =>
        `${c.role}${c.name ? ` — ${c.name}` : ""}${c.channel ? ` (${c.channel})` : ""}`,
    ),
  );
  add("referralProcesses", "Referral processes", config.referralProcesses);
  add("payerNotes", "Payer notes", config.payerNotes);
  if (config.brandVoice) add("brandVoice", "Brand voice", [config.brandVoice]);
  add(
    "scripts",
    "Approved scripts",
    config.approvedScripts.map((s) => `${s.title}: ${s.body}`),
  );
  add(
    "resources",
    "Company resources",
    config.companyResources.map(
      (r) => `${r.label}${r.url ? ` (${r.url})` : ""}`,
    ),
  );

  const promptLines = [
    `[${PROVIDER_SOURCE_LABEL}] ${PROVIDER_SOURCE_LAYER_LABEL}`,
    `organizationId=${organizationId} configVersion=${config.version}`,
    "Use only for members of this organization. Do not present as universal hospice policy.",
    "When citing these facts to the user, label them as organization-specific / provider-sourced.",
    "",
  ];
  for (const section of sections) {
    promptLines.push(`## [${PROVIDER_SOURCE_LABEL}] ${section.title}`);
    for (const item of section.items) {
      promptLines.push(`- ${item}`);
    }
    promptLines.push("");
  }

  return {
    organizationId,
    configVersion: config.version,
    sourceLabel: PROVIDER_SOURCE_LABEL,
    layerLabel: PROVIDER_SOURCE_LAYER_LABEL,
    sections,
    promptBlock: promptLines.join("\n").trim(),
    providerDocumentIds: companyConfigToProviderDocs(config).map((d) => d.id),
    disclaimer:
      "This guidance is specific to your hospice organization (provider-sourced). It is not general Hospice Sales Pro core methodology.",
  };
}

/**
 * Assert a member may only read their own org's provider package.
 */
export function assertProviderOrgAccess(
  sessionOrganizationId: number,
  requestedOrganizationId?: number | null,
): number {
  if (!Number.isInteger(sessionOrganizationId) || sessionOrganizationId < 1) {
    throw Object.assign(new Error("Valid organization session required"), {
      code: "UNAUTHORIZED",
      status: 401,
    });
  }
  if (
    requestedOrganizationId != null &&
    requestedOrganizationId !== sessionOrganizationId
  ) {
    throw Object.assign(
      new Error("Provider knowledge is not available outside your organization"),
      { code: "FORBIDDEN", status: 403 },
    );
  }
  return sessionOrganizationId;
}
