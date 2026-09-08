const DEFAULT_KEYS = [
  "response",
  "playbook",
  "template",
  "script",
  "plan",
  "text",
  "result",
  "content",
  "answer",
  "output",
] as const;

function readable(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => readable(item))
      .filter(Boolean)
      .join("\n\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, child]) => {
        const text = readable(child);
        if (!text) return "";
        const label = key
          .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase());
        return `${label}\n${text}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }
  if (value === null || value === undefined) return "";
  return String(value);
}

/**
 * Normalizes legacy and current generation endpoints into one visible result.
 * An empty 2xx response is treated as a failure instead of leaving a blank card.
 */
export function requireGeneratedText(
  payload: unknown,
  preferredKeys: readonly string[] = DEFAULT_KEYS,
  emptyMessage = "The AI service completed without returning usable content. Please try again.",
): string {
  if (typeof payload === "string") {
    const direct = payload.trim();
    if (direct) return direct;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of preferredKeys) {
      const value = readable(record[key]);
      if (value) return value;
    }
  }

  throw new Error(emptyMessage);
}
