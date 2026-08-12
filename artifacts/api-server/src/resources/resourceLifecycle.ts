/**
 * Resource versioning, publishing, and retirement rules (HSP-27 Slice A).
 *
 * Professional content is never silently replaced: file URL changes on a
 * published resource require publish_new_version (new row + supersede old).
 */

export const RESOURCE_LIFECYCLE_VERSION = "resource-lifecycle-v1";

export type LifecycleStatus =
  | "draft"
  | "in_review"
  | "published"
  | "archived"
  | "retired"
  | "superseded";

export type LifecycleAction =
  | "create_draft"
  | "submit_review"
  | "publish"
  | "archive"
  | "retire"
  | "restore_draft"
  | "publish_new_version"
  | "update_metadata";

export type LifecycleResourceSnapshot = {
  id: number;
  title: string;
  fileUrl: string;
  seriesKey: string | null;
  versionLabel: string | null;
  lifecycleStatus: string | null;
  isCurrent: boolean | null;
  supersededById: number | null;
  contentOwner?: string | null;
  reviewer?: string | null;
  publishedAt?: string | null;
  reviewedAt?: string | null;
  reviewDueAt?: string | null;
};

export type TransitionResult =
  | {
      ok: true;
      action: LifecycleAction;
      fromStatus: LifecycleStatus;
      toStatus: LifecycleStatus;
      /** When publish_new_version, create a new resource with these fields. */
      createNewVersion?: {
        seriesKey: string;
        versionLabel: string;
        title: string;
        description?: string | null;
        fileUrl: string;
        category: string;
        lifecycleStatus: "published";
        isCurrent: true;
        supersededById: null;
      };
      /** Patch applied to the source resource row. */
      patchSource: Partial<{
        lifecycleStatus: LifecycleStatus;
        isCurrent: boolean;
        supersededById: number | null;
        seriesKey: string;
        versionLabel: string;
      }>;
      auditNote?: string;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

const ALLOWED: Record<LifecycleStatus, LifecycleAction[]> = {
  draft: ["submit_review", "publish", "archive", "update_metadata"],
  in_review: ["publish", "restore_draft", "archive", "update_metadata"],
  published: [
    "archive",
    "retire",
    "publish_new_version",
    "update_metadata",
  ],
  archived: ["restore_draft", "retire", "publish", "update_metadata"],
  retired: ["restore_draft"],
  superseded: ["update_metadata"],
};

export function normalizeLifecycleStatus(
  raw: string | null | undefined,
): LifecycleStatus {
  const s = (raw || "published").toLowerCase();
  if (
    s === "draft" ||
    s === "in_review" ||
    s === "published" ||
    s === "archived" ||
    s === "retired" ||
    s === "superseded"
  ) {
    return s;
  }
  // Map HSP-25 architecture status
  if (s === "review_required") return "in_review";
  return "published";
}

export function defaultSeriesKey(resourceId: number): string {
  return `resource-${resourceId}`;
}

export function versionBannerLabel(versionLabel: string | null | undefined): string {
  const v = (versionLabel || "1.0").trim() || "1.0";
  return `Version ${v}`;
}

/**
 * Detect silent replace of professional content (file URL change while published).
 */
export function isSilentFileReplace(
  current: LifecycleResourceSnapshot,
  nextFileUrl: string | undefined | null,
): boolean {
  if (nextFileUrl === undefined || nextFileUrl === null) return false;
  const status = normalizeLifecycleStatus(current.lifecycleStatus);
  if (status !== "published" && status !== "in_review") return false;
  return String(nextFileUrl).trim() !== String(current.fileUrl).trim();
}

/**
 * Apply a lifecycle transition. Pure — no DB.
 */
export function planLifecycleTransition(input: {
  resource: LifecycleResourceSnapshot;
  action: LifecycleAction;
  note?: string;
  /** Required for publish_new_version */
  newVersion?: {
    versionLabel: string;
    fileUrl: string;
    title?: string;
    description?: string | null;
    category?: string;
  };
}): TransitionResult {
  const fromStatus = normalizeLifecycleStatus(input.resource.lifecycleStatus);
  const allowed = ALLOWED[fromStatus] || [];
  if (!allowed.includes(input.action)) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: `Cannot ${input.action} from status ${fromStatus}.`,
    };
  }

  const seriesKey =
    input.resource.seriesKey?.trim() || defaultSeriesKey(input.resource.id);

  switch (input.action) {
    case "submit_review":
      return {
        ok: true,
        action: input.action,
        fromStatus,
        toStatus: "in_review",
        patchSource: { lifecycleStatus: "in_review", seriesKey },
        auditNote: input.note,
      };
    case "publish":
      return {
        ok: true,
        action: input.action,
        fromStatus,
        toStatus: "published",
        patchSource: {
          lifecycleStatus: "published",
          isCurrent: true,
          seriesKey,
          versionLabel: input.resource.versionLabel || "1.0",
        },
        auditNote: input.note,
      };
    case "archive":
      return {
        ok: true,
        action: input.action,
        fromStatus,
        toStatus: "archived",
        patchSource: { lifecycleStatus: "archived", seriesKey },
        auditNote: input.note,
      };
    case "retire":
      return {
        ok: true,
        action: input.action,
        fromStatus,
        toStatus: "retired",
        patchSource: {
          lifecycleStatus: "retired",
          isCurrent: false,
          seriesKey,
        },
        auditNote: input.note,
      };
    case "restore_draft":
      return {
        ok: true,
        action: input.action,
        fromStatus,
        toStatus: "draft",
        patchSource: {
          lifecycleStatus: "draft",
          isCurrent: false,
          seriesKey,
        },
        auditNote: input.note,
      };
    case "update_metadata":
      return {
        ok: true,
        action: input.action,
        fromStatus,
        toStatus: fromStatus,
        patchSource: { seriesKey },
        auditNote: input.note || "Metadata update",
      };
    case "publish_new_version": {
      const nv = input.newVersion;
      if (!nv?.fileUrl?.trim() || !nv.versionLabel?.trim()) {
        return {
          ok: false,
          code: "NEW_VERSION_REQUIRED",
          message:
            "publish_new_version requires versionLabel and fileUrl for the new version.",
        };
      }
      if (nv.fileUrl.trim() === input.resource.fileUrl.trim()) {
        return {
          ok: false,
          code: "SAME_FILE_URL",
          message:
            "New version must use a different file URL — professional content is not silently replaced.",
        };
      }
      return {
        ok: true,
        action: input.action,
        fromStatus,
        toStatus: "superseded",
        createNewVersion: {
          seriesKey,
          versionLabel: nv.versionLabel.trim().slice(0, 32),
          title: (nv.title || input.resource.title).trim(),
          description: nv.description,
          fileUrl: nv.fileUrl.trim(),
          category: nv.category || "guide",
          lifecycleStatus: "published",
          isCurrent: true,
          supersededById: null,
        },
        patchSource: {
          lifecycleStatus: "superseded",
          isCurrent: false,
          seriesKey,
        },
        auditNote:
          input.note ||
          `Superseded by version ${nv.versionLabel.trim()} (new file; old retained).`,
      };
    }
    case "create_draft":
      return {
        ok: true,
        action: input.action,
        fromStatus,
        toStatus: "draft",
        patchSource: { lifecycleStatus: "draft", isCurrent: false, seriesKey },
        auditNote: input.note,
      };
    default:
      return {
        ok: false,
        code: "UNKNOWN_ACTION",
        message: "Unknown lifecycle action.",
      };
  }
}

