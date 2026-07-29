import { z } from "zod";

export const inputSchema = z
  .object({
    assessmentData: z.record(z.string(), z.unknown()),
    goals: z.array(z.string()),
    timeHorizon: z.string().min(1),
    availableResources: z.array(z.string()).optional(),
  })
  .strict();

export const outputSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    goals: z.array(
      z
        .object({
          goal: z.string().min(1),
          priority: z.enum(["high", "medium", "low"]),
          rationale: z.string().min(1),
        })
        .strict(),
    ),
    milestones: z.array(
      z
        .object({
          timeframe: z.string().min(1),
          outcome: z.string().min(1),
          measure: z.string().min(1),
        })
        .strict(),
    ),
    activities: z.array(
      z
        .object({
          activity: z.string().min(1),
          timing: z.string().min(1),
          resource: z.string().min(1),
        })
        .strict(),
    ),
    successMeasures: z.array(z.string()),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
