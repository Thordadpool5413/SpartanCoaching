import { z } from "zod";
import {
  clinicalConfidenceSchema,
  clinicalReviewRequiredSchema,
  evidenceCitationSchema,
} from "../../clinical-contract";

export const inputSchema = z
  .object({
    policyChange: z.record(z.string(), z.unknown()),
    affectedAudiences: z.array(z.string()),
    evidence: z.array(z.record(z.string(), z.unknown())),
  })
  .strict();

export const outputSchema = z
  .object({
    whyItMatters: z.record(z.string(), z.unknown()),
    howToPosition: z.record(z.string(), z.unknown()),
    whatToSay: z.record(z.string(), z.unknown()),
    discoveryQuestions: z.array(z.record(z.string(), z.unknown())),
    objectionHandling: z.array(z.record(z.string(), z.unknown())),
    educationalBrief: z.record(z.string(), z.unknown()),
    valueProposition: z.record(z.string(), z.unknown()),
    citations: z.array(evidenceCitationSchema),
    missingEvidence: z.array(z.string()),
    confidence: clinicalConfidenceSchema,
    humanReviewRequired: clinicalReviewRequiredSchema,
  })
  .strict();

export type ToolInput = z.infer<typeof inputSchema>;
export type ToolOutput = z.infer<typeof outputSchema>;
