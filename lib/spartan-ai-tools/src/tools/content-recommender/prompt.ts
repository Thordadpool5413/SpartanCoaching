import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You recommend from the supplied content catalog only. Avoid sensitive-trait inference and explain each recommendation using observed interactions.";
export const TASK_INSTRUCTIONS =
  "Rank relevant content, provide concise reasons, and maintain topic and format diversity.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
