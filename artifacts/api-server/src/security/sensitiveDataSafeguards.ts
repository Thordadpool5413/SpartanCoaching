/**
 * PHI / sensitive-data safeguards for free text, analytics, logs, and notifications (HSP-18 Slice A).
 *
 * Builds on clinical/deidentification identifier rules. Provides detection,
 * redaction, blocking for high-risk free text, safe metadata stripping for
 * analytics, and helpers so sensitive text is not copied into URLs, push
 * payloads, crash metadata, or support tickets.
 *
 * IMPORTANT: These controls are product safety safeguards. They do NOT mean
 * the product is HIPAA-compliant. HIPAA requires complete technical, physical,
 * administrative, and contractual (BAA) controls beyond this module.
 */

import {
  findPotentialIdentifiers,
  type PotentialIdentifier,
} from "../clinical/deidentification";

export const SENSITIVE_DATA_SAFEGUARDS_VERSION = "sensitive-data-safeguards-v1";

/** Explicit product stance — never claim full HIPAA compliance from code alone. */
export const HIPAA_COMPLIANCE_CLAIM =
  "These safeguards reduce risk of accidental sensitive data exposure. They do not by themselves constitute HIPAA compliance or a completed BAA.";

export const SENSITIVE_DATA_WARNING =
  "Do not enter patient names, MRNs, dates of birth, SSNs, street addresses, or other identifying information. Describe situations in general operational terms only.";

export type SensitiveChannel =
  | "free_text"
  | "ai_prompt"
  | "analytics"
  | "notification"
  | "url"
  | "log"
  | "support_ticket"
  | "file_metadata";

export type SensitiveScanMode = "detect" | "redact" | "block";

export type SensitiveFinding = {
  code: PotentialIdentifier | "CREDIT_CARD_LIKE" | "LONG_FREE_TEXT_IN_METADATA";
  /** Never include the matched substring. */
  severity: "high" | "medium" | "low";
};

export type SensitiveScanResult = {
  findings: SensitiveFinding[];
  hasHighRisk: boolean;
  hasAny: boolean;
  /** Redacted text when mode is redact; otherwise original or null if blocked. */
  text: string | null;
  redacted: boolean;
  blocked: boolean;
  warnings: string[];
  mode: SensitiveScanMode;
  safeguardsVersion: string;
  hipaaNote: typeof HIPAA_COMPLIANCE_CLAIM;
};

const HIGH_RISK: ReadonlySet<string> = new Set([
  "SOCIAL_SECURITY_NUMBER",
  "MEDICAL_RECORD_NUMBER",
  "DATE_OF_BIRTH",
  "PATIENT_NAME",
  "POSTAL_ADDRESS",
  "CREDIT_CARD_LIKE",
]);

const EXTRA_RULES: Array<{
  code: SensitiveFinding["code"];
  pattern: RegExp;
  severity: SensitiveFinding["severity"];
}> = [
  {
    code: "CREDIT_CARD_LIKE",
    pattern: /\b(?:\d[ -]*?){13,19}\b/,
    severity: "high",
  },
];

const REDACTION_TOKEN = "[REDACTED]";

/** Keys allowed in analytics metadata (no free-form notes). */
export const ANALYTICS_METADATA_ALLOWLIST = new Set([
  "toolId",
  "toolName",
  "screen",
  "route",
  "source",
  "platform",
  "appVersion",
  "build",
  "durationMs",
  "status",
  "errorCode",
  "count",
  "step",
  "feature",
  "category",
  "success",
  "offline",
  "queued",
]);

/** Keys that must never appear in analytics / crash / support metadata. */
export const FORBIDDEN_METADATA_KEYS = new Set([
  "notes",
  "note",
  "transcript",
  "message",
  "body",
  "text",
  "content",
  "prompt",
  "input",
  "patient",
  "patientName",
  "mrn",
  "ssn",
  "dob",
  "email",
  "phone",
  "address",
  "freeText",
  "summary",
  "comments",
  "comment",
  "description",
  "query",
  "q",
]);

function severityFor(code: string): SensitiveFinding["severity"] {
  if (HIGH_RISK.has(code)) return "high";
  if (code === "EMAIL_ADDRESS" || code === "PHONE_NUMBER") return "medium";
  return "low";
}

