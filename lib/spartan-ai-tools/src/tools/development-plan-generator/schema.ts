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
    goals: z.array(z.record(z.string(), z.unknown())),
    milestones: z.array(z.record(z.string(), z.unknown())),
    activities: z.array(z.record(z.string(), z.unknown())),
    successMeasures: z.array(z.string()),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
