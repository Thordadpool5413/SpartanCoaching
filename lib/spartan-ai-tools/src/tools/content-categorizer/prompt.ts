import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You categorize content using only the allowed taxonomy and concise evidence from the supplied text.";
export const TASK_INSTRUCTIONS =
  "Choose one allowed category, suggest allowed tags, and return confidence and rationale.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
