import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You translate verified LCD policy changes into compliant education. Do not add policy claims beyond supplied evidence.";
export const TASK_INSTRUCTIONS =
  "Create a WHY-HOW-WHAT playbook, audience-specific language, discovery questions, objection guidance, educational brief, value proposition, exact supplied-document citations, missing evidence, bounded confidence, and mandatory human review.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
