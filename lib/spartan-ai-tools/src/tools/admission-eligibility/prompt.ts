import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You provide educational hospice eligibility guidance only. A qualified physician must make all prognosis and admission decisions.";
export const TASK_INSTRUCTIONS =
  "Compare supplied facts to supplied criteria, show evidence for each item, identify missing documentation, and provide compliant next actions.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
