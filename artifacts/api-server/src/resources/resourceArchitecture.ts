/**
 * Resource content architecture (HSP-25 Slice A).
 *
 * Normalizes legacy download-only rows into a professional product shape
 * without requiring every historical row to be rewritten.
 */

import type { ResourceContentArchitecture } from "@workspace/db";

export const RESOURCE_CONTENT_ARCHITECTURE_VERSION =
  "resource-content-architecture-v1";

export type ResourceRowLike = {
  id?: number;
  title?: string | null;
  description?: string | null;
  fileUrl?: string | null;
  category?: string | null;
  createdAt?: Date | string | null;
  contentArchitecture?: ResourceContentArchitecture | null;
  seriesKey?: string | null;
  versionLabel?: string | null;
  lifecycleStatus?: string | null;
  supersededById?: number | null;
  isCurrent?: boolean | null;
};

export type PublicResource = ResourceRowLike & {
  architecture: ResourceContentArchitecture;
  /** Convenience alias for clients that prefer a nested product model. */
  contentArchitecture: ResourceContentArchitecture;
  /** HSP-27 version / supersession notice for UI and download footers. */
  lifecycle?: {
    versionLabel: string;
    status: string;
    isCurrent: boolean;
    hasNewerVersion: boolean;
    currentVersion: { id: number; versionLabel: string; title: string } | null;
    documentVersionLine: string;
    isSuperseded: boolean;
  };
};

const CATEGORY_PRESENTATION: Record<
  string,
  ResourceContentArchitecture["presentationType"]
> = {
  template: "template",
  script: "script",
  checklist: "checklist",
  guide: "guide",
};

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
  return out.length ? out : undefined;
}

function asNumberArray(v: unknown): number[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x))
    .slice(0, 40);
  return out.length ? out : undefined;
}

function trimStr(v: unknown, max = 2_000): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, max);
  return t || undefined;
}

/**
 * Sanitize partial architecture from admin/API body.
 * Never invents clinical authority or PHI.
 */
