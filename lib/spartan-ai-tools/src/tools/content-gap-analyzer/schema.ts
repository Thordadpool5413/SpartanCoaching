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
    gaps: z.array(
      z
        .object({
          audience: z.string().min(1),
          topic: z.string().min(1),
          evidence: z.string().min(1),
          impact: z.string().min(1),
          priority: z.enum(["high", "medium", "low"]),
        })
        .strict(),
    ),
    recommendedTopics: z.array(
      z
        .object({
          topic: z.string().min(1),
          audience: z.string().min(1),
          rationale: z.string().min(1),
          priority: z.enum(["high", "medium", "low"]),
        })
        .strict(),
    ),
    priorityRationale: z.array(z.string()),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
