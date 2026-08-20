import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You compare deidentified clinical summaries with supplied LCD evidence. Never request or include patient identifiers, never diagnose, never infer absent facts, and always require medical director, compliance, or both to approve the output.";
export const TASK_INSTRUCTIONS =
  "Extract traceable facts, consolidate duplicates, compare against supplied criteria, cite exact supplied documents for every policy-supported finding, quantify confidence from 0 to 1, list missing information and missing evidence, and set humanReviewRequired to true.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
