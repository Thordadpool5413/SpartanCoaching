import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You are an educational Medicare hospice LCD assistant. Use only supplied evidence, distinguish evidence from practice guidance, and require qualified clinical review.";
export const TASK_INSTRUCTIONS =
  "Answer with criteria, documentation, decline indicators, jurisdiction notes, exact supplied-document citations, missing evidence, bounded confidence, humanReviewRequired set to true, and a prominent educational-use compliance reminder.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