/**
 * Find current version in a series for "newer version exists" banners.
 */
export function findCurrentInSeries(
  seriesKey: string,
  rows: LifecycleResourceSnapshot[],
): LifecycleResourceSnapshot | null {
  const peers = rows.filter(
    (r) =>
      (r.seriesKey || defaultSeriesKey(r.id)) === seriesKey &&
      normalizeLifecycleStatus(r.lifecycleStatus) !== "retired",
  );
  const current = peers.find(
    (r) =>
      r.isCurrent !== false &&
      normalizeLifecycleStatus(r.lifecycleStatus) === "published",
  );
  if (current) return current;
  // Fallback: highest id published
  const published = peers
    .filter((r) => normalizeLifecycleStatus(r.lifecycleStatus) === "published")
    .sort((a, b) => b.id - a.id);
  return published[0] ?? null;
}

export function newerVersionNotice(
  resource: LifecycleResourceSnapshot,
  all: LifecycleResourceSnapshot[],
): {
  hasNewerVersion: boolean;
  currentVersion: {
    id: number;
    versionLabel: string;
    title: string;
  } | null;
  thisVersionLabel: string;
  isSuperseded: boolean;
  documentVersionLine: string;
} {
  const seriesKey =
    resource.seriesKey?.trim() || defaultSeriesKey(resource.id);
  const current = findCurrentInSeries(seriesKey, all);
  const thisLabel = resource.versionLabel || "1.0";
  const isSuperseded =
    normalizeLifecycleStatus(resource.lifecycleStatus) === "superseded" ||
    (current != null && current.id !== resource.id);
  const hasNewerVersion =
    current != null &&
    current.id !== resource.id &&
    normalizeLifecycleStatus(resource.lifecycleStatus) !== "retired";

  return {
    hasNewerVersion,
    currentVersion: current
      ? {
          id: current.id,
          versionLabel: current.versionLabel || "1.0",
          title: current.title,
        }
      : null,
    thisVersionLabel: thisLabel,
    isSuperseded,
    documentVersionLine: [
      versionBannerLabel(thisLabel),
      resource.publishedAt ? `Published ${resource.publishedAt.slice(0, 10)}` : null,
      resource.contentOwner ? `Owner: ${resource.contentOwner}` : null,
      resource.reviewer ? `Reviewer: ${resource.reviewer}` : null,
      isSuperseded && current
        ? `Superseded by ${versionBannerLabel(current.versionLabel)} (id ${current.id})`
        : null,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}
