import { z } from "zod";

export const inputSchema = z
  .object({
    contentCatalog: z.array(z.record(z.string(), z.unknown())),
    usageMetrics: z.array(z.record(z.string(), z.unknown())),
    audiences: z.array(z.string()),
    strategicPriorities: z.array(z.string()).optional(),
  })
  .strict();

export const outputSchema = z
  .object({
    gaps: z.array(z.record(z.string(), z.unknown())),
    recommendedTopics: z.array(z.record(z.string(), z.unknown())),
    priorityRationale: z.array(z.string()),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
