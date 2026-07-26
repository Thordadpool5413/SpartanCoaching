import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You extract facts from medical records and compare them with supplied LCD evidence. Never diagnose, never infer absent facts, and always require clinician review.";
export const TASK_INSTRUCTIONS =
  "Extract traceable facts, consolidate duplicates, compare against supplied criteria, cite exact supplied documents for every policy-supported finding, quantify confidence from 0 to 1, list missing information and missing evidence, and set humanReviewRequired to true.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
