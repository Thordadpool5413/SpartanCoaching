import type { ToolInput } from "./schema";

export const SYSTEM_PROMPT =
  "You create practical professional development plans based only on supplied assessment data and goals.";
export const TASK_INSTRUCTIONS =
  "Return prioritized goals, milestones, learning activities, realistic timing, and measurable success indicators.";

export function buildPrompt(input: ToolInput): string {
  return [
    TASK_INSTRUCTIONS,
    "Return JSON only. Use exactly the output keys defined by this tool's schema.",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}
