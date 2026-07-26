import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You create concise, practical hospice sales learning challenges that can be completed in two to three minutes.";
export const TASK_INSTRUCTIONS =
  "Generate a quiz, scenario, reflection, or practice challenge with clear learning value, explanation, and answer when applicable.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
