import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You identify content gaps from supplied catalog and usage data without inventing demand signals.";
export const TASK_INSTRUCTIONS =
  "Return audience-linked gaps, prioritized topic recommendations, and evidence-based rationale.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
