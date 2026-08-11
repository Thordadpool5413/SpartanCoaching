/**
 * Executable resource catalog + work validation (HSP-26 Slice A).
 *
 * Interactive templates that can be completed in-product (not only PDF download).
 * Form payloads are free-text field maps — never store PHI intentionally;
 * validation is structural (length / required for complete).
 */

export const EXECUTABLE_RESOURCES_VERSION = "executable-resources-v1";

export type ExecutableResourceDefinition = {
  resourceKey: string;
  title: string;
  description: string;
  audience: string[];
  whenToUse: string;
  expectedOutcome: string;
  completionTimeMinutes: number;
  relatedToolIds: string[];
  formats: Array<"interactive" | "print" | "pdf_download">;
  formSchemaVersion: string;
  /** Web route for desktop interactive workflow */
  webPath: string;
  /** Optional catalog resource id when known; null for template-only keys */
  catalogResourceId: number | null;
  /** Fields required to mark status=completed */
  requiredForComplete: string[];
};

/** Slice A: weekly plan is the first fully interactive + save/resume path. */
export const EXECUTABLE_RESOURCES: Record<string, ExecutableResourceDefinition> =
  {
    "weekly-plan": {
      resourceKey: "weekly-plan",
      title: "Spartan Weekly Plan",
      description:
        "Interactive weekly territory plan: objective, daily priorities, metrics, focus accounts, and reflection.",
      audience: ["hospice_sales_rep", "new_hire"],
      whenToUse:
        "Sunday night or Monday morning before the week starts — not during a patient-specific clinical decision.",
      expectedOutcome:
        "A filled weekly plan you can resume on another device, print, or export.",
      completionTimeMinutes: 15,
      relatedToolIds: ["weekly-planner", "objection"],
      formats: ["interactive", "print", "pdf_download"],
      formSchemaVersion: "weekly-plan-v1",
      webPath: "/resources/weekly-plan",
      catalogResourceId: null,
      requiredForComplete: ["weekOf", "primaryObjective"],
    },
  };

export type WorkStatus = "draft" | "completed";

export type ResourceWorkPayload = {
  resourceKey: string;
  title?: string;
  status?: WorkStatus;
  formData?: Record<string, unknown>;
  resourceId?: number | null;
};

export type ValidationResult = {
  ok: boolean;
  errors: string[];
  sanitizedFormData: Record<string, unknown>;
  status: WorkStatus;
};

const MAX_FIELD_LEN = 2_000;
const MAX_KEYS = 80;

function trimField(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim().slice(0, MAX_FIELD_LEN);
}

/**
 * Sanitize form data: string/number/boolean/nested shallow maps only.
 * Drops oversized structures. Does not invent clinical content.
 */
export function sanitizeFormData(
  input: unknown,
): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, unknown> = {};
  const entries = Object.entries(input as Record<string, unknown>).slice(
    0,
    MAX_KEYS,
  );
  for (const [key, value] of entries) {
    const k = String(key).slice(0, 80);
    if (!k) continue;
    if (typeof value === "string") {
      out[k] = value.trim().slice(0, MAX_FIELD_LEN);
    } else if (typeof value === "number" && Number.isFinite(value)) {
      out[k] = value;
    } else if (typeof value === "boolean") {
      out[k] = value;
    } else if (Array.isArray(value)) {
      out[k] = value
        .slice(0, 20)
        .map((item) =>
          typeof item === "string"
            ? item.trim().slice(0, MAX_FIELD_LEN)
            : typeof item === "number" && Number.isFinite(item)
              ? item
              : null,
        )
        .filter((x) => x !== null);
    } else if (value && typeof value === "object") {
      const nested: Record<string, unknown> = {};
      for (const [nk, nv] of Object.entries(
        value as Record<string, unknown>,
      ).slice(0, 20)) {
        if (typeof nv === "string") nested[nk] = nv.trim().slice(0, MAX_FIELD_LEN);
        else if (typeof nv === "number" && Number.isFinite(nv)) nested[nk] = nv;
      }
      out[k] = nested;
    }
  }
  return out;
}

export function getExecutableDefinition(
  resourceKey: string,
): ExecutableResourceDefinition | null {
  return EXECUTABLE_RESOURCES[resourceKey] ?? null;
}

export function listExecutableResources(): ExecutableResourceDefinition[] {
  return Object.values(EXECUTABLE_RESOURCES);
}

/**
 * Validate and normalize a save payload for an executable resource.
 */
export function validateResourceWorkSave(
  resourceKey: string,
  payload: {
    formData?: unknown;
    status?: string;
    title?: string;
  },
): ValidationResult {
  const def = getExecutableDefinition(resourceKey);
  const errors: string[] = [];
  if (!def) {
    errors.push("UNKNOWN_RESOURCE_KEY");
    return {
      ok: false,
      errors,
      sanitizedFormData: {},
      status: "draft",
    };
  }

  const formData = sanitizeFormData(payload.formData);
  let status: WorkStatus =
    payload.status === "completed" ? "completed" : "draft";

  if (status === "completed") {
    for (const field of def.requiredForComplete) {
      const val = formData[field];
      if (typeof val !== "string" || !val.trim()) {
        errors.push(`REQUIRED_${field}`);
      }
    }
    if (errors.length) {
      // Soft-fail complete → keep draft so user can resume
      status = "draft";
    }
  }

  // Light success signal: weekOf alone is enough for a non-empty draft
  if (
    status === "draft" &&
    Object.keys(formData).length === 0 &&
    payload.status === "completed"
  ) {
    errors.push("EMPTY_FORM");
  }

  return {
    ok: errors.filter((e) => e === "UNKNOWN_RESOURCE_KEY" || e === "EMPTY_FORM")
      .length === 0,
    errors,
    sanitizedFormData: formData,
    status,
  };
}

/** Detail metadata for UI (purpose, audience, timing, formats). */
export function resourceDetailFromExecutable(
  resourceKey: string,
): (ExecutableResourceDefinition & { executable: true }) | null {
  const def = getExecutableDefinition(resourceKey);
  if (!def) return null;
  return { ...def, executable: true };
}

export function fieldPresent(formData: Record<string, unknown>, key: string): boolean {
  const v = formData[key];
  return typeof v === "string" ? v.trim().length > 0 : v !== undefined && v !== null;
}