function redactWithRules(text: string): string {
  let out = text;
  // Clinical identifier rules — replace matches without capturing groups for logs
  const patterns: RegExp[] = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    /(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]\d{3}[-.\s]\d{4}\b/g,
    /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g,
    /\b(?:mrn|medical\s+record|record\s+number|patient\s+id)\s*(?:#|number|no\.?|:|-)?\s*[A-Z0-9][A-Z0-9-]{3,}\b/gi,
    /\b(?:dob|date\s+of\s+birth|born)\s*(?:is|:|-)?\s*(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{4})\b/gi,
    /\b(?:patient|resident|beneficiary|member)(?:\s+name)?\s*(?:is|:|-)\s*[A-Z][A-Za-z'-]{1,}\s+[A-Z][A-Za-z'-]{1,}\b/gi,
    /\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way)\b/gi,
    /\b(?:\d[ -]*?){13,19}\b/g,
  ];
  for (const re of patterns) {
    out = out.replace(re, REDACTION_TOKEN);
  }
  return out;
}

/**
 * Scan free text for sensitive patterns. Never returns matched identifier text.
 */
export function scanSensitiveText(
  text: string,
  mode: SensitiveScanMode = "detect",
  channel: SensitiveChannel = "free_text",
): SensitiveScanResult {
  const findings: SensitiveFinding[] = [];
  const ids = findPotentialIdentifiers(text);
  for (const code of ids) {
    findings.push({ code, severity: severityFor(code) });
  }
  for (const rule of EXTRA_RULES) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(text)) {
      findings.push({ code: rule.code, severity: rule.severity });
    }
  }

  const hasHighRisk = findings.some((f) => f.severity === "high");
  const hasAny = findings.length > 0;
  const warnings = [SENSITIVE_DATA_WARNING];
  if (hasAny) {
    warnings.push(
      `Possible sensitive patterns detected (${findings.map((f) => f.code).join(", ")}). Codes only — values not logged.`,
    );
  }

  if (mode === "block" && hasHighRisk) {
    return {
      findings,
      hasHighRisk,
      hasAny,
      text: null,
      redacted: false,
      blocked: true,
      warnings: [
        ...warnings,
        `Blocked for channel ${channel}: remove high-risk identifiers before continuing.`,
      ],
      mode,
      safeguardsVersion: SENSITIVE_DATA_SAFEGUARDS_VERSION,
      hipaaNote: HIPAA_COMPLIANCE_CLAIM,
    };
  }

  if (mode === "redact" && hasAny) {
    return {
      findings,
      hasHighRisk,
      hasAny,
      text: redactWithRules(text),
      redacted: true,
      blocked: false,
      warnings,
      mode,
      safeguardsVersion: SENSITIVE_DATA_SAFEGUARDS_VERSION,
      hipaaNote: HIPAA_COMPLIANCE_CLAIM,
    };
  }

  return {
    findings,
    hasHighRisk,
    hasAny,
    text,
    redacted: false,
    blocked: false,
    warnings: hasAny ? warnings : [SENSITIVE_DATA_WARNING],
    mode,
    safeguardsVersion: SENSITIVE_DATA_SAFEGUARDS_VERSION,
    hipaaNote: HIPAA_COMPLIANCE_CLAIM,
  };
}

/**
 * Block high-risk free text for AI / notes paths. Throws with safe codes only.
 */
export function assertSafeFreeTextForAi(
  text: string,
  fieldName = "input",
): void {
  const result = scanSensitiveText(text, "block", "ai_prompt");
  if (result.blocked) {
    const err = new Error(
      `${fieldName} appears to contain patient-identifying or high-risk sensitive data. ${SENSITIVE_DATA_WARNING}`,
    ) as Error & { code: string; status: number; findings: string[] };
    err.code = "POTENTIAL_PHI_DETECTED";
    err.status = 400;
    err.findings = result.findings.map((f) => f.code);
    throw err;
  }
}

/**
 * Strip free-text and forbidden keys from analytics / crash / support metadata.
 * Values that look like identifiers are redacted; long free text is dropped.
 */