export function sanitizeArchitecture(
  input: unknown,
): ResourceContentArchitecture {
  if (!input || typeof input !== "object") {
    return { version: RESOURCE_CONTENT_ARCHITECTURE_VERSION };
  }
  const raw = input as Record<string, unknown>;
  const clinical = raw.clinicalSensitivity;
  const status = raw.status;
  const premium = raw.premiumRule;
  const orgVis = raw.organizationVisibility;
  const presentation = raw.presentationType;

  const out: ResourceContentArchitecture = {
    version: RESOURCE_CONTENT_ARCHITECTURE_VERSION,
    audience: asStringArray(raw.audience),
    role: asStringArray(raw.role),
    experienceLevel: trimStr(raw.experienceLevel, 80),
    jobToAccomplish: trimStr(raw.jobToAccomplish, 500),
    resourceType: trimStr(raw.resourceType, 80),
    topic: asStringArray(raw.topic),
    useCase: trimStr(raw.useCase, 500),
    whenToUse: trimStr(raw.whenToUse, 1_000),
    whyItMatters: trimStr(raw.whyItMatters, 1_000),
    expectedOutcome: trimStr(raw.expectedOutcome, 1_000),
    completionTimeMinutes:
      typeof raw.completionTimeMinutes === "number" &&
      raw.completionTimeMinutes >= 0 &&
      raw.completionTimeMinutes <= 24 * 60
        ? Math.round(raw.completionTimeMinutes)
        : raw.completionTimeMinutes === null
          ? null
          : undefined,
    relatedToolIds: asStringArray(raw.relatedToolIds),
    relatedResourceIds: asNumberArray(raw.relatedResourceIds),
    tags: asStringArray(raw.tags),
    clinicalSensitivity:
      clinical === "none" ||
      clinical === "educational" ||
      clinical === "clinical_adjacent" ||
      clinical === "restricted"
        ? clinical
        : undefined,
    sourceAuthority: trimStr(raw.sourceAuthority, 300),
    author: trimStr(raw.author, 200),
    reviewer: trimStr(raw.reviewer, 200),
    reviewedAt: trimStr(raw.reviewedAt, 64) ?? null,
    publishedAt: trimStr(raw.publishedAt, 64) ?? null,
    contentVersion: trimStr(raw.contentVersion, 40),
    status:
      status === "draft" ||
      status === "published" ||
      status === "archived" ||
      status === "review_required"
        ? status
        : undefined,
    premiumRule:
      premium === "public" ||
      premium === "field_kit" ||
      premium === "premium" ||
      premium === "org_only"
        ? premium
        : undefined,
    organizationVisibility:
      orgVis === "all" || orgVis === "org_only" || orgVis === "hidden"
        ? orgVis
        : undefined,
    presentationType:
      presentation === "download" ||
      presentation === "guide" ||
      presentation === "checklist" ||
      presentation === "script" ||
      presentation === "template" ||
      presentation === "reference"
        ? presentation
        : undefined,
    formats: asStringArray(raw.formats),
    contentOwner: trimStr(raw.contentOwner, 200),
    reviewDueAt: trimStr(raw.reviewDueAt, 64) ?? null,
  };

  // Drop undefined keys for cleaner JSONB
  for (const key of Object.keys(out) as (keyof ResourceContentArchitecture)[]) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

function defaultsFromLegacy(row: ResourceRowLike): ResourceContentArchitecture {
  const category = (row.category || "").toLowerCase().trim();
  const title = (row.title || "").toLowerCase();
  const presentation =
    CATEGORY_PRESENTATION[category] || ("download" as const);

  const tags: string[] = [];
  if (category) tags.push(category);
  if (/object/.test(title)) tags.push("objections");
  if (/territor|week|activity/.test(title)) tags.push("territory");
  if (/onboard|new.?hire/.test(title)) tags.push("onboarding");
  if (/eligib/.test(title)) tags.push("eligibility-education");

  const relatedToolIds: string[] = [];
  if (/object/.test(title)) relatedToolIds.push("objection");
  if (/email|follow/.test(title)) relatedToolIds.push("email-templates");
  if (/role|script|call/.test(title)) relatedToolIds.push("roleplay");
  if (/week|plan|territor/.test(title)) relatedToolIds.push("weekly-planner");

  return {
    version: RESOURCE_CONTENT_ARCHITECTURE_VERSION,
    audience: ["hospice_sales_rep"],
    role: ["rep"],
    experienceLevel: "all",
    jobToAccomplish: row.description?.trim() || undefined,
    resourceType: category || "field_download",
    topic: tags.length ? tags : undefined,
    useCase: category
      ? `Use this ${category} in field preparation and coaching.`
      : "Field preparation and coaching download.",
    whenToUse:
      "Before or after a visit when you need a structured field aid — not during a clinical eligibility determination.",
    whyItMatters:
      "Turns browsing into Tuesday behavior: clearer conversations, better prep, and consistent follow-through.",
    expectedOutcome:
      "A copy-ready field aid you can adapt without inventing clinical claims or entering PHI.",
    completionTimeMinutes: 10,
    relatedToolIds: relatedToolIds.length ? relatedToolIds : undefined,
    relatedResourceIds: undefined,
    tags: tags.length ? tags : undefined,
    clinicalSensitivity: /eligib|lcd|clinical|prognosis/.test(title)
      ? "educational"
      : "none",
    sourceAuthority: "Spartan Coaching / Hospice Sales Pro field library",
    author: "Spartan Coaching",
    reviewer: undefined,
    reviewedAt: null,
    publishedAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : typeof row.createdAt === "string"
          ? row.createdAt
          : null,
    contentVersion: "1",
    status: "published",
    premiumRule: "public",
    organizationVisibility: "all",
    presentationType: presentation,
    formats: row.fileUrl?.toLowerCase().endsWith(".pdf")
      ? ["pdf"]
      : ["file"],
    contentOwner: "Spartan Coaching",
    reviewDueAt: null,
  };
}

function mergeArchitecture(
  base: ResourceContentArchitecture,
  overlay: ResourceContentArchitecture | null | undefined,
): ResourceContentArchitecture {
  if (!overlay) return { ...base, version: RESOURCE_CONTENT_ARCHITECTURE_VERSION };
  const merged: ResourceContentArchitecture = {
    ...base,
    ...sanitizeArchitecture(overlay),
    version: RESOURCE_CONTENT_ARCHITECTURE_VERSION,
  };
  // Prefer explicit overlay empty arrays when provided as arrays
  if (overlay.audience) merged.audience = asStringArray(overlay.audience);
  if (overlay.role) merged.role = asStringArray(overlay.role);
  if (overlay.topic) merged.topic = asStringArray(overlay.topic);
  if (overlay.tags) merged.tags = asStringArray(overlay.tags);
  if (overlay.relatedToolIds)
    merged.relatedToolIds = asStringArray(overlay.relatedToolIds);
  if (overlay.relatedResourceIds)
    merged.relatedResourceIds = asNumberArray(overlay.relatedResourceIds);
  if (overlay.formats) merged.formats = asStringArray(overlay.formats);
  return merged;
}

/**
 * Build the public resource payload. Legacy rows with null architecture
 * receive safe defaults derived from title/category/fileUrl only.
 */
export function presentResource(
  row: ResourceRowLike,
  peers?: ResourceRowLike[],
): PublicResource {
  const architecture = mergeArchitecture(
    defaultsFromLegacy(row),
    row.contentArchitecture,
  );
  // Attach lifecycle version fields into architecture for clients
  architecture.versionLabel =
    row.versionLabel || architecture.versionLabel || architecture.contentVersion || "1.0";
  architecture.contentVersion =
    architecture.contentVersion || architecture.versionLabel;
  {
    const rawStatus =
      row.lifecycleStatus ||
      architecture.lifecycleStatus ||
      (architecture.status === "review_required"
        ? "in_review"
        : architecture.status) ||
      "published";
    const allowed = new Set([
      "draft",
      "in_review",
      "published",
      "archived",
      "retired",
      "superseded",
    ]);
    architecture.lifecycleStatus = allowed.has(String(rawStatus))
      ? (rawStatus as ResourceContentArchitecture["lifecycleStatus"])
      : "published";
  }
  architecture.isCurrent = row.isCurrent ?? architecture.isCurrent ?? true;
  architecture.seriesKey =
    row.seriesKey || architecture.seriesKey || (row.id ? `resource-${row.id}` : undefined);
  if (row.supersededById) {
    architecture.supersededByResourceId = row.supersededById;
  }

  let lifecycle: PublicResource["lifecycle"];
  if (peers && row.id) {
    // Lazy import avoided — compute inline lighter notice
    const seriesKey = architecture.seriesKey || `resource-${row.id}`;
    const current = peers.find(
      (p) =>
        (p.seriesKey || (p.id ? `resource-${p.id}` : "")) === seriesKey &&
        (p.isCurrent !== false) &&
        (p.lifecycleStatus || "published") === "published",
    );
    const thisLabel = architecture.versionLabel || "1.0";
    const hasNewer = Boolean(current && current.id !== row.id);
    lifecycle = {
      versionLabel: thisLabel,
      status: String(architecture.lifecycleStatus || "published"),
      isCurrent: row.isCurrent !== false && !hasNewer,
      hasNewerVersion: hasNewer,
      currentVersion:
        current && current.id
          ? {
              id: current.id,
              versionLabel: current.versionLabel || "1.0",
              title: current.title || "",
            }
          : null,
      isSuperseded:
        (row.lifecycleStatus || "") === "superseded" || hasNewer,
      documentVersionLine: [
        `Version ${thisLabel}`,
        architecture.publishedAt
          ? `Published ${String(architecture.publishedAt).slice(0, 10)}`
          : null,
        architecture.contentOwner
          ? `Owner: ${architecture.contentOwner}`
          : null,
        hasNewer && current
          ? `Newer version available: ${current.versionLabel || "current"} (id ${current.id})`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
    };
  }

  return {
    ...row,
    architecture,
    contentArchitecture: architecture,
    lifecycle,
  };
}

export function presentResources(rows: ResourceRowLike[]): PublicResource[] {
  return rows.map((r) => presentResource(r, rows));
}

/**
 * Prepare insert/update payload: keep required legacy fields; store architecture.
 * Accepts flat architecture fields or nested `architecture` / `contentArchitecture`.
 */
export function prepareResourceWrite(body: Record<string, unknown>): {
  title?: unknown;
  description?: unknown;
  fileUrl?: unknown;
  category?: unknown;
  contentArchitecture: ResourceContentArchitecture;
} {
  const nested =
    body.architecture ?? body.contentArchitecture ?? body.content_architecture;
  const flatBits: ResourceContentArchitecture = sanitizeArchitecture(body);
  const nestedBits = sanitizeArchitecture(nested);
  // Nested wins over flat for the same keys when nested provided
  const contentArchitecture = nested
    ? mergeArchitecture(flatBits, nestedBits)
    : flatBits;

  return {
    title: body.title,
    description: body.description,
    fileUrl: body.fileUrl,
    category: body.category,
    contentArchitecture: {
      ...contentArchitecture,
      version: RESOURCE_CONTENT_ARCHITECTURE_VERSION,
    },
  };
}
