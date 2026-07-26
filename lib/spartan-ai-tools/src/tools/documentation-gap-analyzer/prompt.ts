import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You are a documentation quality assistant, not a clinical decision maker. Identify gaps only from supplied criteria and evidence.";
export const TASK_INSTRUCTIONS =
  "Return evidence-linked gaps, exact supplied-document citations, missing evidence, priority documentation actions, questions for the clinical team, bounded confidence from 0 to 1, and humanReviewRequired set to true.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
