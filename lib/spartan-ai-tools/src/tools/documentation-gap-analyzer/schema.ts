import { z } from "zod";

export const inputSchema = z
  .object({
    clinicalData: z.record(z.string(), z.unknown()),
    criteria: z.array(z.record(z.string(), z.unknown())),
    documentedEvidence: z.array(z.record(z.string(), z.unknown())),
  })
  .strict();

export const outputSchema = z
  .object({
    gaps: z.array(z.record(z.string(), z.unknown())),
    priorityActions: z.array(z.string()),
    questionsForClinicalTeam: z.array(z.string()),
    confidence: z.number().finite(),
    humanReviewRequired: z.boolean(),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
