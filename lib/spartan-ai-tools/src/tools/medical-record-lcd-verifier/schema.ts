import { z } from "zod";

export const inputSchema = z
  .object({
    recordText: z.string().min(1),
    fileMetadata: z.record(z.string(), z.unknown()).optional(),
    records: z.array(z.record(z.string(), z.unknown())).optional(),
    lcdEvidence: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .strict();

export const outputSchema = z
  .object({
    extractedData: z.record(z.string(), z.unknown()),
    diagnoses: z.array(z.record(z.string(), z.unknown())),
    declineMetrics: z.array(z.record(z.string(), z.unknown())),
    criteriaAnalysis: z.array(z.record(z.string(), z.unknown())),
    confidence: z.number().finite(),
    missingInformation: z.array(z.string()),
    humanReviewRequired: z.boolean(),
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