export function sanitizeAnalyticsMetadata(
  metadata: unknown,
): Record<string, unknown> | null {
  if (metadata == null) return null;
  let obj: Record<string, unknown>;
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
      }
      obj = parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (typeof metadata === "object" && !Array.isArray(metadata)) {
    obj = metadata as Record<string, unknown>;
  } else {
    return null;
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (FORBIDDEN_METADATA_KEYS.has(key) || key.toLowerCase().includes("patient")) {
      continue;
    }
    if (!ANALYTICS_METADATA_ALLOWLIST.has(key)) {
      // Drop unknown free-form keys rather than store arbitrary notes.
      if (typeof value === "string" && value.length > 40) continue;
      if (typeof value === "string") {
        const scan = scanSensitiveText(value, "detect", "analytics");
        if (scan.hasAny) continue;
        out[key] = value.slice(0, 80);
      } else if (
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        out[key] = value;
      }
      continue;
    }
    if (typeof value === "string") {
      const scan = scanSensitiveText(value, "redact", "analytics");
      if (scan.hasHighRisk) continue;
      out[key] = (scan.text ?? "").slice(0, 120);
    } else if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Prepare analytics event for persistence: scrub metadata, keep type/name short.
 */
export function sanitizeAnalyticsEvent(event: {
  eventType: string;
  eventName: string;
  metadata?: string | null;
  memberId?: number | null;
}): {
  eventType: string;
  eventName: string;
  metadata: string | null;
  memberId: number | null | undefined;
} {
  const eventType = String(event.eventType).slice(0, 64);
  const eventName = String(event.eventName).slice(0, 128);
  // Reject event names that look like free text notes
  if (scanSensitiveText(eventName, "detect", "analytics").hasHighRisk) {
    throw Object.assign(
      new Error("eventName must not contain sensitive identifiers"),
      { code: "POTENTIAL_PHI_DETECTED", status: 400 },
    );
  }
  let metaObj: unknown = null;
  if (event.metadata) {
    try {
      metaObj = JSON.parse(event.metadata);
    } catch {
      metaObj = null;
    }
  }
  const clean = sanitizeAnalyticsMetadata(metaObj);
  return {
    eventType,
    eventName,
    metadata: clean && Object.keys(clean).length ? JSON.stringify(clean) : null,
    memberId: event.memberId,
  };
}

/**
 * Reject sensitive text in URL query/path segments and push notification bodies.
 */
export function assertSafeForUrlOrNotification(
  text: string,
  channel: "url" | "notification" = "url",
): void {
  const result = scanSensitiveText(text, "block", channel);
  if (result.blocked || result.hasAny) {
    throw Object.assign(
      new Error(
        channel === "url"
          ? "Sensitive data must not appear in URLs."
          : "Sensitive data must not appear in push notifications.",
      ),
      { code: "SENSITIVE_DATA_CHANNEL_FORBIDDEN", status: 400 },
    );
  }
}

/**
 * Safe log fields: codes and lengths only — never raw free text.
 */
export function safeSensitiveLogFields(result: SensitiveScanResult): Record<
  string,
  unknown
> {
  return {
    safeguardsVersion: result.safeguardsVersion,
    findingCodes: result.findings.map((f) => f.code),
    findingCount: result.findings.length,
    hasHighRisk: result.hasHighRisk,
    blocked: result.blocked,
    redacted: result.redacted,
    mode: result.mode,
  };
}

/**
 * Recursively strip forbidden free-text keys from arbitrary objects (crash/support).
 */
export function stripSensitiveObjectFields(
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 8 || value == null) return value;
  if (typeof value === "string") {
    const scan = scanSensitiveText(value, "redact", "log");
    return scan.hasHighRisk ? REDACTION_TOKEN : (scan.text ?? value).slice(0, 200);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((v) => stripSensitiveObjectFields(v, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_METADATA_KEYS.has(k)) continue;
      out[k] = stripSensitiveObjectFields(v, depth + 1);
    }
    return out;
  }
  return value;
}

export type FileUploadSafety = {
  allowed: boolean;
  reason?: string;
  maxBytes: number;
  allowedMimePrefixes: string[];
};

/** Secure file handling defaults for non-clinical uploads. */
export function evaluateFileUploadSafety(input: {
  mimeType?: string | null;
  sizeBytes?: number | null;
  fileName?: string | null;
}): FileUploadSafety {
  const maxBytes = 10 * 1024 * 1024;
  const allowedMimePrefixes = [
    "image/",
    "application/pdf",
    "text/plain",
    "text/csv",
  ];
  if (input.sizeBytes != null && input.sizeBytes > maxBytes) {
    return {
      allowed: false,
      reason: "File exceeds 10 MB limit",
      maxBytes,
      allowedMimePrefixes,
    };
  }
  if (input.mimeType) {
    const ok = allowedMimePrefixes.some(
      (p) => input.mimeType === p || input.mimeType!.startsWith(p),
    );
    if (!ok) {
      return {
        allowed: false,
        reason: "MIME type not allowed for general uploads",
        maxBytes,
        allowedMimePrefixes,
      };
    }
  }
  if (input.fileName) {
    const scan = scanSensitiveText(input.fileName, "detect", "file_metadata");
    if (scan.hasHighRisk) {
      return {
        allowed: false,
        reason: "File name appears to contain sensitive identifiers",
        maxBytes,
        allowedMimePrefixes,
      };
    }
  }
  return { allowed: true, maxBytes, allowedMimePrefixes };
}

/** Retention guidance constants (product policy, not auto-enforcement for all tables). */
export const RETENTION_POLICY = {
  analyticsMetadataDays: 365,
  aiPromptLogs: "do_not_store_raw_prompts",
  supportTickets: "no_phi_or_identifiers",
  clinicalPhi: "clinical_retention_sweep_only",
  note: "Clinical PHI retention is handled by clinical retention sweep. Field-kit free text should never store PHI.",
} as const;
