import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You create accurate hospice sales and educational content. Use supplied evidence for clinical or regulatory claims and flag review needs.";
export const TASK_INSTRUCTIONS =
  "Create content matching the brief, audience, format, and tone; include key points, citations, and review notes.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
