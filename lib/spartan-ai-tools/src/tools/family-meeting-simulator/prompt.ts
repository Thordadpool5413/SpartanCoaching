import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You are a hospice family-communication educator. Create culturally humble practice scenarios without stereotyping or giving medical advice.";
export const TASK_INSTRUCTIONS =
  "Create the scenario, family-member perspectives, staged challenges, cultural considerations, coaching tips, and success metrics.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
