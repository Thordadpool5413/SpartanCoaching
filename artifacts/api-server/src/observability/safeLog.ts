/**
 * Safe structured log field helpers (HSP-43).
 * Never log free-text tool inputs, PHI-like strings, cookies, or tokens.
 */

const SENSITIVE_KEY =
  /password|passwd|secret|token|authorization|cookie|set-cookie|api[_-]?key|private[_-]?key|ssn|phi|email|phone|body|prompt|message|content|notes|objection/i;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const LONG_PROSE = /\s{2,}|\b(patient|hospice|diagnosis|medicare)\b/i;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

/** Redact a single value for logs. */
export function redactLogValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 120) return "[redacted:long]";
    if (EMAIL_RE.test(value)) return "[redacted:email]";
    if (LONG_PROSE.test(value) && value.length > 40) return "[redacted:text]";
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((v) => redactLogValue(v, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(k)) {
        out[k] = "[redacted]";
        continue;
      }
      out[k] = redactLogValue(v, depth + 1);
    }
    return out;
  }
  return "[redacted]";
}

/**
 * Build a safe log object from arbitrary fields.
 * Drops sensitive keys entirely when `dropSensitiveKeys` is true (default).
 */
export function safeLogFields(
  fields: Record<string, unknown>,
  opts?: { dropSensitiveKeys?: boolean },
): Record<string, unknown> {
  const drop = opts?.dropSensitiveKeys !== false;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (drop && isSensitiveKey(k)) continue;
    out[k] = redactLogValue(v);
  }
  return out;
}
