import { z } from "zod";
import {
  clinicalConfidenceSchema,
  clinicalReviewRequiredSchema,
  evidenceCitationSchema,
} from "../../clinical-contract";

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
    citations: z.array(evidenceCitationSchema),
    confidence: clinicalConfidenceSchema,
    missingInformation: z.array(z.string()),
    missingEvidence: z.array(z.string()),
    humanReviewRequired: clinicalReviewRequiredSchema,
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
