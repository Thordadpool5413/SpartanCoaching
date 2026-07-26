import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT = "";
export const TASK_INSTRUCTIONS = "";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
